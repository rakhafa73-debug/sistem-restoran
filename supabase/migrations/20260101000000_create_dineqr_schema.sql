-- ==============================================================================
-- DINEQR POSTGRESQL MIGRATION: 20260101000000_create_dineqr_schema.sql
-- Complete schema, indexes, constraints, triggers, RLS policies, and RPC functions.
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Enumerated types & custom domains
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'kitchen', 'cashier');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status_type AS ENUM (
        'pending',
        'confirmed',
        'preparing',
        'ready',
        'served',
        'completed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_type AS ENUM (
        'unpaid',
        'paid',
        'refunded',
        'failed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Utility function: update timestamp trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    tagline VARCHAR(255) DEFAULT 'Authentic Indonesian Culinary Heritage',
    address TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    tax_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 10.00 CHECK (tax_rate_percent >= 0),
    service_charge_percent NUMERIC(5, 2) NOT NULL DEFAULT 5.00 CHECK (service_charge_percent >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'IDR',
    is_open BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_restaurants_updated_at
BEFORE UPDATE ON restaurants
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5. Profiles (Staff Authentication & Roles)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 6. Dining Tables
CREATE TABLE IF NOT EXISTS dining_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    table_number VARCHAR(20) NOT NULL,
    qr_token VARCHAR(64) NOT NULL UNIQUE,
    capacity INT NOT NULL DEFAULT 4 CHECK (capacity > 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_restaurant_table_number UNIQUE (restaurant_id, table_number)
);

CREATE INDEX IF NOT EXISTS idx_tables_qr_token ON dining_tables(qr_token);
CREATE INDEX IF NOT EXISTS idx_tables_active ON dining_tables(is_active);

-- 7. Categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order);

-- 8. Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    prep_time_minutes INT NOT NULL DEFAULT 15 CHECK (prep_time_minutes >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menu_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_available ON menu_items(is_available);

CREATE TRIGGER trg_menu_items_updated_at
BEFORE UPDATE ON menu_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 9. Menu Variants (e.g. Level Pedas, Pilihan Sambal)
CREATE TABLE IF NOT EXISTS menu_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    required BOOLEAN NOT NULL DEFAULT false,
    options JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of { id, name, price_adjustment }
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_variants_menu ON menu_variants(menu_item_id);

-- 10. Orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    table_id UUID NOT NULL REFERENCES dining_tables(id) ON DELETE RESTRICT,
    table_number VARCHAR(20) NOT NULL,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_name VARCHAR(100),
    customer_secret_token VARCHAR(64) NOT NULL, -- Secret random token generated per order
    status order_status_type NOT NULL DEFAULT 'confirmed',
    payment_status payment_status_type NOT NULL DEFAULT 'unpaid',
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    service_charge NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (service_charge >= 0),
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    notes TEXT,
    idempotency_key VARCHAR(128) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_secret_token ON orders(customer_secret_token);

CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 11. Order Items (Snapshot of ordered items)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    item_name VARCHAR(200) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    selected_variants JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- 12. Payments (Cash transactions handled by cashier)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
    amount_due NUMERIC(12, 2) NOT NULL CHECK (amount_due >= 0),
    amount_tendered NUMERIC(12, 2) NOT NULL CHECK (amount_tendered >= 0),
    change_amount NUMERIC(12, 2) NOT NULL CHECK (change_amount >= 0),
    payment_method VARCHAR(20) NOT NULL DEFAULT 'cash',
    cashier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    cashier_name VARCHAR(150) NOT NULL,
    idempotency_key VARCHAR(128) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Order Status History (Audit trail of state transitions)
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status order_status_type NOT NULL,
    to_status order_status_type NOT NULL,
    changed_by_name VARCHAR(150) NOT NULL,
    changed_by_role VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_history_order ON order_status_history(order_id);

-- 14. Audit Logs (System administrative operations)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_name VARCHAR(150) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dining_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Public can read active restaurant details and active tables
CREATE POLICY "Public can view active restaurant"
    ON restaurants FOR SELECT
    USING (is_open = true);

CREATE POLICY "Public can view active dining tables"
    ON dining_tables FOR SELECT
    USING (is_active = true);

-- Public can view active categories and available menu items
CREATE POLICY "Public can view active categories"
    ON categories FOR SELECT
    USING (is_active = true);

CREATE POLICY "Public can view available menu items"
    ON menu_items FOR SELECT
    USING (is_available = true);

CREATE POLICY "Public can view menu variants"
    ON menu_variants FOR SELECT
    USING (true);

-- Customers can view their specific order using secret token
CREATE POLICY "Customer can view order by secret token"
    ON orders FOR SELECT
    USING (
        customer_secret_token = current_setting('request.headers', true)::json->>'x-customer-token'
        OR auth.uid() IN (SELECT id FROM profiles)
    );

CREATE POLICY "Customer can view items of permitted order"
    ON order_items FOR SELECT
    USING (
        order_id IN (
            SELECT id FROM orders
            WHERE customer_secret_token = current_setting('request.headers', true)::json->>'x-customer-token'
        )
        OR auth.uid() IN (SELECT id FROM profiles)
    );

-- Explicit REVOKE on direct client mutations to prevent tampering
REVOKE INSERT, UPDATE, DELETE ON orders FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON order_items FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON payments FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON audit_logs FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON order_status_history FROM anon, authenticated;

-- ==============================================================================
-- DATABASE RPC FUNCTIONS (SECURITY DEFINER)
-- ==============================================================================

-- 1. Atomic QR Order Creation
CREATE OR REPLACE FUNCTION create_qr_order(
    p_table_token VARCHAR,
    p_customer_name VARCHAR,
    p_notes TEXT,
    p_items JSONB,
    p_idempotency_key VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_restaurant_id UUID;
    v_table_id UUID;
    v_table_number VARCHAR;
    v_tax_rate NUMERIC;
    v_service_rate NUMERIC;
    v_order_id UUID;
    v_order_number VARCHAR;
    v_secret_token VARCHAR;
    v_subtotal NUMERIC := 0;
    v_tax_amount NUMERIC := 0;
    v_service_charge NUMERIC := 0;
    v_total_amount NUMERIC := 0;
    v_item RECORD;
    v_db_item RECORD;
    v_item_subtotal NUMERIC;
    v_today_code VARCHAR;
    v_seq INT;
BEGIN
    -- Idempotency check
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id, order_number, customer_secret_token, total_amount
        INTO v_order_id, v_order_number, v_secret_token, v_total_amount
        FROM orders WHERE idempotency_key = p_idempotency_key;
        
        IF FOUND THEN
            RETURN jsonb_build_object(
                'success', true,
                'order_id', v_order_id,
                'order_number', v_order_number,
                'customer_secret_token', v_secret_token,
                'total_amount', v_total_amount,
                'is_idempotent', true
            );
        END IF;
    END IF;

    -- Validate dining table
    SELECT t.id, t.restaurant_id, t.table_number, r.tax_rate_percent, r.service_charge_percent, r.is_open
    INTO v_table_id, v_restaurant_id, v_table_number, v_tax_rate, v_service_rate
    FROM dining_tables t
    JOIN restaurants r ON t.restaurant_id = r.id
    WHERE t.qr_token = p_table_token AND t.is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Meja QR tidak valid atau meja sedang non-aktif.';
    END IF;

    -- Generate human-friendly order number (DQR-YYMMDD-XXX)
    v_today_code := to_char(NOW(), 'YYMMDD');
    SELECT COUNT(*) + 1 INTO v_seq FROM orders WHERE created_at::date = CURRENT_DATE;
    v_order_number := 'DQR-' || v_today_code || '-' || lpad(v_seq::text, 3, '0');
    v_secret_token := encode(gen_random_bytes(24), 'hex');

    -- Insert draft order header
    INSERT INTO orders (
        restaurant_id, table_id, table_number, order_number, customer_name,
        customer_secret_token, status, payment_status, subtotal, tax_amount,
        service_charge, total_amount, notes, idempotency_key
    ) VALUES (
        v_restaurant_id, v_table_id, v_table_number, v_order_number, p_customer_name,
        v_secret_token, 'confirmed', 'unpaid', 0, 0, 0, 0, p_notes, p_idempotency_key
    ) RETURNING id INTO v_order_id;

    -- Process items & recalculate authoritative prices
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        menu_item_id UUID,
        quantity INT,
        selected_variants JSONB,
        notes TEXT
    ) LOOP
        IF v_item.quantity <= 0 THEN
            RAISE EXCEPTION 'Kuantitas pesanan harus lebih besar dari 0.';
        END IF;

        SELECT id, name, price, is_available INTO v_db_item
        FROM menu_items
        WHERE id = v_item.menu_item_id AND restaurant_id = v_restaurant_id;

        IF NOT FOUND OR v_db_item.is_available = false THEN
            RAISE EXCEPTION 'Item menu % tidak ditemukan atau sedang habis.', v_item.menu_item_id;
        END IF;

        v_item_subtotal := v_db_item.price * v_item.quantity;
        v_subtotal := v_subtotal + v_item_subtotal;

        INSERT INTO order_items (
            order_id, menu_item_id, item_name, unit_price, quantity,
            subtotal, selected_variants, notes
        ) VALUES (
            v_order_id, v_db_item.id, v_db_item.name, v_db_item.price, v_item.quantity,
            v_item_subtotal, COALESCE(v_item.selected_variants, '[]'::jsonb), v_item.notes
        );
    END LOOP;

    -- Calculate taxes and service charge
    v_tax_amount := ROUND((v_subtotal * (v_tax_rate / 100.0)), 0);
    v_service_charge := ROUND((v_subtotal * (v_service_rate / 100.0)), 0);
    v_total_amount := v_subtotal + v_tax_amount + v_service_charge;

    UPDATE orders SET
        subtotal = v_subtotal,
        tax_amount = v_tax_amount,
        service_charge = v_service_charge,
        total_amount = v_total_amount
    WHERE id = v_order_id;

    -- Record initial status history
    INSERT INTO order_status_history (
        order_id, from_status, to_status, changed_by_name, changed_by_role, notes
    ) VALUES (
        v_order_id, 'pending', 'confirmed', 'Sistem DineQR (Pelanggan Meja ' || v_table_number || ')', 'customer', 'Pesanan berhasil dibuat melalui QR Meja'
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'customer_secret_token', v_secret_token,
        'subtotal', v_subtotal,
        'tax_amount', v_tax_amount,
        'service_charge', v_service_charge,
        'total_amount', v_total_amount
    );
END;
$$;

-- 2. Atomic Cash Payment Confirmation
CREATE OR REPLACE FUNCTION process_cash_payment(
    p_order_id UUID,
    p_cashier_id UUID,
    p_amount_tendered NUMERIC,
    p_idempotency_key VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_cashier RECORD;
    v_change NUMERIC;
BEGIN
    -- Verify cashier role
    SELECT id, name, role INTO v_cashier
    FROM profiles
    WHERE id = p_cashier_id AND is_active = true;

    IF NOT FOUND OR v_cashier.role NOT IN ('cashier', 'admin') THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya kasir atau admin yang dapat memproses pembayaran.';
    END IF;

    -- Lock order row for update
    SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pesanan tidak ditemukan.';
    END IF;

    IF v_order.payment_status = 'paid' THEN
        RAISE EXCEPTION 'Pesanan ini sudah dibayar sebelumnya.';
    END IF;

    IF v_order.status = 'cancelled' THEN
        RAISE EXCEPTION 'Tidak dapat memproses pembayaran untuk pesanan yang telah dibatalkan.';
    END IF;

    IF p_amount_tendered < v_order.total_amount THEN
        RAISE EXCEPTION 'Uang yang diterima (Rp %) kurang dari total tagihan (Rp %).', p_amount_tendered, v_order.total_amount;
    END IF;

    v_change := p_amount_tendered - v_order.total_amount;

    -- Record payment
    INSERT INTO payments (
        order_id, amount_due, amount_tendered, change_amount,
        payment_method, cashier_id, cashier_name, idempotency_key
    ) VALUES (
        v_order.id, v_order.total_amount, p_amount_tendered, v_change,
        'cash', v_cashier.id, v_cashier.name, p_idempotency_key
    );

    -- Update order payment status
    UPDATE orders SET
        payment_status = 'paid'
    WHERE id = v_order.id;

    -- Audit log
    INSERT INTO audit_logs (
        actor_name, actor_role, action, resource_type, resource_id, details
    ) VALUES (
        v_cashier.name, v_cashier.role::text, 'PROCESS_PAYMENT', 'orders', v_order.id::text,
        'Pembayaran tunai lunas. Diterima: ' || p_amount_tendered || ', Kembalian: ' || v_change
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order.id,
        'order_number', v_order.order_number,
        'amount_due', v_order.total_amount,
        'amount_tendered', p_amount_tendered,
        'change_amount', v_change,
        'cashier_name', v_cashier.name
    );
END;
$$;
