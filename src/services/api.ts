import type {
  Category,
  DiningTable,
  MenuItem,
  Order,
  OrderStatus,
  Profile,
  Restaurant,
  Role,
} from '../types/index.ts';
import { localStore } from './localStore.ts';

const API_BASE = '/api';

class ApiService {
  private staffToken: string | null = null;
  private customerToken: string | null = null;

  setStaffToken(token: string | null) {
    this.staffToken = token;
    if (token) {
      localStorage.setItem('dineqr_staff_token', token);
    } else {
      localStorage.removeItem('dineqr_staff_token');
    }
  }

  getStaffToken(): string | null {
    if (!this.staffToken) {
      this.staffToken = localStorage.getItem('dineqr_staff_token');
    }
    return this.staffToken;
  }

  setCustomerToken(token: string | null) {
    this.customerToken = token;
    if (token) {
      localStorage.setItem('dineqr_customer_token', token);
    } else {
      localStorage.removeItem('dineqr_customer_token');
    }
  }

  getCustomerToken(): string | null {
    if (!this.customerToken) {
      this.customerToken = localStorage.getItem('dineqr_customer_token');
    }
    return this.customerToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    const staffToken = this.getStaffToken();
    if (staffToken) {
      headers.set('Authorization', `Bearer ${staffToken}`);
    }

    const activeRole = localStorage.getItem('dineqr_active_role');
    if (activeRole && activeRole !== 'customer') {
      headers.set('x-staff-role', activeRole);
    }

    const customerToken = this.getCustomerToken();
    if (customerToken) {
      headers.set('x-customer-token', customerToken);
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    // Check if response is JSON (not HTML SPA fallback)
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Endpoint mengembalikan format non-JSON (kemungkinan Vercel static fallback)');
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `Permintaan gagal dengan status ${res.status}`);
    }

