# DineQR — Smart Restaurant Ordering System

DineQR adalah sistem pemesanan restoran berbasis QR Code untuk satu restoran dengan alur operasional penuh: menu digital meja pelanggan, pesanan real-time ke dapur (KDS), kasir Point of Sale (POS) dengan kalkulasi uang tunai & kembalian, cetak struk thermal 80mm, serta konsol manajemen admin.

---

## 🌟 Arsitektur & Peran Pengguna

### 1. Pelanggan (Customer)
- **Tanpa Wajib Registrasi Akun:** Pelanggan cukup memindai QR Code di meja fisik.
- **Menu Dinamis:** Melihat foto hidangan beresolusi tinggi, harga, varian (Level Pedas, Pilihan Telur/Topping), dan ketersediaan stok secara langsung.
- **Keranjang & Rekalkulasi Authoritative:** Keranjang tersimpan di perangkat lokal, namun harga dan perhitungan pajak PB1 (10%) serta service charge (5%) selalu dihitung ulang oleh server secara aman.
- **Checkout Atomik:** Mendapatkan nomor pesanan unik (`DQR-YYMMDD-XXX`) serta token rahasia akses pesanan (`customer_secret_token`) agar pelanggan hanya dapat melihat status pesanan miliknya sendiri.
- **Pelacakan Real-Time:** Memantau kemajuan pesanan dari *Diterima Dapur* ➔ *Sedang Dimasak* ➔ *Siap Disajikan* ➔ *Selesai* via Server-Sent Events (SSE).
- **Pembatalan Mandiri:** Pelanggan dapat membatalkan pesanan selama status masih dalam antrean (belum mulai dimasak oleh chef).

### 2. Dapur (Kitchen Display System - KDS)
- **Tampilan Dark-Mode Kontras Tinggi (`#17212B`):** Didesain khusus untuk lingkungan operasional dapur yang sibuk.
- **Kanban Otomatis 3 Kolom:** 
  1. *Baru Masuk* (`confirmed`)
  2. *Sedang Dimasak* (`preparing`)
  3. *Siap Disajikan* (`ready`)
- **Notifikasi Bel Dapur Sintetis:** Menggunakan Web Audio API synthesizer bawaan (ding-dong dual-tone) saat pesanan baru masuk tanpa membutuhkan file audio eksternal.
- **Timer Durasi Masak:** Memberikan indikator warna saat pesanan melampaui batas waktu wajar.

### 3. Kasir (Cashier POS)
- **Antrean Tagihan Meja:** Menyaring pesanan belum bayar dan lunas.
- **Kalkulasi Uang Tunai:** Pilihan cepat nominal uang (Pas, Rp 50.000, Rp 100.000, Rp 200.000, Rp 500.000), input nominal bebas, dan perhitungan otomatis uang kembalian.
- **Proteksi Transaksi:** Validasi server bahwa uang diterima $\ge$ total tagihan sebelum status pembayaran beralih menjadi `paid`.
- **Cetak Struk Thermal 80mm:** Dilengkapi dialog cetak standar struk kasir restoran dengan nomor transaksi, rincian hidangan, pajak restoran PB1, biaya layanan, dan status lunas.

### 4. Admin / Manajer
- **Laporan Finansial:** Total penjualan riil (hanya dari transaksi lunas), AOV (Average Order Value), item terlaris, dan histori transaksi kasir.
- **Manajemen Meja & QR:** Pembuatan meja baru, regenerasi token QR meja jika disalahgunakan, pratinjau QR menggunakan engine `qrcode`, unduh PNG, dan cetak stiker meja.
- **Katalog Menu:** Tambah/hapus menu, ubah harga, toggle stok habis/tersedia, dan kategori.
- **Manajemen Staf & Audit Trail:** Pembuatan akun staf dengan peran (*admin*, *kitchen*, *cashier*) dan log audit setiap mutasi data sensitif.

---

## 🗄️ Database & Migrasi PostgreSQL (Supabase)

Migrasi database PostgreSQL lengkap tersedia pada direktori `supabase/migrations/`:
1. `supabase/migrations/20260101000000_create_dineqr_schema.sql`
   - Tabel: `restaurants`, `profiles`, `dining_tables`, `categories`, `menu_items`, `menu_variants`, `orders`, `order_items`, `payments`, `order_status_history`, `audit_logs`.
   - Constraints, UUIDs, Foreign Keys, Timestamp triggers `set_updated_at()`.
   - Kebijakan Row Level Security (RLS) untuk akses publik terisolasi dan izin staf internal.
   - Fungsi tersimpan atomik: `create_qr_order()`, `process_cash_payment()`.
2. `supabase/migrations/20260101000001_seed_data.sql`
   - Data demo Nusantara Rasa Signature, 6 meja dengan token QR unik, hidangan nusantara lengkap, varian, dan akun staf demo.

---

## 🔑 Kredensial Staf Demo

Untuk login cepat atau pengujian multi-peran, gunakan akun bawaan berikut:
- **Admin:** `admin@dineqr.com` (Sandi: `dineqr123`)
- **Dapur:** `kitchen@dineqr.com` (Sandi: `dineqr123`)
- **Kasir:** `cashier@dineqr.com` (Sandi: `dineqr123`)

*Catatan: Navbar aplikasi telah dilengkapi tombol pengalih peran cepat (Quick Role Switcher) untuk memudahkan pengujian seluruh alur dalam satu klik.*

---

## 🚀 Menjalankan Proyek & Pengujian

### 1. Menjalankan Server Pengembangan
```bash
npm run dev
```
Server Express akan aktif di port 3000 dengan Vite middlewares yang melayani antarmuka frontend SPA secara terintegrasi.

### 2. Menjalankan Unit Test (Vitest)
```bash
npm run test
```

### 3. Build Produksi
```bash
npm run build
```
Menghasilkan bundle statis di folder `dist/` untuk deployment ke Vercel atau Google Cloud Run.
