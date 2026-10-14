-- ==============================================================================
-- DINEQR POSTGRESQL MIGRATION: 20260101000001_seed_data.sql
-- Seed demo restaurant, staff accounts, tables, categories, dishes & variants
-- ==============================================================================

-- 1. Insert Restaurant Profile
INSERT INTO restaurants (
    id, name, tagline, address, phone, tax_rate_percent, service_charge_percent, currency, is_open
) VALUES (
    'a1000000-0000-0000-0000-000000000001',
    'Nusantara Rasa Signature',
    'Cita Rasa Autentik Warisan Nusantara',
    'Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan',
    '+62 812-3456-7890',
    10.00,
    5.00,
    'IDR',
    true
) ON CONFLICT (id) DO NOTHING;

-- 2. Insert Staff Profiles (Password: 'dineqr123')
INSERT INTO profiles (
    id, restaurant_id, name, email, password_hash, role, is_active
) VALUES 
(
    'b1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'Rahmat Hidayat (Manager/Admin)',
    'admin@dineqr.com',
    '$2a$10$wN92Xq3R4pE0fKzB7e0mSeO3m2bQZt7R2wZ81x5qFz1n2q0p4e7i.', -- 'dineqr123'
    'admin',
    true
),
(
    'b2000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'Chef Budi Santoso (Dapur)',
    'kitchen@dineqr.com',
    '$2a$10$wN92Xq3R4pE0fKzB7e0mSeO3m2bQZt7R2wZ81x5qFz1n2q0p4e7i.',
    'kitchen',
    true
),
(
    'b3000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    'Siti Rahmawati (Kasir)',
    'cashier@dineqr.com',
    '$2a$10$wN92Xq3R4pE0fKzB7e0mSeO3m2bQZt7R2wZ81x5qFz1n2q0p4e7i.',
    'cashier',
    true
) ON CONFLICT (id) DO NOTHING;