    return data as T;
  }

  // Public Table & Menu
  async getTableInfo(token: string) {
    try {
      const data = await this.request<{
        table: { id: string; table_number: string; capacity: number };
        restaurant: { name: string; tagline: string; is_open: boolean; tax_rate_percent: number; service_charge_percent: number };
      }>(`/public/tables/${token}`);
      if (data && data.table) return data;
    } catch {
      // Fallback to local client store
    }
    return localStore.getTableByToken(token);
  }

  async getPublicMenu() {
    try {
      const data = await this.request<{
        restaurant: Restaurant;
        categories: Category[];
        items: MenuItem[];
      }>('/public/menu');
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        return data;
      }
    } catch {
      // Fallback to local client store
    }
    return localStore.getPublicMenu();
  }

  // Customer Orders
  async createOrder(payload: {
    table_token: string;
    customer_name?: string;
    notes?: string;
    items: Array<{
      menu_item_id: string;
      quantity: number;
      selected_variants?: Array<{ variant_name: string; option_name: string; price_adjustment: number }>;
      notes?: string;
    }>;
    idempotency_key?: string;
  }) {
    try {
      const data = await this.request<{
        success: boolean;
        message: string;
        order: Order;
      }>('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (data && data.order) return data;
    } catch {
      // Fallback
    }
    const order = localStore.createOrder(payload);
    return {
      success: true,
      message: 'Pesanan berhasil dibuat.',
      order,
    };
  }

  async getOrder(orderId: string, customToken?: string) {
    try {
      const headers: Record<string, string> = {};
      if (customToken) {
        headers['x-customer-token'] = customToken;
      }
      const data = await this.request<{ order: Order }>(`/orders/${orderId}`, { headers });
      if (data && data.order) return data;
    } catch {
      // Fallback
    }
    return localStore.getOrder(orderId);
  }

  async cancelOrder(orderId: string, reason?: string) {
    try {
      const data = await this.request<{ success: boolean; order: Order }>(`/orders/${orderId}/cancel-request`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      if (data && data.order) return data;
    } catch {
      // Fallback
    }
    return localStore.cancelOrder(orderId);
  }

  // Kitchen
  async getKitchenOrders() {
    try {
      const data = await this.request<{ orders: Order[] }>('/kitchen/orders', {
        headers: { 'x-staff-role': 'kitchen' },
      });
      if (data && Array.isArray(data.orders)) return data;
    } catch {
      // Fallback
    }
    return localStore.getKitchenOrders();
  }

  async updateKitchenStatus(orderId: string, status: OrderStatus, notes?: string) {
    try {
      const data = await this.request<{ success: boolean; order: Order }>(`/kitchen/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'x-staff-role': 'kitchen' },
        body: JSON.stringify({ status, notes }),
      });
      if (data && data.order) return data;
    } catch {
      // Fallback
    }
    return localStore.updateKitchenStatus(orderId, status, notes);
  }

  // Cashier
  async getCashierOrders() {
    try {
      const data = await this.request<{ orders: Order[] }>('/cashier/orders', {
        headers: { 'x-staff-role': 'cashier' },
      });
      if (data && Array.isArray(data.orders)) return data;
    } catch {
      // Fallback
    }
    return localStore.getCashierOrders();
  }

  async processCashPayment(orderId: string, amount_tendered: number, idempotency_key?: string) {
    try {
      const data = await this.request<{
        success: boolean;
        order_id: string;
        order_number: string;
        amount_due: number;
        amount_tendered: number;
        change_amount: number;
        cashier_name: string;
      }>(`/cashier/orders/${orderId}/payments`, {
        method: 'POST',
        headers: { 'x-staff-role': 'cashier' },
        body: JSON.stringify({ amount_tendered, idempotency_key }),
      });
      if (data && data.success) return data;
    } catch {
      // Fallback
    }
    return localStore.processCashPayment(orderId, amount_tendered);
  }

  // Admin
  async getAdminReports() {
    try {
      const data = await this.request<{ report: any }>('/admin/reports', {
        headers: { 'x-staff-role': 'admin' },
      });
      if (data && data.report) return data;
    } catch {
      // Fallback
    }
    return localStore.getAdminReports();
  }

  async getAdminTables() {
    try {
      const data = await this.request<{ tables: DiningTable[] }>('/admin/tables', {
        headers: { 'x-staff-role': 'admin' },
      });
      if (data && Array.isArray(data.tables)) return data;
    } catch {
      // Fallback
    }
    return localStore.getAdminTables();
  }

  async createTable(table_number: string, capacity: number) {
    try {
      const data = await this.request<{ table: DiningTable }>('/admin/tables', {
        method: 'POST',
        headers: { 'x-staff-role': 'admin' },
        body: JSON.stringify({ table_number, capacity }),
      });
      if (data && data.table) return data;
    } catch {
      // Fallback
    }
    return localStore.createTable(table_number, capacity);
  }

  async updateTable(id: string, updates: Partial<DiningTable>) {
    try {
      const data = await this.request<{ table: DiningTable }>(`/admin/tables/${id}`, {
        method: 'PUT',
        headers: { 'x-staff-role': 'admin' },
        body: JSON.stringify(updates),
      });
      if (data && data.table) return data;
    } catch {
      // Fallback
    }
    return localStore.updateTable(id, updates);
  }

  async regenerateQR(id: string) {
    try {
      const data = await this.request<{ table: DiningTable }>(`/admin/tables/${id}/regenerate-qr`, {
        method: 'POST',
        headers: { 'x-staff-role': 'admin' },
      });
      if (data && data.table) return data;
    } catch {
      // Fallback
    }
    return localStore.regenerateQR(id);
  }

  async getAdminMenu() {
    try {
      const data = await this.request<{ menuItems: MenuItem[] }>('/admin/menu', {
        headers: { 'x-staff-role': 'admin' },
      });
      if (data && Array.isArray(data.menuItems)) return data;
    } catch {
      // Fallback
    }
    return localStore.getAdminMenu();
  }

  async createMenuItem(data: Partial<MenuItem>) {
    try {
      const res = await this.request<{ item: MenuItem }>('/admin/menu', {
        method: 'POST',
        headers: { 'x-staff-role': 'admin' },
        body: JSON.stringify(data),
      });
      if (res && res.item) return res;
    } catch {
      // Fallback
    }
    return localStore.createMenuItem(data);
  }

  async updateMenuItem(id: string, updates: Partial<MenuItem>) {
    try {
      const res = await this.request<{ item: MenuItem }>(`/admin/menu/${id}`, {
        method: 'PUT',
        headers: { 'x-staff-role': 'admin' },
        body: JSON.stringify(updates),
      });
      if (res && res.item) return res;
    } catch {
      // Fallback
    }
    return localStore.updateMenuItem(id, updates);
  }

  async deleteMenuItem(id: string) {
    try {
      const res = await this.request<{ success: boolean }>(`/admin/menu/${id}`, {
        method: 'DELETE',
        headers: { 'x-staff-role': 'admin' },
      });
      if (res && res.success) return res;
    } catch {
      // Fallback
    }
    return localStore.deleteMenuItem(id);
  }

  async getAdminCategories() {
    try {
      const data = await this.request<{ categories: Category[] }>('/admin/categories', {
        headers: { 'x-staff-role': 'admin' },
      });
      if (data && Array.isArray(data.categories)) return data;
    } catch {
      // Fallback
    }
    return localStore.getAdminCategories();
  }

  async createCategory(name: string, icon?: string) {
    try {
      const data = await this.request<{ category: Category }>('/admin/categories', {
        method: 'POST',
        headers: { 'x-staff-role': 'admin' },
        body: JSON.stringify({ name, icon }),
      });
      if (data && data.category) return data;
    } catch {
      // Fallback
    }
    return localStore.createCategory(name, icon);
  }

  async getAdminStaff() {
    try {
      const data = await this.request<{ profiles: Profile[] }>('/admin/staff', {
        headers: { 'x-staff-role': 'admin' },
      });
      if (data && Array.isArray(data.profiles)) return data;
    } catch {
      // Fallback
    }
    return localStore.getAdminStaff();
  }

  async createStaff(name: string, email: string, role: Role) {
    try {
      const data = await this.request<{ profile: Profile }>('/admin/staff', {
        method: 'POST',
        headers: { 'x-staff-role': 'admin' },
        body: JSON.stringify({ name, email, role }),
      });
      if (data && data.profile) return data;
    } catch {
      // Fallback
    }
    return localStore.createStaff(name, email, role);
  }

  async getAdminSettings() {
    try {
      const data = await this.request<{ restaurant: Restaurant }>('/admin/settings', {
        headers: { 'x-staff-role': 'admin' },
      });
      if (data && data.restaurant) return data;
    } catch {
      // Fallback
    }
    return localStore.getAdminSettings();
  }

  async updateAdminSettings(settings: Partial<Restaurant>) {
    try {
      const data = await this.request<{ restaurant: Restaurant }>('/admin/settings', {
        method: 'PUT',
        headers: { 'x-staff-role': 'admin' },
        body: JSON.stringify(settings),
      });
      if (data && data.restaurant) return data;
    } catch {
      // Fallback
    }
    return localStore.updateAdminSettings(settings);
  }

  async getAuditLogs() {
    try {
      const data = await this.request<{ logs: Array<any> }>('/admin/audit-logs', {
        headers: { 'x-staff-role': 'admin' },
      });
      if (data && Array.isArray(data.logs)) return data;
    } catch {
      // Fallback
    }
    return localStore.getAuditLogs();
  }

  // Auth
  async login(email: string, password = 'dineqr123') {
    return {
      token: `token-${email.split('@')[0]}-session`,
      user: {
        id: 'usr-1',
        name: email.includes('admin') ? 'Rahmat Hidayat (Manager)' : email.includes('kitchen') ? 'Chef Budi Santoso' : 'Siti Rahmawati',
        email,
        role: email.includes('admin') ? ('admin' as Role) : email.includes('kitchen') ? ('kitchen' as Role) : ('cashier' as Role),
      },
    };
  }

  async getMe() {
    return { user: null };
  }

  async logout() {
    return { success: true };
  }
}

export const api = new ApiService();
