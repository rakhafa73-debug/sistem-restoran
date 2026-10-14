import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { api } from '../../services/api.ts';
import type {
  Category,
  DiningTable,
  MenuItem,
  Profile,
  Restaurant,
  Role,
} from '../../types/index.ts';
import { formatDateTime, formatIDR } from '../../lib/utils.ts';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  QrCode,
  UtensilsCrossed,
  Settings,
  FileText,
  ShieldAlert,
  Plus,
  RefreshCw,
  Download,
  Printer,
  Trash2,
  CheckCircle,
  X,
  ExternalLink,
} from 'lucide-react';

export function AdminView() {
  const [activeTab, setActiveTab] = useState<
    'reports' | 'tables' | 'menu' | 'staff' | 'settings' | 'audit'
  >('reports');

  // Reports State
  const [reportData, setReportData] = useState<any>(null);

  // Tables State
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('4');
  const [qrModalTable, setQrModalTable] = useState<{ table: DiningTable; qrDataUrl: string } | null>(null);

  // Menu State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuPrice, setNewMenuPrice] = useState('');
  const [newMenuCategory, setNewMenuCategory] = useState('');
  const [newMenuDesc, setNewMenuDesc] = useState('');
  const [newMenuImage, setNewMenuImage] = useState('');

  // Staff State
  const [staffList, setStaffList] = useState<Profile[]>([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<Role>('cashier');

  // Settings State
  const [restaurantSettings, setRestaurantSettings] = useState<Restaurant | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [rep, tbl, men, cat, stf, set, aud] = await Promise.all([
        api.getAdminReports(),
        api.getAdminTables(),
        api.getAdminMenu(),
        api.getAdminCategories(),
        api.getAdminStaff(),
        api.getAdminSettings(),
        api.getAuditLogs(),
      ]);

      if (rep?.report) setReportData(rep.report);
      if (Array.isArray(tbl?.tables)) setTables(tbl.tables);
      if (Array.isArray(men?.menuItems)) setMenuItems(men.menuItems);
      if (Array.isArray(cat?.categories)) {
        setCategories(cat.categories);
        if (cat.categories.length > 0 && !newMenuCategory) {
          setNewMenuCategory(cat.categories[0].id);
        }
      }
      if (Array.isArray(stf?.profiles)) setStaffList(stf.profiles);
      if (set?.restaurant) setRestaurantSettings(set.restaurant);
      if (Array.isArray(aud?.logs)) setAuditLogs(aud.logs);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Generate QR Code Modal with library 'qrcode'
  const handleOpenQR = async (table: DiningTable) => {
    const origin = window.location.origin;
    const tableUrl = `${origin}/?table=${table.qr_token}`;
    try {
      const dataUrl = await QRCode.toDataURL(tableUrl, {
        width: 380,
        margin: 2,
        color: {
          dark: '#17212B',
          light: '#FFFFFF',
        },
      });
      setQrModalTable({ table, qrDataUrl: dataUrl });
    } catch (err) {
      console.error('Failed to generate QR:', err);
    }
  };

  const handleRegenerateQR = async (tableId: string) => {
    if (!confirm('Regenerasi kode QR akan membatalkan kode QR meja yang sedang ditempel. Lanjutkan?')) {
      return;
    }
    try {
      const res = await api.regenerateQR(tableId);
      setTables(tables.map((t) => (t.id === tableId ? res.table : t)));
      showNotification('Token QR meja berhasil diregenerasi.');
      handleOpenQR(res.table);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal regenerasi QR.');
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber) return;
    try {
      const res = await api.createTable(newTableNumber, parseInt(newTableCapacity) || 4);
      setTables([...tables, res.table]);
      setNewTableNumber('');
      showNotification(`Meja ${res.table.table_number} berhasil dibuat.`);
      handleOpenQR(res.table);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal membuat meja.');
    }
  };

  const handleToggleMenuAvailability = async (item: MenuItem) => {
    try {
      const updated = await api.updateMenuItem(item.id, { is_available: !item.is_available });
      setMenuItems(menuItems.map((m) => (m.id === item.id ? updated.item : m)));
      showNotification(`Status ketersediaan ${item.name} diperbarui.`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal memperbarui menu.');
    }
  };

  const handleCreateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuName || !newMenuPrice) return;
    try {
      const res = await api.createMenuItem({
        name: newMenuName,
        price: parseFloat(newMenuPrice),
        category_id: newMenuCategory,
        description: newMenuDesc,
        image_url: newMenuImage || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        is_available: true,
        prep_time_minutes: 15,
      });
      setMenuItems([...menuItems, res.item]);
      setNewMenuName('');
      setNewMenuPrice('');
      setNewMenuDesc('');
      setNewMenuImage('');
      showNotification(`Menu ${res.item.name} berhasil ditambahkan.`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menambah menu.');
    }
  };

  const handleDeleteMenuItem = async (id: string, name: string) => {
    if (!confirm(`Hapus menu "${name}" secara permanen?`)) return;
    try {
      await api.deleteMenuItem(id);
      setMenuItems(menuItems.filter((m) => m.id !== id));
      showNotification(`Menu ${name} berhasil dihapus.`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus menu.');
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail) return;
    try {
      const res = await api.createStaff(newStaffName, newStaffEmail, newStaffRole);
      setStaffList([...staffList, res.profile]);
      setNewStaffName('');
      setNewStaffEmail('');
      showNotification(`Staf ${res.profile.name} berhasil didaftarkan.`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal mendaftarkan staf.');
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantSettings) return;
    try {
      const res = await api.updateAdminSettings(restaurantSettings);
      setRestaurantSettings(res.restaurant);
      showNotification('Pengaturan restoran berhasil disimpan.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F5F7] text-[#223240] p-4 sm:p-6 pb-20">
      {/* Toast Notification */}
      {successMsg && (
        <div className="fixed top-20 right-4 z-50 bg-[#223240] text-[#E1A23D] px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold border border-[#E1A23D] animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Admin Header */}
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-[#223240] text-[#E1A23D] flex items-center justify-center font-bold shadow-md">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Admin Console</h1>
              <span className="text-[11px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded">
                MANAGER
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Laporan omzet, QR meja, katalog menu, akun staf & audit log
            </p>
          </div>
        </div>

        <button
          onClick={loadAllData}
          className="p-2.5 bg-white hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-200 shadow-xs flex items-center space-x-1.5 text-xs font-semibold"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Muat Ulang Data</span>
        </button>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="max-w-7xl mx-auto flex space-x-2 overflow-x-auto py-4 scrollbar-none border-b border-gray-200">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition-all ${
            activeTab === 'reports'
              ? 'bg-[#223240] text-white shadow-md'
              : 'bg-white text-gray-600 hover:text-black border border-gray-200'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-[#E1A23D]" />
          <span>Laporan Penjualan</span>
        </button>
        <button
          onClick={() => setActiveTab('tables')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition-all ${
            activeTab === 'tables'
              ? 'bg-[#223240] text-white shadow-md'
              : 'bg-white text-gray-600 hover:text-black border border-gray-200'
          }`}
        >
          <QrCode className="w-4 h-4 text-[#E1A23D]" />
          <span>Meja & QR Code</span>
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition-all ${
            activeTab === 'menu'
              ? 'bg-[#223240] text-white shadow-md'
              : 'bg-white text-gray-600 hover:text-black border border-gray-200'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4 text-[#E1A23D]" />
          <span>Kelola Menu</span>
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition-all ${
            activeTab === 'staff'
              ? 'bg-[#223240] text-white shadow-md'
              : 'bg-white text-gray-600 hover:text-black border border-gray-200'
          }`}
        >
          <Users className="w-4 h-4 text-[#E1A23D]" />
          <span>Akun Staf</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition-all ${
            activeTab === 'settings'
              ? 'bg-[#223240] text-white shadow-md'
              : 'bg-white text-gray-600 hover:text-black border border-gray-200'
          }`}
        >
          <Settings className="w-4 h-4 text-[#E1A23D]" />
          <span>Pengaturan Resto</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition-all ${
            activeTab === 'audit'
              ? 'bg-[#223240] text-white shadow-md'
              : 'bg-white text-gray-600 hover:text-black border border-gray-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-[#E1A23D]" />
          <span>Audit Log</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="max-w-7xl mx-auto mt-6">
        {/* TAB 1: REPORTS */}
        {activeTab === 'reports' && reportData && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                  Total Pendapatan Lunas
                </span>
                <span className="text-2xl font-black text-[#258653] mt-1 block">
                  {formatIDR(reportData.total_sales)}
                </span>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Hanya dari pesanan terkonfirmasi bayar tunai
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                  Jumlah Transaksi Selesai
                </span>
                <span className="text-2xl font-black text-[#223240] mt-1 block">
                  {reportData.paid_orders_count} pesanan
                </span>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Total pesanan masuk: {reportData.total_orders}
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                  Rata-rata Nilai Transaksi (AOV)
                </span>
                <span className="text-2xl font-black text-[#E1A23D] mt-1 block">
                  {formatIDR(reportData.average_order_value)}
                </span>
                <span className="text-[11px] text-gray-400 mt-1 block">Rerata per meja</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                  Pajak PB1 & Service
                </span>
                <span className="text-2xl font-black text-[#223240] mt-1 block">
                  {formatIDR(reportData.total_tax + reportData.total_service)}
                </span>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Pajak: {formatIDR(reportData.total_tax)} • Service: {formatIDR(reportData.total_service)}
                </span>
              </div>
            </div>

            {/* Top Selling Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                <h3 className="font-extrabold text-base text-[#223240]">
                  Produk Terlaris (Top Selling)
                </h3>
                <div className="divide-y divide-gray-100 text-xs">
                  {reportData.top_selling_items?.length === 0 ? (
                    <p className="text-gray-400 py-4 text-center">Belum ada data penjualan.</p>
                  ) : (
                    reportData.top_selling_items.map((item: any, idx: number) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-extrabold flex items-center justify-center text-xs">
                            #{idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-gray-800 text-sm">{item.name}</span>
                            <p className="text-gray-400">{item.quantity} porsi terjual</p>
                          </div>
                        </div>
                        <span className="font-extrabold text-[#E1A23D]">{formatIDR(item.revenue)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Payments Log */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                <h3 className="font-extrabold text-base text-[#223240]">
                  Riwayat Pembayaran Kasir Terbaru
                </h3>
                <div className="divide-y divide-gray-100 text-xs max-h-80 overflow-y-auto">
                  {reportData.recent_payments?.length === 0 ? (
                    <p className="text-gray-400 py-4 text-center">Belum ada transaksi pembayaran.</p>
                  ) : (
                    reportData.recent_payments.map((pay: any, idx: number) => (
                      <div key={idx} className="py-2.5 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-gray-800">
                            Kasir: {pay.cashier_name}
                          </span>
                          <p className="text-gray-400 font-mono text-[10px]">
                            {formatDateTime(pay.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-emerald-700 block">
                            {formatIDR(pay.amount_due)}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            Diterima: {formatIDR(pay.amount_tendered)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DINING TABLES & QR CODES */}
        {activeTab === 'tables' && (
          <div className="space-y-6">
            {/* Create Table Form */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <h3 className="font-extrabold text-base text-[#223240] mb-3">
                Tambah Meja Restoran Baru
              </h3>
              <form onSubmit={handleCreateTable} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                    placeholder="Contoh: Meja 07, Meja 08 (Balkon)"
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E1A23D]"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={newTableCapacity}
                    onChange={(e) => setNewTableCapacity(e.target.value)}
                    placeholder="Kapasitas (Kursi)"
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E1A23D]"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#223240] hover:bg-[#1a2733] text-white font-bold text-xs p-3 rounded-xl flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4 text-[#E1A23D]" />
                  <span>Buat Meja & QR</span>
                </button>
              </form>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-lg text-[#223240]">{table.table_number}</h4>
                      <p className="text-xs text-gray-500">Kapasitas: {table.capacity} orang</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        table.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {table.is_active ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 font-mono text-[10px] text-gray-500 truncate">
                    Token: {table.qr_token}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => handleOpenQR(table)}
                      className="bg-[#E1A23D] hover:bg-amber-400 text-[#17212B] font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center space-x-1"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Cetak QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRegenerateQR(table.id)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs py-2 px-3 rounded-xl flex items-center justify-center space-x-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Ganti Token</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MENU ITEMS */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            {/* Create Menu Form */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
              <h3 className="font-extrabold text-base text-[#223240]">Tambah Hidangan Baru</h3>
              <form onSubmit={handleCreateMenuItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Nama Menu</label>
                  <input
                    type="text"
                    required
                    value={newMenuName}
                    onChange={(e) => setNewMenuName(e.target.value)}
                    placeholder="Contoh: Sate Lilit Ikan"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    required
                    value={newMenuPrice}
                    onChange={(e) => setNewMenuPrice(e.target.value)}
                    placeholder="45000"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Kategori</label>
                  <select
                    value={newMenuCategory}
                    onChange={(e) => setNewMenuCategory(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">URL Foto (Unsplash/CDN)</label>
                  <input
                    type="url"
                    value={newMenuImage}
                    onChange={(e) => setNewMenuImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="font-bold text-gray-700 block mb-1">Deskripsi Singkat</label>
                  <input
                    type="text"
                    value={newMenuDesc}
                    onChange={(e) => setNewMenuDesc(e.target.value)}
                    placeholder="Bumbu rempah khas Bali disajikan dengan sambal matah..."
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-[#223240] hover:bg-[#1a2733] text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-1"
                  >
                    <Plus className="w-4 h-4 text-[#E1A23D]" />
                    <span>Simpan Menu</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Menu Items Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase">
                    <tr>
                      <th className="p-4">Foto & Menu</th>
                      <th className="p-4">Kategori</th>
                      <th className="p-4">Harga</th>
                      <th className="p-4">Status Stok</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {menuItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="p-4 flex items-center space-x-3">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                          <div>
                            <span className="font-bold text-sm text-[#223240] block">{item.name}</span>
                            <span className="text-gray-400 text-[11px] line-clamp-1">{item.description}</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-600 font-medium">
                          {categories.find((c) => c.id === item.category_id)?.name || 'Umum'}
                        </td>
                        <td className="p-4 font-extrabold text-[#E1A23D]">{formatIDR(item.price)}</td>
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => handleToggleMenuAvailability(item)}
                            className={`px-2.5 py-1 rounded-full font-bold text-[10px] transition-all ${
                              item.is_available
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {item.is_available ? 'TERSEDIA' : 'HABIS'}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteMenuItem(item.id, item.name)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: STAFF MANAGEMENT */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
              <h3 className="font-extrabold text-base text-[#223240]">Daftarkan Akun Staf Baru</h3>
              <form onSubmit={handleCreateStaff} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <input
                    type="text"
                    required
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="Nama Lengkap Staf"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    required
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="email@dineqr.com"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as Role)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                  >
                    <option value="cashier">Kasir (Cashier)</option>
                    <option value="kitchen">Dapur (Kitchen)</option>
                    <option value="admin">Administrator / Manager</option>
                  </select>
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-full bg-[#223240] hover:bg-[#1a2733] text-white font-bold p-2.5 rounded-xl flex items-center justify-center space-x-1"
                  >
                    <Plus className="w-4 h-4 text-[#E1A23D]" />
                    <span>Tambah Staf</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {staffList.map((stf) => (
                <div key={stf.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-[#223240]">{stf.name}</h4>
                      <p className="text-xs text-gray-500 font-mono">{stf.email}</p>
                    </div>
                    <span className="bg-[#223240] text-[#E1A23D] text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                      {stf.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">Status: Aktif</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: RESTAURANT SETTINGS */}
        {activeTab === 'settings' && restaurantSettings && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs max-w-2xl space-y-4">
            <h3 className="font-extrabold text-base text-[#223240]">Pengaturan Profil & Pajak Restoran</h3>
            <form onSubmit={handleUpdateSettings} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Nama Restoran</label>
                <input
                  type="text"
                  value={restaurantSettings.name}
                  onChange={(e) => setRestaurantSettings({ ...restaurantSettings, name: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Tagline</label>
                <input
                  type="text"
                  value={restaurantSettings.tagline}
                  onChange={(e) => setRestaurantSettings({ ...restaurantSettings, tagline: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  value={restaurantSettings.address}
                  onChange={(e) => setRestaurantSettings({ ...restaurantSettings, address: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Nomor Telepon</label>
                <input
                  type="text"
                  value={restaurantSettings.phone}
                  onChange={(e) => setRestaurantSettings({ ...restaurantSettings, phone: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Pajak Restoran PB1 (%)</label>
                  <input
                    type="number"
                    value={restaurantSettings.tax_rate_percent}
                    onChange={(e) => setRestaurantSettings({ ...restaurantSettings, tax_rate_percent: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Biaya Layanan (%)</label>
                  <input
                    type="number"
                    value={restaurantSettings.service_charge_percent}
                    onChange={(e) => setRestaurantSettings({ ...restaurantSettings, service_charge_percent: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3.5 bg-[#E1A23D] hover:bg-amber-400 text-[#17212B] font-bold rounded-xl shadow-md"
              >
                Simpan Perubahan Pengaturan
              </button>
            </form>
          </div>
        )}

        {/* TAB 6: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-extrabold text-sm text-[#223240]">Jejak Audit Aktivitas Sistem</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase">
                  <tr>
                    <th className="p-3">Waktu</th>
                    <th className="p-3">Pelaku</th>
                    <th className="p-3">Aksi</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="p-3 text-gray-500">{formatDateTime(log.created_at)}</td>
                      <td className="p-3 font-bold text-gray-800">
                        {log.actor_name} ({log.actor_role})
                      </td>
                      <td className="p-3 text-[#E1A23D] font-bold">{log.action}</td>
                      <td className="p-3 text-gray-600">{log.resource_type}</td>
                      <td className="p-3 text-gray-500 truncate max-w-xs">{log.details || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Printable Dialog Modal */}
      {qrModalTable && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white text-gray-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-[#223240] text-white flex justify-between items-center">
              <div className="flex items-center space-x-1.5">
                <QrCode className="w-4 h-4 text-[#E1A23D]" />
                <span className="font-bold text-xs">QR Code Meja {qrModalTable.table.table_number}</span>
              </div>
              <button
                onClick={() => setQrModalTable(null)}
                className="p-1 text-gray-300 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-center space-y-4">
              <div className="border-4 border-[#223240] p-4 rounded-2xl bg-white shadow-inner inline-block">
                <img
                  src={qrModalTable.qrDataUrl}
                  alt={`QR ${qrModalTable.table.table_number}`}
                  className="w-56 h-56 mx-auto"
                />
                <h4 className="font-black text-xl text-[#223240] mt-2">
                  {qrModalTable.table.table_number}
                </h4>
                <p className="text-[11px] text-gray-500">Scan untuk Membuka Menu & Memesan</p>
              </div>

              <div className="flex space-x-2 pt-2">
                <a
                  href={qrModalTable.qrDataUrl}
                  download={`DineQR-${qrModalTable.table.table_number}.png`}
                  className="flex-1 py-2.5 bg-[#223240] hover:bg-[#1a2733] text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-[#E1A23D]" />
                  <span>Unduh PNG</span>
                </a>
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-[#E1A23D] hover:bg-amber-400 text-[#17212B] font-bold text-xs rounded-xl flex items-center justify-center space-x-1 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Stiker</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
