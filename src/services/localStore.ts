import type {
  Category,
  DiningTable,
  MenuItem,
  Order,
  OrderStatus,
  Payment,
  Profile,
  Restaurant,
  Role,
} from '../types/index.ts';

/**
 * Client-Side Local Database Store Fallback
 * Provides 100% operational functionality when running on static hosts
 * like Vercel (without active persistent Node.js Express server).
 */

const defaultRestaurant: Restaurant = {
  id: 'a1000000-0000-0000-0000-000000000001',
  name: 'Nusantara Rasa Signature',
  tagline: 'Cita Rasa Autentik Warisan Nusantara',
  address: 'Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan',
  phone: '+62 812-3456-7890',
  tax_rate_percent: 10,
  service_charge_percent: 5,
  is_open: true,
  currency: 'IDR',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const defaultTables: DiningTable[] = [
  { id: 't1', restaurant_id: 'a1', table_number: 'Meja 01', qr_token: 'tbl_token_m01_nusantara', capacity: 2, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 't2', restaurant_id: 'a1', table_number: 'Meja 02', qr_token: 'tbl_token_m02_nusantara', capacity: 4, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 't3', restaurant_id: 'a1', table_number: 'Meja 03', qr_token: 'tbl_token_m03_nusantara', capacity: 4, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 't4', restaurant_id: 'a1', table_number: 'Meja 04', qr_token: 'tbl_token_m04_nusantara', capacity: 6, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 't5', restaurant_id: 'a1', table_number: 'Meja 05 (VIP)', qr_token: 'tbl_token_m05_nusantara', capacity: 8, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 't6', restaurant_id: 'a1', table_number: 'Meja 06 (Outdoor)', qr_token: 'tbl_token_m06_nusantara', capacity: 4, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const defaultCategories: Category[] = [
  { id: 'c1', restaurant_id: 'a1', name: 'Makanan Utama', icon: 'UtensilsCrossed', sort_order: 1, is_active: true },
  { id: 'c2', restaurant_id: 'a1', name: 'Camilan & Pembuka', icon: 'Pizza', sort_order: 2, is_active: true },
  { id: 'c3', restaurant_id: 'a1', name: 'Minuman Segar', icon: 'Coffee', sort_order: 3, is_active: true },
  { id: 'c4', restaurant_id: 'a1', name: 'Dessert Manis', icon: 'IceCream', sort_order: 4, is_active: true },
];

const defaultMenuItems: MenuItem[] = [
  {
    id: 'm1',
    restaurant_id: 'a1',
    category_id: 'c1',
    name: 'Nasi Goreng Bebek Kecombrang',
    description: 'Nasi goreng pulen khas rempah nusantara dengan suwiran daging bebek gurih, kecombrang wangi, emping, dan telur mata sapi.',
    price: 55000,
    image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: true,
    prep_time_minutes: 15,
    variants: [
      {
        id: 'v1',
        menu_item_id: 'm1',
        name: 'Tingkat Kepedasan',
        required: true,
        options: [
          { id: 'v1-1', name: 'Level 0 (Tidak Pedas)', price_adjustment: 0 },
          { id: 'v1-2', name: 'Level 1 (Sedang Gurih)', price_adjustment: 0 },
          { id: 'v1-3', name: 'Level 2 (Pedas Mantap)', price_adjustment: 0 },
          { id: 'v1-4', name: 'Level 3 (Extra Rawit + Kecombrang)', price_adjustment: 3000 },
        ],
      },
      {
        id: 'v2',
        menu_item_id: 'm1',
        name: 'Pilihan Telur',
        required: false,
        options: [
          { id: 'v2-1', name: 'Telur Mata Sapi 1/2 Matang', price_adjustment: 0 },
          { id: 'v2-2', name: 'Telur Mata Sapi Matang Penuh', price_adjustment: 0 },
          { id: 'v2-3', name: 'Telur Dadar Crispy', price_adjustment: 0 },
          { id: 'v2-4', name: 'Upgrade Telur Bebek Asin', price_adjustment: 6000 },
        ],
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm2',
    restaurant_id: 'a1',
    category_id: 'c1',
    name: 'Sop Buntut Bakar Madu Spesial',
    description: 'Buntut sapi empuk dipanggang karamel madu rempah wangi, disajikan bersama semangkuk kuah kaldu rempah hangat, emping, dan sambal ijo.',
    price: 98000,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: true,
    prep_time_minutes: 20,
    variants: [
      {
        id: 'v3',
        menu_item_id: 'm2',
        name: 'Pilihan Kuah',
        required: false,
        options: [
          { id: 'v3-1', name: 'Kuah Rempah Bening Original', price_adjustment: 0 },
          { id: 'v3-2', name: 'Kuah Gurih Susu Kelapa', price_adjustment: 5000 },
        ],
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm3',
    restaurant_id: 'a1',
    category_id: 'c1',
    name: 'Ayam Bakar Taliwang Sasak',
    description: 'Ayam kampung muda bakar bumbu Taliwang khas Sasak Lombok, pedas gurih kaya aroma kencur dan terasi bakar, lengkap dengan plecing kangkung.',
    price: 65000,
    image_url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: false,
    prep_time_minutes: 18,
    variants: [
      {
        id: 'v4',
        menu_item_id: 'm3',
        name: 'Bumbu Taliwang',
        required: true,
        options: [
          { id: 'v4-1', name: 'Pedas Manis Gurih', price_adjustment: 0 },
          { id: 'v4-2', name: 'Pedas Asli Sasak (Sangat Pedas)', price_adjustment: 0 },
        ],
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm4',
    restaurant_id: 'a1',
    category_id: 'c2',
    name: 'Tahu Walik Crispy Banyuwangi',
    description: 'Tahu walik goreng renyah isi adonan daging ayam udang kenyal dan gurih, disajikan dengan cocolan sambal kecap petis rawit.',
    price: 32000,
    image_url: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: false,
    prep_time_minutes: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm5',
    restaurant_id: 'a1',
    category_id: 'c2',
    name: 'Bakwan Jagung Udang Manis Renyah',
    description: 'Gorengan jagung manis pipil segar bercampur udang cincang dan daun bawang, digoreng garing keemasan dengan saus asam manis pedas.',
    price: 28000,
    image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: false,
    prep_time_minutes: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm6',
    restaurant_id: 'a1',
    category_id: 'c3',
    name: 'Es Kopi Gula Aren Nusantara',
    description: 'Espresso arabika house-blend dengan susu segar creamy dan sirup gula aren murni organik dari petani lokal.',
    price: 26000,
    image_url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: true,
    prep_time_minutes: 5,
    variants: [
      {
        id: 'v5',
        menu_item_id: 'm6',
        name: 'Tingkat Manis & Es',
        required: true,
        options: [
          { id: 'v5-1', name: 'Normal Sweet & Normal Ice', price_adjustment: 0 },
          { id: 'v5-2', name: 'Less Sugar (70%)', price_adjustment: 0 },
          { id: 'v5-3', name: 'Less Ice', price_adjustment: 0 },
          { id: 'v5-4', name: 'Sajian Hangat (Hot)', price_adjustment: 0 },
        ],
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm7',
    restaurant_id: 'a1',
    category_id: 'c3',
    name: 'Es Cendol Durian Montong',
    description: 'Cendol pandan suji kenyal beraroma alami, santan kelapa gurih, kuah gula merah nangka, dan topping daging durian legit melimpah.',
    price: 38000,
    image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: true,
    prep_time_minutes: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm8',
    restaurant_id: 'a1',
    category_id: 'c4',
    name: 'Pisang Bakar Coklat Keju Wijen',
    description: 'Pisang kepok panggang manis karamel dengan taburan keju cheddar melimpah, meises coklat belgian, dan biji wijen sangrai wangi.',
    price: 25000,
    image_url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: false,
    prep_time_minutes: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const defaultProfiles: Profile[] = [
  { id: 'usr-1', restaurant_id: 'a1', name: 'Rahmat Hidayat (Manager)', email: 'admin@dineqr.com', role: 'admin', is_active: true, created_at: new Date().toISOString() },
  { id: 'usr-2', restaurant_id: 'a1', name: 'Chef Budi Santoso', email: 'kitchen@dineqr.com', role: 'kitchen', is_active: true, created_at: new Date().toISOString() },
  { id: 'usr-3', restaurant_id: 'a1', name: 'Siti Rahmawati', email: 'cashier@dineqr.com', role: 'cashier', is_active: true, created_at: new Date().toISOString() },
];

const defaultInitialOrders: Order[] = [
  {
    id: 'ord-seed-001',
    restaurant_id: 'a1000000-0000-0000-0000-000000000001',
    table_id: 't1',
    table_number: 'Meja 01',
    order_number: 'DQR-261014-001',
    customer_name: 'Anisa Maharani',
    customer_secret_token: 'sec_token_demo_001_anisa',
    status: 'confirmed',
    payment_status: 'unpaid',
    subtotal: 81000,
    tax_amount: 8100,
    service_charge: 4050,
    total_amount: 93150,
    notes: 'Sambal dipisah jika bisa',
    created_at: new Date(Date.now() - 6 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 60000).toISOString(),
    items: [
      {
        id: 'item-seed-1',
        order_id: 'ord-seed-001',
        menu_item_id: 'm1',
        item_name: 'Nasi Goreng Bebek Kecombrang',
        unit_price: 55000,
        quantity: 1,
        subtotal: 55000,
        selected_variants: [{ variant_name: 'Tingkat Kepedasan', option_name: 'Level 1 (Sedang Gurih)', price_adjustment: 0 }],
        notes: 'Tolong jangan terlalu berminyak',
        created_at: new Date(Date.now() - 6 * 60000).toISOString(),
      },
      {
        id: 'item-seed-2',
        order_id: 'ord-seed-001',
        menu_item_id: 'm6',
        item_name: 'Es Kopi Gula Aren Nusantara',
        unit_price: 26000,
        quantity: 1,
        subtotal: 26000,
        selected_variants: [{ variant_name: 'Tingkat Manis & Es', option_name: 'Less Sugar (70%)', price_adjustment: 0 }],
        created_at: new Date(Date.now() - 6 * 60000).toISOString(),
      },
    ],
  },
  {
    id: 'ord-seed-002',
    restaurant_id: 'a1000000-0000-0000-0000-000000000001',
    table_id: 't2',
    table_number: 'Meja 02',
    order_number: 'DQR-261014-002',
    customer_name: 'Dimas Wicaksono',
    customer_secret_token: 'sec_token_demo_002_dimas',
    status: 'preparing',
    payment_status: 'paid',
    subtotal: 136000,
    tax_amount: 13600,
    service_charge: 6800,
    total_amount: 156400,
    created_at: new Date(Date.now() - 14 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 60000).toISOString(),
    items: [
      {
        id: 'item-seed-3',
        order_id: 'ord-seed-002',
        menu_item_id: 'm2',
        item_name: 'Sop Buntut Bakar Madu Spesial',
        unit_price: 98000,
        quantity: 1,
        subtotal: 98000,
        selected_variants: [],
        created_at: new Date(Date.now() - 14 * 60000).toISOString(),
      },
      {
        id: 'item-seed-4',
        order_id: 'ord-seed-002',
        menu_item_id: 'm7',
        item_name: 'Es Cendol Durian Montong',
        unit_price: 38000,
        quantity: 1,
        subtotal: 38000,
        selected_variants: [],
        created_at: new Date(Date.now() - 14 * 60000).toISOString(),
      },
    ],
  },
];

class LocalDatabaseStore {
  private restaurant: Restaurant;
  private tables: DiningTable[];
  private categories: Category[];
  private menuItems: MenuItem[];
  private orders: Order[];
  private payments: Payment[];
  private profiles: Profile[];
  private auditLogs: any[];

  constructor() {
    this.restaurant = this.getOrSet('dineqr_local_restaurant', defaultRestaurant);
    this.tables = this.getOrSet('dineqr_local_tables', defaultTables);
    this.categories = this.getOrSet('dineqr_local_categories', defaultCategories);
    this.menuItems = this.getOrSet('dineqr_local_menu_items', defaultMenuItems);
    this.orders = this.getOrSet('dineqr_local_orders', defaultInitialOrders);
    this.payments = this.getOrSet('dineqr_local_payments', [
      {
        id: 'pay-seed-001',
        order_id: 'ord-seed-002',
        amount_due: 156400,
        amount_tendered: 200000,
        change_amount: 43600,
        payment_method: 'cash',
        cashier_id: 'usr-3',
        cashier_name: 'Siti Rahmawati',
        created_at: new Date(Date.now() - 10 * 60000).toISOString(),
      },
    ]);
    this.profiles = this.getOrSet('dineqr_local_profiles', defaultProfiles);
    this.auditLogs = this.getOrSet('dineqr_local_audit_logs', [
      {
        id: 'aud-1',
        actor_name: 'Siti Rahmawati',
        actor_role: 'cashier',
        action: 'PROCESS_CASH_PAYMENT',
        resource_type: 'payment',
        resource_id: 'pay-seed-001',
        details: 'Pembayaran DQR-261014-002 lunas',
        created_at: new Date(Date.now() - 10 * 60000).toISOString(),
      },
    ]);
  }

  private getOrSet<T>(key: string, defaultVal: T): T {
    try {
      const existing = localStorage.getItem(key);
      if (existing) {
        const parsed = JSON.parse(existing);
        if (Array.isArray(defaultVal) && (!Array.isArray(parsed) || parsed.length === 0)) {
          localStorage.setItem(key, JSON.stringify(defaultVal));
          return defaultVal;
        }
        return parsed;
      }
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private save<T>(key: string, val: T) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {
      // ignore
    }
  }

  getPublicMenu() {
    return {
      restaurant: this.restaurant,
      categories: [...this.categories].sort((a, b) => a.sort_order - b.sort_order),
      items: this.menuItems.filter((m) => m.is_available),
    };
  }

  getTableByToken(token: string) {
    const table = this.tables.find((t) => t.qr_token === token && t.is_active);
    return {
      table: table || { id: 't1', table_number: 'Meja 01', capacity: 2 },
      restaurant: this.restaurant,
    };
  }

  createOrder(data: {
    table_token: string;
    customer_name?: string;
    notes?: string;
    items: Array<{
      menu_item_id: string;
      quantity: number;
      selected_variants?: Array<{ variant_name: string; option_name: string; price_adjustment: number }>;
      notes?: string;
    }>;
  }): Order {
    const table = this.tables.find((t) => t.qr_token === data.table_token) || this.tables[0];
    const orderId = 'ord-' + Date.now();
    let calculatedSubtotal = 0;

    const orderItems = data.items.map((itemInput, idx) => {
      const menuItem = this.menuItems.find((m) => m.id === itemInput.menu_item_id) || {
        id: itemInput.menu_item_id,
        name: 'Hidangan Pilihan',
        price: 35000,
      };

      const extra = (itemInput.selected_variants || []).reduce((sum, v) => sum + (v.price_adjustment || 0), 0);
      const unitPrice = menuItem.price + extra;
      const subtotal = unitPrice * itemInput.quantity;
      calculatedSubtotal += subtotal;

      return {
        id: `item-${Date.now()}-${idx}`,
        order_id: orderId,
        menu_item_id: menuItem.id,
        item_name: menuItem.name,
        unit_price: unitPrice,
        quantity: itemInput.quantity,
        subtotal,
        selected_variants: itemInput.selected_variants || [],
        notes: itemInput.notes,
        created_at: new Date().toISOString(),
      };
    });

    const taxAmount = Math.round(calculatedSubtotal * (this.restaurant.tax_rate_percent / 100));
    const serviceCharge = Math.round(calculatedSubtotal * (this.restaurant.service_charge_percent / 100));
    const totalAmount = calculatedSubtotal + taxAmount + serviceCharge;

    const now = new Date();
    const dateCode = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const orderNumber = `DQR-${dateCode}-${String(this.orders.length + 1).padStart(3, '0')}`;
    const customerSecretToken = 'cst_' + Math.random().toString(36).substring(2) + Date.now().toString(36);

    const newOrder: Order = {
      id: orderId,
      restaurant_id: this.restaurant.id,
      table_id: table.id,
      table_number: table.table_number,
      order_number: orderNumber,
      customer_name: data.customer_name || `Pelanggan ${table.table_number}`,
      customer_secret_token: customerSecretToken,
      status: 'confirmed',
      payment_status: 'unpaid',
      subtotal: calculatedSubtotal,
      tax_amount: taxAmount,
      service_charge: serviceCharge,
      total_amount: totalAmount,
      items: orderItems,
      notes: data.notes,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    this.orders.unshift(newOrder);
    this.save('dineqr_local_orders', this.orders);
    return newOrder;
  }

  getOrder(id: string) {
    const order = this.orders.find((o) => o.id === id);
    return order ? { order } : { order: this.orders[0] };
  }

  cancelOrder(id: string) {
    const order = this.orders.find((o) => o.id === id);
    if (order) {
      order.status = 'cancelled';
      order.updated_at = new Date().toISOString();
      this.save('dineqr_local_orders', this.orders);
      return { success: true, order };
    }
    return { success: false, order: null };
  }

  getKitchenOrders() {
    return {
      orders: this.orders.filter((o) => ['confirmed', 'preparing', 'ready'].includes(o.status)),
    };
  }

  updateKitchenStatus(orderId: string, status: OrderStatus, notes?: string) {
    const order = this.orders.find((o) => o.id === orderId);
    if (order) {
      order.status = status;
      order.updated_at = new Date().toISOString();
      this.save('dineqr_local_orders', this.orders);
      return { success: true, order };
    }
    throw new Error('Pesanan tidak ditemukan');
  }

  getCashierOrders() {
    return { orders: [...this.orders] };
  }

  processCashPayment(orderId: string, amount_tendered: number) {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Pesanan tidak ditemukan');

    order.payment_status = 'paid';
    order.updated_at = new Date().toISOString();

    const change = amount_tendered - order.total_amount;
    const payment: Payment = {
      id: 'pay-' + Date.now(),
      order_id: order.id,
      amount_due: order.total_amount,
      amount_tendered,
      change_amount: change,
      payment_method: 'cash',
      cashier_id: 'usr-3',
      cashier_name: 'Siti Rahmawati (Kasir)',
      created_at: new Date().toISOString(),
    };

    this.payments.push(payment);
    this.save('dineqr_local_orders', this.orders);
    this.save('dineqr_local_payments', this.payments);

    return {
      success: true,
      order_id: order.id,
      order_number: order.order_number,
      amount_due: order.total_amount,
      amount_tendered,
      change_amount: change,
      cashier_name: payment.cashier_name,
    };
  }

  getAdminReports() {
    const paidOrders = this.orders.filter((o) => o.payment_status === 'paid');
    const totalSales = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const totalTax = paidOrders.reduce((sum, o) => sum + o.tax_amount, 0);
    const totalService = paidOrders.reduce((sum, o) => sum + o.service_charge, 0);
    const paidOrdersCount = paidOrders.length;
    const averageOrderValue = paidOrdersCount > 0 ? Math.round(totalSales / paidOrdersCount) : 0;

    const itemSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    for (const o of paidOrders) {
      for (const it of o.items) {
        if (!itemSales[it.menu_item_id]) {
          itemSales[it.menu_item_id] = { name: it.item_name, quantity: 0, revenue: 0 };
        }
        itemSales[it.menu_item_id].quantity += it.quantity;
        itemSales[it.menu_item_id].revenue += it.subtotal;
      }
    }

    return {
      report: {
        total_sales: totalSales,
        total_tax: totalTax,
        total_service: totalService,
        total_orders: this.orders.length,
        paid_orders_count: paidOrdersCount,
        cancelled_orders_count: this.orders.filter((o) => o.status === 'cancelled').length,
        average_order_value: averageOrderValue,
        top_selling_items: Object.values(itemSales),
        recent_payments: [...this.payments].reverse(),
      },
    };
  }

  getAdminTables() {
    return { tables: [...this.tables] };
  }

  createTable(table_number: string, capacity: number) {
    const newTable: DiningTable = {
      id: 'tbl-' + Date.now(),
      restaurant_id: this.restaurant.id,
      table_number,
      capacity,
      qr_token: 'tbl_token_' + Math.random().toString(36).substring(2, 12),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.tables.push(newTable);
    this.save('dineqr_local_tables', this.tables);
    return { table: newTable };
  }

  updateTable(id: string, updates: Partial<DiningTable>) {
    const idx = this.tables.findIndex((t) => t.id === id);
    if (idx > -1) {
      this.tables[idx] = { ...this.tables[idx], ...updates, updated_at: new Date().toISOString() };
      this.save('dineqr_local_tables', this.tables);
      return { table: this.tables[idx] };
    }
    throw new Error('Meja tidak ditemukan');
  }

  regenerateQR(id: string) {
    const idx = this.tables.findIndex((t) => t.id === id);
    if (idx > -1) {
      this.tables[idx].qr_token = 'tbl_token_' + Math.random().toString(36).substring(2, 12);
      this.tables[idx].updated_at = new Date().toISOString();
      this.save('dineqr_local_tables', this.tables);
      return { table: this.tables[idx] };
    }
    throw new Error('Meja tidak ditemukan');
  }

  getAdminMenu() {
    return { menuItems: [...this.menuItems] };
  }

  createMenuItem(data: Partial<MenuItem>) {
    const newItem: MenuItem = {
      id: 'm-' + Date.now(),
      restaurant_id: this.restaurant.id,
      category_id: data.category_id || 'c1',
      name: data.name || 'Menu Baru',
      description: data.description || '',
      price: data.price || 30000,
      image_url: data.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      is_available: true,
      prep_time_minutes: data.prep_time_minutes || 15,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.menuItems.push(newItem);
    this.save('dineqr_local_menu_items', this.menuItems);
    return { item: newItem };
  }

  updateMenuItem(id: string, updates: Partial<MenuItem>) {
    const idx = this.menuItems.findIndex((m) => m.id === id);
    if (idx > -1) {
      this.menuItems[idx] = { ...this.menuItems[idx], ...updates, updated_at: new Date().toISOString() };
      this.save('dineqr_local_menu_items', this.menuItems);
      return { item: this.menuItems[idx] };
    }
    throw new Error('Menu tidak ditemukan');
  }

  deleteMenuItem(id: string) {
    this.menuItems = this.menuItems.filter((m) => m.id !== id);
    this.save('dineqr_local_menu_items', this.menuItems);
    return { success: true };
  }

  getAdminCategories() {
    return { categories: [...this.categories] };
  }

  createCategory(name: string, icon = 'UtensilsCrossed') {
    const newCat: Category = {
      id: 'c-' + Date.now(),
      restaurant_id: this.restaurant.id,
      name,
      icon,
      sort_order: this.categories.length + 1,
      is_active: true,
    };
    this.categories.push(newCat);
    this.save('dineqr_local_categories', this.categories);
    return { category: newCat };
  }

  getAdminStaff() {
    return { profiles: [...this.profiles] };
  }

  createStaff(name: string, email: string, role: Role) {
    const newStaff: Profile = {
      id: 'usr-' + Date.now(),
      restaurant_id: this.restaurant.id,
      name,
      email,
      role,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    this.profiles.push(newStaff);
    this.save('dineqr_local_profiles', this.profiles);
    return { profile: newStaff };
  }

  getAdminSettings() {
    return { restaurant: { ...this.restaurant } };
  }

  updateAdminSettings(settings: Partial<Restaurant>) {
    this.restaurant = { ...this.restaurant, ...settings, updated_at: new Date().toISOString() };
    this.save('dineqr_local_restaurant', this.restaurant);
    return { restaurant: this.restaurant };
  }

  getAuditLogs() {
    return { logs: [...this.auditLogs] };
  }
}

export const localStore = new LocalDatabaseStore();
