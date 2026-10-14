import crypto from 'crypto';
import type {
  AuditLog,
  Category,
  DiningTable,
  MenuItem,
  MenuVariant,
  Order,
  OrderItem,
  OrderStatus,
  OrderStatusHistory,
  Payment,
  Profile,
  Restaurant,
  Role,
} from '../types/index.ts';

/**
 * Authoritative Server Database Store
 * Implements atomic transactional operations, price validations,
 * RLS authorization checks, and real-time event distribution.
 */

// Initial Seed Data
const initialRestaurant: Restaurant = {
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

const initialProfiles: Profile[] = [
  {
    id: 'b1000000-0000-0000-0000-000000000001',
    restaurant_id: 'a1000000-0000-0000-0000-000000000001',
    name: 'Rahmat Hidayat (Manager)',
    email: 'admin@dineqr.com',
    role: 'admin',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'b2000000-0000-0000-0000-000000000002',
    restaurant_id: 'a1000000-0000-0000-0000-000000000001',
    name: 'Chef Budi Santoso',
    email: 'kitchen@dineqr.com',
    role: 'kitchen',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'b3000000-0000-0000-0000-000000000003',
    restaurant_id: 'a1000000-0000-0000-0000-000000000001',
    name: 'Siti Rahmawati',
    email: 'cashier@dineqr.com',
    role: 'cashier',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const initialDiningTables: DiningTable[] = [
  {
    id: 't1000000-0000-0000-0000-000000000001',
    restaurant_id: 'a1000000-0000-0000-0000-000000000001',
    table_number: 'Meja 01',
    qr_token: 'tbl_token_m01_nusantara',
    capacity: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't1000000-0000-0000-0000-000000000002',
    restaurant_id: 'a1000000-0000-0000-0000-000000000001',
    table_number: 'Meja 02',
    qr_token: 'tbl_token_m02_nusantara',
    capacity: 4,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't1000000-0000-0000-0000-000000000003',
    restaurant_id: 'a1000000-0000-0000-0000-000000000001',
    table_number: 'Meja 03',
    qr_token: 'tbl_token_m03_nusantara',
    capacity: 4,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't1000000-0000-0000-0000-000000000004',
    restaurant_id: 'a1000000-0000-0000-0000-000000000001',
    table_number: 'Meja 04',
    qr_token: 'tbl_token_m04_nusantara',
    capacity: 6,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't1000000-0000-0000-0000-000000000005',
    restaurant_id: 'a1000000-0000-0000-0000-000000000001',
    table_number: 'Meja 05 (VIP)',
    qr_token: 'tbl_token_m05_nusantara',
    capacity: 8,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't1000000-0000-0000-0000-000000000006',
    restaurant_id: 'a1000000-0000-0000-0000-000000000001',
    table_number: 'Meja 06 (Outdoor)',
    qr_token: 'tbl_token_m06_nusantara',
    capacity: 4,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const initialCategories: Category[] = [
  { id: 'c1', restaurant_id: 'a1', name: 'Makanan Utama', icon: 'UtensilsCrossed', sort_order: 1, is_active: true },
  { id: 'c2', restaurant_id: 'a1', name: 'Camilan & Pembuka', icon: 'Pizza', sort_order: 2, is_active: true },
  { id: 'c3', restaurant_id: 'a1', name: 'Minuman Segar', icon: 'Coffee', sort_order: 3, is_active: true },
  { id: 'c4', restaurant_id: 'a1', name: 'Dessert Manis', icon: 'IceCream', sort_order: 4, is_active: true },
];

const initialMenuItems: MenuItem[] = [
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

class DatabaseStore {
  private restaurant: Restaurant = initialRestaurant;
  private profiles: Profile[] = [...initialProfiles];
  private tables: DiningTable[] = [...initialDiningTables];
  private categories: Category[] = [...initialCategories];
  private menuItems: MenuItem[] = [...initialMenuItems];
  private orders: Order[] = [];
  private orderHistory: OrderStatusHistory[] = [];
  private payments: Payment[] = [];
  private auditLogs: AuditLog[] = [];
  private subscribers: Array<(event: { type: string; payload: unknown }) => void> = [];

  constructor() {
    this.seedInitialOrders();
  }

  // Pre-seed a few active demo orders so Kitchen, Cashier, and Admin have realistic live data on load
  private seedInitialOrders() {
    const table1 = this.tables[0];
    const table2 = this.tables[1];

    const order1: Order = {
      id: 'ord-seed-001',
      restaurant_id: this.restaurant.id,
      table_id: table1.id,
      table_number: table1.table_number,
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
    };

    const order2: Order = {
      id: 'ord-seed-002',
      restaurant_id: this.restaurant.id,
      table_id: table2.id,
      table_number: table2.table_number,
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
    };

    this.orders.push(order1, order2);

    this.payments.push({
      id: 'pay-seed-001',
      order_id: 'ord-seed-002',
      amount_due: 156400,
      amount_tendered: 200000,
      change_amount: 43600,
      payment_method: 'cash',
      cashier_id: this.profiles[2].id,
      cashier_name: this.profiles[2].name,
      created_at: new Date(Date.now() - 10 * 60000).toISOString(),
    });

    this.orderHistory.push(
      {
        id: 'hist-1',
        order_id: 'ord-seed-001',
        from_status: 'pending',
        to_status: 'confirmed',
        changed_by_name: 'Sistem DineQR (Pelanggan Meja 01)',
        changed_by_role: 'customer',
        notes: 'Pesanan checkout berhasil dibuat',
        created_at: new Date(Date.now() - 6 * 60000).toISOString(),
      },
      {
        id: 'hist-2',
        order_id: 'ord-seed-002',
        from_status: 'confirmed',
        to_status: 'preparing',
        changed_by_name: 'Chef Budi Santoso',
        changed_by_role: 'kitchen',
        notes: 'Pesanan mulai diproses di wajan dapur',
        created_at: new Date(Date.now() - 10 * 60000).toISOString(),
      }
    );
  }

  // Real-time Event Subscription (SSE)
  subscribe(callback: (event: { type: string; payload: unknown }) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== callback);
    };
  }

  broadcast(type: string, payload: unknown) {
    for (const sub of this.subscribers) {
      try {
        sub({ type, payload });
      } catch (err) {
        console.error('SSE subscriber error:', err);
      }
    }
  }

  // Restaurant Settings
  getRestaurant() {
    return { ...this.restaurant };
  }

  updateRestaurant(updates: Partial<Restaurant>, actor: { name: string; role: string }) {
    this.restaurant = {
      ...this.restaurant,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.recordAuditLog(actor.name, actor.role, 'UPDATE_RESTAURANT', 'restaurant', this.restaurant.id, JSON.stringify(updates));
    return { ...this.restaurant };
  }

  // Dining Tables & QR tokens
  getTables() {
    return [...this.tables];
  }

  getTableByToken(qr_token: string) {
    return this.tables.find((t) => t.qr_token === qr_token && t.is_active);
  }

  createTable(table_number: string, capacity: number, actor: { name: string; role: string }) {
    const id = 'tbl-' + crypto.randomUUID();
    const qr_token = 'tbl_token_' + crypto.randomBytes(12).toString('hex');
    const newTable: DiningTable = {
      id,
      restaurant_id: this.restaurant.id,
      table_number,
      qr_token,
      capacity,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.tables.push(newTable);
    this.recordAuditLog(actor.name, actor.role, 'CREATE_TABLE', 'dining_table', id, `Meja dibuat: ${table_number}`);
    return newTable;
  }

  updateTable(id: string, updates: Partial<DiningTable>, actor: { name: string; role: string }) {
    const idx = this.tables.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Meja tidak ditemukan.');
    this.tables[idx] = {
      ...this.tables[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.recordAuditLog(actor.name, actor.role, 'UPDATE_TABLE', 'dining_table', id, JSON.stringify(updates));
    return this.tables[idx];
  }

  regenerateTableQR(id: string, actor: { name: string; role: string }) {
    const idx = this.tables.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Meja tidak ditemukan.');
    const new_token = 'tbl_token_' + crypto.randomBytes(12).toString('hex');
    this.tables[idx].qr_token = new_token;
    this.tables[idx].updated_at = new Date().toISOString();
    this.recordAuditLog(actor.name, actor.role, 'REGENERATE_QR', 'dining_table', id, `Token QR diregenerasi untuk ${this.tables[idx].table_number}`);
    return this.tables[idx];
  }

  // Categories
  getCategories() {
    return [...this.categories].sort((a, b) => a.sort_order - b.sort_order);
  }

  createCategory(name: string, icon: string, actor: { name: string; role: string }) {
    const newCat: Category = {
      id: 'cat-' + crypto.randomUUID(),
      restaurant_id: this.restaurant.id,
      name,
      icon,
      sort_order: this.categories.length + 1,
      is_active: true,
    };
    this.categories.push(newCat);
    this.recordAuditLog(actor.name, actor.role, 'CREATE_CATEGORY', 'category', newCat.id, `Kategori: ${name}`);
    return newCat;
  }

  // Menu Items & Variants
  getMenuItems(includeUnavailable = false) {
    if (includeUnavailable) return [...this.menuItems];
    return this.menuItems.filter((m) => m.is_available);
  }

  getMenuItemById(id: string) {
    return this.menuItems.find((m) => m.id === id);
  }

  createMenuItem(item: Omit<MenuItem, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>, actor: { name: string; role: string }) {
    const newItem: MenuItem = {
      ...item,
      id: 'm-' + crypto.randomUUID(),
      restaurant_id: this.restaurant.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.menuItems.push(newItem);
    this.recordAuditLog(actor.name, actor.role, 'CREATE_MENU_ITEM', 'menu_item', newItem.id, `Menu baru: ${newItem.name}`);
    return newItem;
  }

  updateMenuItem(id: string, updates: Partial<MenuItem>, actor: { name: string; role: string }) {
    const idx = this.menuItems.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error('Menu tidak ditemukan.');
    this.menuItems[idx] = {
      ...this.menuItems[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.recordAuditLog(actor.name, actor.role, 'UPDATE_MENU_ITEM', 'menu_item', id, JSON.stringify(updates));
    return this.menuItems[idx];
  }

  deleteMenuItem(id: string, actor: { name: string; role: string }) {
    const idx = this.menuItems.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error('Menu tidak ditemukan.');
    const deleted = this.menuItems.splice(idx, 1)[0];
    this.recordAuditLog(actor.name, actor.role, 'DELETE_MENU_ITEM', 'menu_item', id, `Menu dihapus: ${deleted.name}`);
    return true;
  }

  // Staff Profiles
  getProfiles() {
    return [...this.profiles];
  }

  getProfileByEmail(email: string) {
    return this.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
  }

  getProfileById(id: string) {
    return this.profiles.find((p) => p.id === id);
  }

  createProfile(name: string, email: string, role: Role, actor: { name: string; role: string }) {
    const existing = this.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (existing) throw new Error('Email sudah terdaftar untuk staf lain.');
    const newProfile: Profile = {
      id: 'usr-' + crypto.randomUUID(),
      restaurant_id: this.restaurant.id,
      name,
      email,
      role,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    this.profiles.push(newProfile);
    this.recordAuditLog(actor.name, actor.role, 'CREATE_STAFF', 'profile', newProfile.id, `Staf baru: ${name} (${role})`);
    return newProfile;
  }

  // ==========================================
  // ATOMIC ORDER CHECKOUT (create_qr_order)
  // ==========================================
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
    idempotency_key?: string;
  }): Order {
    // 1. Idempotency Check
    if (data.idempotency_key) {
      const existing = this.orders.find((o) => o.idempotency_key === data.idempotency_key);
      if (existing) return existing;
    }

    // 2. Validate Table
    const table = this.getTableByToken(data.table_token);
    if (!table) {
      throw new Error('Kode QR meja tidak valid atau meja sedang dinonaktifkan.');
    }

    // 3. Validate Restaurant Status
    if (!this.restaurant.is_open) {
      throw new Error('Mohon maaf, restoran saat ini sedang tidak menerima pesanan baru.');
    }

    if (!data.items || data.items.length === 0) {
      throw new Error('Keranjang belanja kosong.');
    }

    // 4. Validate items & calculate authoritative price from database
    let calculatedSubtotal = 0;
    const orderId = 'ord-' + crypto.randomUUID();
    const orderItems: OrderItem[] = [];

    for (const itemInput of data.items) {
      if (itemInput.quantity <= 0) {
        throw new Error('Kuantitas pesanan tidak boleh kurang dari 1.');
      }

      const menuItem = this.menuItems.find((m) => m.id === itemInput.menu_item_id);
      if (!menuItem) {
        throw new Error(`Item menu ID ${itemInput.menu_item_id} tidak ditemukan.`);
      }

      if (!menuItem.is_available) {
        throw new Error(`Menu "${menuItem.name}" sedang habis / tidak tersedia.`);
      }

      // Calculate unit price + variant adjustments
      let unitPrice = menuItem.price;
      const validVariants: Array<{ variant_name: string; option_name: string; price_adjustment: number }> = [];

      if (itemInput.selected_variants && itemInput.selected_variants.length > 0) {
        for (const selVar of itemInput.selected_variants) {
          // Look up in actual menu variant definitions
          const variantDef = menuItem.variants?.find((v) => v.name === selVar.variant_name);
          const optionDef = variantDef?.options.find((o) => o.name === selVar.option_name);

          const adjustment = optionDef ? optionDef.price_adjustment : 0;
          unitPrice += adjustment;
          validVariants.push({
            variant_name: selVar.variant_name,
            option_name: selVar.option_name,
            price_adjustment: adjustment,
          });
        }
      }

      const itemSubtotal = unitPrice * itemInput.quantity;
      calculatedSubtotal += itemSubtotal;

      orderItems.push({
        id: 'item-' + crypto.randomUUID(),
        order_id: orderId,
        menu_item_id: menuItem.id,
        item_name: menuItem.name,
        unit_price: unitPrice,
        quantity: itemInput.quantity,
        subtotal: itemSubtotal,
        selected_variants: validVariants,
        notes: itemInput.notes,
        created_at: new Date().toISOString(),
      });
    }

    // 5. Calculate Taxes & Service Charge
    const taxRate = this.restaurant.tax_rate_percent || 10;
    const serviceRate = this.restaurant.service_charge_percent || 5;

    const taxAmount = Math.round(calculatedSubtotal * (taxRate / 100));
    const serviceCharge = Math.round(calculatedSubtotal * (serviceRate / 100));
    const totalAmount = calculatedSubtotal + taxAmount + serviceCharge;

    // 6. Generate Human-friendly Order Number (DQR-YYMMDD-XXX)
    const now = new Date();
    const dateCode = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const todayOrdersCount = this.orders.filter((o) => o.order_number.includes(`DQR-${dateCode}`)).length + 1;
    const orderNumber = `DQR-${dateCode}-${String(todayOrdersCount).padStart(3, '0')}`;

    // 7. Generate Random Secret Customer Access Token
    const customerSecretToken = 'cst_' + crypto.randomBytes(24).toString('hex');

    const newOrder: Order = {
      id: orderId,
      restaurant_id: this.restaurant.id,
      table_id: table.id,
      table_number: table.table_number,
      order_number: orderNumber,
      customer_name: data.customer_name?.trim() || `Pelanggan ${table.table_number}`,
      customer_secret_token: customerSecretToken,
      status: 'confirmed',
      payment_status: 'unpaid',
      subtotal: calculatedSubtotal,
      tax_amount: taxAmount,
      service_charge: serviceCharge,
      total_amount: totalAmount,
      items: orderItems,
      notes: data.notes,
      idempotency_key: data.idempotency_key,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    this.orders.unshift(newOrder);

    // Initial Status History
    this.orderHistory.push({
      id: 'hist-' + crypto.randomUUID(),
      order_id: orderId,
      from_status: 'pending',
      to_status: 'confirmed',
      changed_by_name: `Pelanggan (${table.table_number})`,
      changed_by_role: 'customer',
      notes: 'Pesanan baru berhasil dibuat melalui scan QR meja.',
      created_at: now.toISOString(),
    });

    // Broadcast Real-time Event to Kitchen and Cashier
    this.broadcast('ORDER_CREATED', {
      order_id: newOrder.id,
      order_number: newOrder.order_number,
      table_number: newOrder.table_number,
      status: newOrder.status,
      total_amount: newOrder.total_amount,
    });

    return newOrder;
  }

  // Get Order by ID (Access Control: Customer Token or Staff Role)
  getOrderById(id: string, customer_secret_token?: string, isStaff = false) {
    const order = this.orders.find((o) => o.id === id);
    if (!order) return null;

    if (!isStaff) {
      if (!customer_secret_token || order.customer_secret_token !== customer_secret_token) {
        throw new Error('Akses ditolak: Anda tidak memiliki akses ke pesanan ini.');
      }
    }

    const history = this.orderHistory.filter((h) => h.order_id === id);
    const payment = this.payments.find((p) => p.order_id === id);

    return {
      ...order,
      history,
      payment,
    };
  }

  // Kitchen Orders (Active queue: confirmed, preparing, ready)
  getKitchenOrders() {
    return this.orders
      .filter((o) => ['confirmed', 'preparing', 'ready'].includes(o.status))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  // Cashier Orders (Active & recent queue)
  getCashierOrders() {
    return [...this.orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Update Status by Kitchen or Staff
  updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    actor: { name: string; role: string },
    notes?: string
  ): Order {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Pesanan tidak ditemukan.');

    // Transition validation
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['served', 'completed'],
      served: ['completed'],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[order.status]?.includes(newStatus)) {
      throw new Error(`Transisi status tidak valid dari ${order.status} ke ${newStatus}.`);
    }

    const prevStatus = order.status;
    order.status = newStatus;
    order.updated_at = new Date().toISOString();

    // Record status history
    this.orderHistory.push({
      id: 'hist-' + crypto.randomUUID(),
      order_id: order.id,
      from_status: prevStatus,
      to_status: newStatus,
      changed_by_name: actor.name,
      changed_by_role: actor.role,
      notes: notes || `Status diubah menjadi ${newStatus}`,
      created_at: new Date().toISOString(),
    });

    this.recordAuditLog(actor.name, actor.role, 'UPDATE_ORDER_STATUS', 'order', order.id, `${prevStatus} -> ${newStatus}`);

    // Broadcast Real-time Event
    this.broadcast('ORDER_STATUS_UPDATED', {
      order_id: order.id,
      order_number: order.order_number,
      table_number: order.table_number,
      status: order.status,
      prev_status: prevStatus,
    });

    return order;
  }

  // Customer Cancel Request
  requestOrderCancellation(orderId: string, customer_secret_token: string, reason?: string) {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Pesanan tidak ditemukan.');

    if (order.customer_secret_token !== customer_secret_token) {
      throw new Error('Akses ditolak.');
    }

    if (order.status !== 'confirmed') {
      throw new Error('Pesanan tidak dapat dibatalkan karena sudah dalam proses memasak atau telah selesai.');
    }

    order.status = 'cancelled';
    order.updated_at = new Date().toISOString();

    this.orderHistory.push({
      id: 'hist-' + crypto.randomUUID(),
      order_id: order.id,
      from_status: 'confirmed',
      to_status: 'cancelled',
      changed_by_name: order.customer_name || 'Pelanggan',
      changed_by_role: 'customer',
      notes: reason || 'Dibatalkan oleh pelanggan',
      created_at: new Date().toISOString(),
    });

    this.broadcast('ORDER_STATUS_UPDATED', {
      order_id: order.id,
      order_number: order.order_number,
      table_number: order.table_number,
      status: 'cancelled',
    });

    return order;
  }

  // ==========================================
  // ATOMIC CASH PAYMENT (process_cash_payment)
  // ==========================================
  processPayment(
    orderId: string,
    amountTendered: number,
    cashier: { id: string; name: string; role: string },
    idempotencyKey?: string
  ) {
    // Check cashier role
    if (!['cashier', 'admin'].includes(cashier.role)) {
      throw new Error('Akses ditolak: Hanya Kasir atau Admin yang berhak memproses pembayaran.');
    }

    // Check idempotency
    if (idempotencyKey) {
      const existingPay = this.payments.find((p) => p.idempotency_key === idempotencyKey);
      if (existingPay) return existingPay;
    }

    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Pesanan tidak ditemukan.');

    if (order.payment_status === 'paid') {
      throw new Error('Pesanan ini sudah lunas dibayar.');
    }

    if (order.status === 'cancelled') {
      throw new Error('Pesanan ini telah dibatalkan.');
    }

    if (amountTendered < order.total_amount) {
      throw new Error(`Uang yang diterima (Rp ${amountTendered.toLocaleString()}) kurang dari total tagihan (Rp ${order.total_amount.toLocaleString()}).`);
    }

    const changeAmount = amountTendered - order.total_amount;

    const payment: Payment = {
      id: 'pay-' + crypto.randomUUID(),
      order_id: order.id,
      amount_due: order.total_amount,
      amount_tendered: amountTendered,
      change_amount: changeAmount,
      payment_method: 'cash',
      cashier_id: cashier.id,
      cashier_name: cashier.name,
      idempotency_key: idempotencyKey,
      created_at: new Date().toISOString(),
    };

    this.payments.push(payment);
    order.payment_status = 'paid';
    order.updated_at = new Date().toISOString();

    this.recordAuditLog(
      cashier.name,
      cashier.role,
      'PROCESS_CASH_PAYMENT',
      'payment',
      payment.id,
      `Pembayaran pesanan ${order.order_number} lunas. Diterima: ${amountTendered}, Kembalian: ${changeAmount}`
    );

    this.broadcast('PAYMENT_COMPLETED', {
      order_id: order.id,
      order_number: order.order_number,
      payment_id: payment.id,
      payment_status: 'paid',
      change_amount: changeAmount,
    });

    return {
      payment,
      order,
    };
  }

  // Admin Reports & Analytics
  getAdminReports() {
    // Only paid orders count toward actual sales revenue
    const paidOrders = this.orders.filter((o) => o.payment_status === 'paid');
    const totalSales = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const totalTax = paidOrders.reduce((sum, o) => sum + o.tax_amount, 0);
    const totalService = paidOrders.reduce((sum, o) => sum + o.service_charge, 0);
    const totalOrders = this.orders.length;
    const paidOrdersCount = paidOrders.length;
    const cancelledOrdersCount = this.orders.filter((o) => o.status === 'cancelled').length;
    const averageOrderValue = paidOrdersCount > 0 ? Math.round(totalSales / paidOrdersCount) : 0;

    // Top Selling Products
    const itemSalesCount: Record<string, { name: string; quantity: number; revenue: number }> = {};
    for (const order of paidOrders) {
      for (const item of order.items) {
        if (!itemSalesCount[item.menu_item_id]) {
          itemSalesCount[item.menu_item_id] = { name: item.item_name, quantity: 0, revenue: 0 };
        }
        itemSalesCount[item.menu_item_id].quantity += item.quantity;
        itemSalesCount[item.menu_item_id].revenue += item.subtotal;
      }
    }

    const topSelling = Object.values(itemSalesCount).sort((a, b) => b.quantity - a.quantity);

    return {
      total_sales: totalSales,
      total_tax: totalTax,
      total_service: totalService,
      total_orders: totalOrders,
      paid_orders_count: paidOrdersCount,
      cancelled_orders_count: cancelledOrdersCount,
      average_order_value: averageOrderValue,
      top_selling_items: topSelling,
      recent_payments: [...this.payments].slice(-15).reverse(),
    };
  }

  // Audit Logs
  recordAuditLog(actor_name: string, actor_role: string, action: string, resource_type: string, resource_id: string, details?: string) {
    this.auditLogs.unshift({
      id: 'aud-' + crypto.randomUUID(),
      actor_name,
      actor_role,
      action,
      resource_type,
      resource_id,
      details,
      created_at: new Date().toISOString(),
    });
  }

  getAuditLogs() {
    return [...this.auditLogs].slice(0, 50);
  }
}

export const db = new DatabaseStore();