-- 3. Insert Dining Tables with Pre-generated QR Tokens
INSERT INTO dining_tables (id, restaurant_id, table_number, qr_token, capacity, is_active) VALUES
('t1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Meja 01', 'tbl_token_m01_nusantara', 2, true),
('t1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Meja 02', 'tbl_token_m02_nusantara', 4, true),
('t1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Meja 03', 'tbl_token_m03_nusantara', 4, true),
('t1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'Meja 04', 'tbl_token_m04_nusantara', 6, true),
('t1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'Meja 05 (VIP)', 'tbl_token_m05_nusantara', 8, true),
('t1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001', 'Meja 06 (Outdoor)', 'tbl_token_m06_nusantara', 4, true)
ON CONFLICT (id) DO NOTHING;

-- 4. Categories
INSERT INTO categories (id, restaurant_id, name, icon, sort_order, is_active) VALUES
('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Makanan Utama', 'UtensilsCrossed', 1, true),
('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Camilan & Pembuka', 'Pizza', 2, true),
('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Minuman Segar', 'Coffee', 3, true),
('c1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'Dessert Tradisional', 'IceCream', 4, true)
ON CONFLICT (id) DO NOTHING;

-- 5. Menu Items
INSERT INTO menu_items (
    id, restaurant_id, category_id, name, description, price, image_url, is_available, is_featured, prep_time_minutes
) VALUES
(
    'm1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'Nasi Goreng Bebek Kecombrang',
    'Nasi goreng pulen khas rempah nusantara dengan suwiran daging bebek gurih, potongan kecombrang wangi, emping, dan telur mata sapi.',
    55000,
    'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
    true,
    true,
    15
),
(
    'm1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'Sop Buntut Bakar Madu',
    'Buntut sapi impor pilihan dipanggang karamel madu rempah, disajikan bersama semangkuk kuah kaldu rempah hangat, emping, dan sambal ijo.',
    98000,
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    true,
    true,
    20
),
(
    'm1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'Ayam Bakar Taliwang Sasak',
    'Ayam kampung muda bakar bumbu Taliwang Lombok yang pedas gurih meresap, disajikan lengkap dengan plecing kangkung segar.',
    65000,
    'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
    true,
    false,
    18
),
(
    'm1000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000002',
    'Tahu Walik Crispy Banyuwangi',
    'Tahu walik goreng renyah isi adonan ayam udang kenyal dan gurih, disajikan dengan cocolan sambal kecap rawit pedas manis.',
    32000,
    'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80',
    true,
    false,
    10
),
(
    'm1000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000002',
    'Bakwan Jagung Udang Renyah',
    'Gorengan jagung manis pipil segar bercampur udang cincang daun bawang, digoreng garing keemasan dengan saus asam manis pedas.',
    28000,
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    true,
    false,
    10
),
(
    'm1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000003',
    'Es Kopi Gula Aren Nusantara',
    'Espresso house-blend 100% arabika nusantara dengan susu segar creamy dan sirup gula aren murni organik dari perkebunan lokal.',
    26000,
    'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80',
    true,
    true,
    5
),
(
    'm1000000-0000-0000-0000-000000000007',
    'a1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000003',
    'Es Cendol Durian Montong',
    'Cendol pandan suji kenyal beraroma alami, santan kelapa gurih, kuah gula merah nangka, dan topping daging durian legit melimpah.',
    38000,
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
    true,
    true,
    7
),
(
    'm1000000-0000-0000-0000-000000000008',
    'a1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000004',
    'Pisang Bakar Coklat Keju Wijen',
    'Pisang kepok panggang manis karamel dengan taburan keju cheddar melimpah, meises dark chocolate, dan biji wijen panggang.',
    25000,
    'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80',
    true,
    false,
    8
)
ON CONFLICT (id) DO NOTHING;

-- 6. Menu Variants
INSERT INTO menu_variants (id, menu_item_id, name, required, options) VALUES
(
    'v1000000-0000-0000-0000-000000000001',
    'm1000000-0000-0000-0000-000000000001',
    'Tingkat Kepedasan',
    true,
    '[
        {"id": "opt-1", "name": "Level 0 (Tidak Pedas)", "price_adjustment": 0},
        {"id": "opt-2", "name": "Level 1 (Sedang / Gurih)", "price_adjustment": 0},
        {"id": "opt-3", "name": "Level 2 (Pedas Mantap)", "price_adjustment": 0},
        {"id": "opt-4", "name": "Level 3 (Extra Rawit Kecombrang)", "price_adjustment": 3000}
    ]'::jsonb
),
(
    'v1000000-0000-0000-0000-000000000002',
    'm1000000-0000-0000-0000-000000000001',
    'Pilihan Telur',
    false,
    '[
        {"id": "opt-t1", "name": "Telur Mata Sapi Setengah Matang", "price_adjustment": 0},
        {"id": "opt-t2", "name": "Telur Mata Sapi Matang Penuh", "price_adjustment": 0},
        {"id": "opt-t3", "name": "Telur Dadar Crispy", "price_adjustment": 0},
        {"id": "opt-t4", "name": "Extra Tambahan Telur Bebek", "price_adjustment": 7000}
    ]'::jsonb
),
(
    'v1000000-0000-0000-0000-000000000003',
    'm1000000-0000-0000-0000-000000000003',
    'Tipe Sambal Taliwang',
    true,
    '[
        {"id": "opt-s1", "name": "Bumbu Pedas Manis", "price_adjustment": 0},
        {"id": "opt-s2", "name": "Bumbu Pedas Gurih Original Sasak", "price_adjustment": 0}
    ]'::jsonb
),
(
    'v1000000-0000-0000-0000-000000000004',
    'm1000000-0000-0000-0000-000000000003',
    'Suhu & Es',
    false,
    '[
        {"id": "opt-ice1", "name": "Dingin dengan Es Batu Pas", "price_adjustment": 0},
        {"id": "opt-ice2", "name": "Less Ice", "price_adjustment": 0},
        {"id": "opt-ice3", "name": "Hangat / Hot (Tanpa Es)", "price_adjustment": 0}
    ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
