import React, { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext.tsx';
import { api } from '../../services/api.ts';
import type { Category, MenuItem } from '../../types/index.ts';
import { formatIDR } from '../../lib/utils.ts';
import { ItemDetailModal } from './ItemDetailModal.tsx';
import {
  Search,
  Plus,
  Clock,
  Sparkles,
  ShoppingBag,
  AlertTriangle,
  MapPin,
  Phone,
  Flame,
} from 'lucide-react';

interface CustomerViewProps {
  onOpenCart: () => void;
  onOpenTracker: () => void;
}

export function CustomerView({ onOpenCart, onOpenTracker }: CustomerViewProps) {
  const { tableInfo, tableToken, items, itemCount, totalAmount, activeOrder, addItem } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [restaurant, setRestaurant] = useState<{
    name: string;
    tagline: string;
    address: string;
    phone: string;
    is_open: boolean;
  } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeItemForDetail, setActiveItemForDetail] = useState<MenuItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tableError, setTableError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await api.getPublicMenu();
        setCategories(data.categories);
        setMenuItems(data.items);
        setRestaurant(data.restaurant);
        setTableError(null);
      } catch (err: unknown) {
        console.error('Failed to load menu:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter items
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (tableToken === 'invalid_token_test') {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-red-900">Kode QR Meja Tidak Valid</h3>
        <p className="text-xs text-red-700 leading-relaxed">
          Kode QR meja yang Anda scan tidak terdaftar atau meja telah dinonaktifkan oleh restoran.
          Silakan panggil pelayan atau pilih meja lain pada simulasi meja di atas.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Restaurant Header Hero */}
      <div className="bg-[#223240] text-white pt-6 pb-12 px-4 shadow-inner relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#E1A23D]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="max-w-4xl mx-auto space-y-3 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#E1A23D] flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Restoran Buka • Melayani Pesanan</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
                {restaurant?.name || 'Nusantara Rasa Signature'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-300">
                {restaurant?.tagline || 'Cita Rasa Autentik Warisan Nusantara'}
              </p>
            </div>

            {/* Table Badge */}
            <div className="bg-[#17212B] border border-[#E1A23D]/40 px-3 py-2 rounded-xl text-right">
              <span className="text-[10px] text-gray-400 block uppercase font-mono">Lokasi Duduk</span>
              <span className="font-extrabold text-sm text-[#E1A23D]">
                {tableInfo?.table_number || 'Meja 01'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300 pt-1 border-t border-gray-700/60">
            <div className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-[#E1A23D]" />
              <span className="truncate max-w-xs">{restaurant?.address || 'Jl. Senopati No. 45, Jakarta'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Phone className="w-3.5 h-3.5 text-[#E1A23D]" />
              <span>{restaurant?.phone || '+62 812-3456-7890'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 -mt-6">
        {/* Search Input Bar */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari hidangan favorit (misal: Bebek, Buntut, Kopi)..."
            className="w-full pl-10 pr-4 py-3 bg-white text-sm text-gray-800 rounded-xl shadow-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E1A23D]"
          />
        </div>

        {/* Category Horizontal Filter */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none mb-6">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-xs ${
              selectedCategory === 'all'
                ? 'bg-[#223240] text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Semua Menu
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-xs ${
                selectedCategory === cat.id
                  ? 'bg-[#223240] text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Active Order Prompt Banner (If already has active order) */}
        {activeOrder && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-center justify-between shadow-xs">
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-xs font-bold text-amber-900">
                  Pesanan Aktif: {activeOrder.order_number}
                </span>
              </div>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Status saat ini: <strong className="uppercase">{activeOrder.status}</strong>
              </p>
            </div>
            <button
              onClick={onOpenTracker}
              className="bg-[#223240] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-[#1a2733]"
            >
              Pantau Dapur
            </button>
          </div>
        )}

        {/* Menu Items Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-gray-200 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 p-8 space-y-2">
            <p className="font-bold text-gray-700">Hidangan Tidak Ditemukan</p>
            <p className="text-xs text-gray-400">
              Tidak ada menu yang cocok dengan kata kunci "{searchQuery}".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveItemForDetail(item)}
                className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div className="relative h-44 sm:h-48 w-full bg-gray-100 overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {item.is_featured && (
                    <div className="absolute top-2.5 left-2.5 bg-[#E1A23D] text-[#17212B] text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center space-x-1 shadow-sm">
                      <Flame className="w-3 h-3" />
                      <span>Best Seller</span>
                    </div>
                  )}
                  <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-[#E1A23D]" />
                    <span>±{item.prep_time_minutes} mnt</span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-base text-[#223240] group-hover:text-[#E1A23D] transition-colors leading-snug">
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Harga</span>
                      <span className="font-extrabold text-base text-[#223240]">
                        {formatIDR(item.price)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveItemForDetail(item);
                      }}
                      className="bg-[#223240] group-hover:bg-[#E1A23D] text-white group-hover:text-[#17212B] text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{item.variants && item.variants.length > 0 ? 'Pilih Varian' : 'Tambah'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Bottom Cart Bar (Mobile First UX) */}
      {itemCount > 0 && (
        <div className="fixed bottom-3 left-4 right-4 z-40 max-w-md mx-auto animate-in slide-in-from-bottom duration-200">
          <div
            onClick={onOpenCart}
            className="bg-[#223240] text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between border border-[#E1A23D]/50 cursor-pointer hover:bg-[#1a2733] transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#E1A23D] text-[#17212B] flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#E1A23D] block">{itemCount} Hidangan Dipilih</span>
                <span className="text-sm font-extrabold">{formatIDR(totalAmount)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-1 text-xs font-bold bg-[#E1A23D] text-[#17212B] px-3.5 py-2 rounded-xl">
              <span>Buka Keranjang</span>
            </div>
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {activeItemForDetail && (
        <ItemDetailModal
          item={activeItemForDetail}
          onClose={() => setActiveItemForDetail(null)}
          onAddToCart={(item, qty, vars, notes) => {
            addItem(item, qty, vars, notes);
          }}
        />
      )}
    </div>
  );
}
