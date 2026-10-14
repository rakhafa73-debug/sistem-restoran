export type Role = 'admin' | 'kitchen' | 'cashier';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'failed';

export interface Restaurant {
  id: string;
  name: string;
  tagline: string;
  address: string;
  phone: string;
  tax_rate_percent: number; // e.g. 10 for 10%
  service_charge_percent: number; // e.g. 5 for 5%
  is_open: boolean;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: Role;
  restaurant_id: string;
  is_active: boolean;
  created_at: string;
}

export interface DiningTable {
  id: string;
  restaurant_id: string;
  table_number: string;
  qr_token: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
}

export interface MenuVariantOption {
  id: string;
  name: string;
  price_adjustment: number;
}

export interface MenuVariant {
  id: string;
  menu_item_id: string;
  name: string; // e.g. "Level Pedas", "Ukuran", "Pilihan Sambal"
  required: boolean;
  options: MenuVariantOption[];
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  is_featured?: boolean;
  prep_time_minutes: number;
  variants?: MenuVariant[];
  created_at: string;
  updated_at: string;
}

export interface OrderItemVariantSelection {
  variant_name: string;
  option_name: string;
  price_adjustment: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  selected_variants: OrderItemVariantSelection[];
  notes?: string;
  created_at: string;
}

export interface Order {
  id: string;
  restaurant_id: string;
  table_id: string;
  table_number: string;
  order_number: string; // e.g. DQR-261014-001
  customer_name?: string;
  customer_secret_token: string; // Random secret token for customer only
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  tax_amount: number;
  service_charge: number;
  total_amount: number;
  items: OrderItem[];
  notes?: string;
  idempotency_key?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  amount_due: number;
  amount_tendered: number;
  change_amount: number;
  payment_method: 'cash';
  cashier_id: string;
  cashier_name: string;
  idempotency_key?: string;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  from_status: OrderStatus;
  to_status: OrderStatus;
  changed_by_name: string;
  changed_by_role: string;
  notes?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details?: string;
  created_at: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  selectedVariants: OrderItemVariantSelection[];
  notes: string;
  calculatedPrice: number; // base price + adjustments
}
