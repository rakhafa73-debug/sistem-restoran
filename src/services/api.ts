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

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `Permintaan gagal dengan status ${res.status}`);
    }

    return data as T;
  }

  // Public Table & Menu
  async getTableInfo(token: string) {
    return this.request<{
      table: { id: string; table_number: string; capacity: number };
      restaurant: { name: string; tagline: string; is_open: boolean; tax_rate_percent: number; service_charge_percent: number };
    }>(`/public/tables/${token}`);
  }

  async getPublicMenu() {
    return this.request<{
      restaurant: Restaurant;
      categories: Category[];
      items: MenuItem[];
    }>('/public/menu');
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
    return this.request<{
      success: boolean;
      message: string;
      order: Order;
    }>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getOrder(orderId: string, customToken?: string) {
    const headers: Record<string, string> = {};
    if (customToken) {
      headers['x-customer-token'] = customToken;
    }
    return this.request<{ order: Order }>(`/orders/${orderId}`, { headers });
  }

  async cancelOrder(orderId: string, reason?: string) {
    return this.request<{ success: boolean; order: Order }>(`/orders/${orderId}/cancel-request`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Kitchen
  async getKitchenOrders() {
    return this.request<{ orders: Order[] }>('/kitchen/orders', {
      headers: { 'x-staff-role': 'kitchen' },
    });
  }

  async updateKitchenStatus(orderId: string, status: OrderStatus, notes?: string) {
    return this.request<{ success: boolean; order: Order }>(`/kitchen/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'x-staff-role': 'kitchen' },
      body: JSON.stringify({ status, notes }),
    });
  }

  // Cashier
  async getCashierOrders() {
    return this.request<{ orders: Order[] }>('/cashier/orders', {
      headers: { 'x-staff-role': 'cashier' },
    });
  }

  async processCashPayment(orderId: string, amount_tendered: number, idempotency_key?: string) {
    return this.request<{
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
  }

  // Admin
  async getAdminReports() {
    return this.request<{
      report: {
        total_sales: number;
        total_tax: number;
        total_service: number;
        total_orders: number;
        paid_orders_count: number;
        cancelled_orders_count: number;
        average_order_value: number;
        top_selling_items: Array<{ name: string; quantity: number; revenue: number }>;
        recent_payments: Array<any>;
      };
    }>('/admin/reports', {
      headers: { 'x-staff-role': 'admin' },
    });
  }

  async getAdminTables() {
    return this.request<{ tables: DiningTable[] }>('/admin/tables', {
      headers: { 'x-staff-role': 'admin' },
    });
  }

  async createTable(table_number: string, capacity: number) {
    return this.request<{ table: DiningTable }>('/admin/tables', {
      method: 'POST',
      headers: { 'x-staff-role': 'admin' },
      body: JSON.stringify({ table_number, capacity }),
    });
  }

  async updateTable(id: string, updates: Partial<DiningTable>) {
    return this.request<{ table: DiningTable }>(`/admin/tables/${id}`, {
      method: 'PUT',
      headers: { 'x-staff-role': 'admin' },
      body: JSON.stringify(updates),
    });
  }

  async regenerateQR(id: string) {
    return this.request<{ table: DiningTable }>(`/admin/tables/${id}/regenerate-qr`, {
      method: 'POST',
      headers: { 'x-staff-role': 'admin' },
    });
  }

  async getAdminMenu() {
    return this.request<{ menuItems: MenuItem[] }>('/admin/menu', {
      headers: { 'x-staff-role': 'admin' },
    });
  }

  async createMenuItem(data: Partial<MenuItem>) {
    return this.request<{ item: MenuItem }>('/admin/menu', {
      method: 'POST',
      headers: { 'x-staff-role': 'admin' },
      body: JSON.stringify(data),
    });
  }

  async updateMenuItem(id: string, updates: Partial<MenuItem>) {
    return this.request<{ item: MenuItem }>(`/admin/menu/${id}`, {
      method: 'PUT',
      headers: { 'x-staff-role': 'admin' },
      body: JSON.stringify(updates),
    });
  }

  async deleteMenuItem(id: string) {
    return this.request<{ success: boolean }>(`/admin/menu/${id}`, {
      method: 'DELETE',
      headers: { 'x-staff-role': 'admin' },
    });
  }

  async getAdminCategories() {
    return this.request<{ categories: Category[] }>('/admin/categories', {
      headers: { 'x-staff-role': 'admin' },
    });
  }

  async createCategory(name: string, icon?: string) {
    return this.request<{ category: Category }>('/admin/categories', {
      method: 'POST',
      headers: { 'x-staff-role': 'admin' },
      body: JSON.stringify({ name, icon }),
    });
  }

  async getAdminStaff() {
    return this.request<{ profiles: Profile[] }>('/admin/staff', {
      headers: { 'x-staff-role': 'admin' },
    });
  }

  async createStaff(name: string, email: string, role: Role) {
    return this.request<{ profile: Profile }>('/admin/staff', {
      method: 'POST',
      headers: { 'x-staff-role': 'admin' },
      body: JSON.stringify({ name, email, role }),
    });
  }

  async getAdminSettings() {
    return this.request<{ restaurant: Restaurant }>('/admin/settings', {
      headers: { 'x-staff-role': 'admin' },
    });
  }

  async updateAdminSettings(settings: Partial<Restaurant>) {
    return this.request<{ restaurant: Restaurant }>('/admin/settings', {
      method: 'PUT',
      headers: { 'x-staff-role': 'admin' },
      body: JSON.stringify(settings),
    });
  }

  async getAuditLogs() {
    return this.request<{ logs: Array<any> }>('/admin/audit-logs', {
      headers: { 'x-staff-role': 'admin' },
    });
  }

  // Auth
  async login(email: string, password = 'dineqr123') {
    return this.request<{
      token: string;
      user: { id: string; name: string; email: string; role: Role };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe() {
    return this.request<{ user: Profile | null }>('/auth/me');
  }

  async logout() {
    return this.request<{ success: boolean }>('/auth/logout', { method: 'POST' });
  }
}

export const api = new ApiService();
