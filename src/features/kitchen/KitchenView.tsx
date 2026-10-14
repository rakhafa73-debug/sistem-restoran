import React, { useEffect, useState } from 'react';
import { api } from '../../services/api.ts';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import type { Order, OrderStatus } from '../../types/index.ts';
import { formatTimeOnly } from '../../lib/utils.ts';
import {
  ChefHat,
  Clock,
  Play,
  Check,
  CheckCheck,
  Flame,
  AlertCircle,
  RefreshCw,
  Search,
  Volume2,
} from 'lucide-react';
import { soundService } from '../../lib/audio.ts';

export function KitchenView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTable, setFilterTable] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const { subscribe } = useRealtime();

  const loadOrders = async () => {
    try {
      const res = await api.getKitchenOrders();
      setOrders(res.orders);
    } catch (err) {
      console.error('Failed to load kitchen orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    // Listen to real-time events from server SSE
    const unsubscribe = subscribe((event) => {
      if (
        event.type === 'ORDER_CREATED' ||
        event.type === 'ORDER_STATUS_UPDATED' ||
        event.type === 'PAYMENT_COMPLETED'
      ) {
        loadOrders();
      }
    });

    // Auto refresh every 20 seconds as fallback
    const interval = setInterval(loadOrders, 20000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setIsUpdating(orderId);
    try {
      await api.updateKitchenStatus(orderId, newStatus);
      await loadOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui status.';
      alert(msg);
    } finally {
      setIsUpdating(null);
    }
  };

  // Group into columns
  const confirmedOrders = orders.filter(
    (o) => o.status === 'confirmed' && o.table_number.toLowerCase().includes(filterTable.toLowerCase())
  );
  const preparingOrders = orders.filter(
    (o) => o.status === 'preparing' && o.table_number.toLowerCase().includes(filterTable.toLowerCase())
  );
  const readyOrders = orders.filter(
    (o) => o.status === 'ready' && o.table_number.toLowerCase().includes(filterTable.toLowerCase())
  );

  // Time elapsed calculator (minutes)
  const getElapsedMinutes = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  return (
    <div className="min-h-screen bg-[#17212B] text-white p-4 sm:p-6">
      {/* Header Bar */}
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#E1A23D] to-amber-400 text-[#17212B] flex items-center justify-center font-bold shadow-lg">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">KDS Dapur</h1>
              <span className="text-[11px] bg-amber-500/20 text-[#E1A23D] font-mono px-2 py-0.5 rounded border border-amber-500/30">
                KITCHEN DISPLAY SYSTEM
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Antrean aktif: <strong className="text-white font-bold">{orders.length} pesanan</strong>
            </p>
          </div>
        </div>

        {/* Quick Actions & Search */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterTable}
              onChange={(e) => setFilterTable(e.target.value)}
              placeholder="Cari Meja..."
              className="pl-9 pr-3 py-2 bg-[#223240] text-sm text-white placeholder-gray-400 rounded-xl border border-gray-700 focus:outline-none focus:border-[#E1A23D] w-36 sm:w-44"
            />
          </div>

          <button
            onClick={() => soundService.playOrderBell()}
            className="p-2.5 bg-[#223240] hover:bg-[#2d4255] text-amber-300 rounded-xl border border-gray-700 text-xs font-semibold flex items-center space-x-1"
            title="Tes Suara Notifikasi Bel Dapur"
          >
            <Volume2 className="w-4 h-4" />
            <span className="hidden sm:inline">Tes Bel</span>
          </button>

          <button
            onClick={loadOrders}
            className="p-2.5 bg-[#223240] hover:bg-[#2d4255] text-gray-200 rounded-xl border border-gray-700"
            title="Muat Ulang"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Column 1: Baru Masuk (Confirmed) */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between bg-[#223240] p-3 rounded-xl border border-gray-700">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></span>
              <h2 className="font-extrabold text-sm sm:text-base tracking-wide">1. Baru Masuk</h2>
            </div>
            <span className="bg-amber-400/20 text-amber-300 font-mono text-xs font-bold px-2 py-0.5 rounded-full">
              {confirmedOrders.length}
            </span>
          </div>

          <div className="space-y-4 flex-1">
            {confirmedOrders.length === 0 ? (
              <div className="p-8 text-center bg-[#1e2a37]/50 border border-gray-800 rounded-2xl text-gray-500 text-xs">
                Tidak ada pesanan baru yang menunggu.
              </div>
            ) : (
              confirmedOrders.map((order) => {
                const elapsed = getElapsedMinutes(order.created_at);
                const isUrgent = elapsed >= 10;

                return (
                  <div
                    key={order.id}
                    className="bg-[#223240] rounded-2xl border-2 border-amber-500/70 p-4 shadow-xl space-y-3 relative overflow-hidden"
                  >
                    {/* Header: Table & Time */}
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xl sm:text-2xl font-black text-[#E1A23D] tracking-tight block">
                          {order.table_number}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          {order.order_number} • {formatTimeOnly(order.created_at)}
                        </span>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-lg text-xs font-bold font-mono flex items-center space-x-1 ${
                          isUrgent ? 'bg-red-950 text-red-300 border border-red-700 animate-pulse' : 'bg-gray-800 text-gray-300'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{elapsed} mnt lalu</span>
                      </div>
                    </div>

                    {/* Customer Name */}
                    {order.customer_name && (
                      <div className="text-xs text-gray-300 bg-[#17212B] px-2.5 py-1 rounded-lg">
                        Pemesan: <strong className="text-white">{order.customer_name}</strong>
                      </div>
                    )}

                    {/* Items List */}
                    <div className="divide-y divide-gray-700/70 border-t border-b border-gray-700/80 py-2 space-y-2">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="pt-2 first:pt-0 space-y-1">
                          <div className="flex items-start justify-between">
                            <span className="text-sm font-bold text-white leading-tight">
                              <span className="text-[#E1A23D] text-base font-extrabold mr-1.5">
                                {item.quantity}x
                              </span>
                              {item.item_name}
                            </span>
                          </div>

                          {/* Selected Variants */}
                          {item.selected_variants && item.selected_variants.length > 0 && (
                            <div className="text-xs text-amber-300/90 font-medium pl-6">
                              {item.selected_variants.map((v) => `${v.variant_name}: ${v.option_name}`).join(', ')}
                            </div>
                          )}

                          {/* Item Custom Notes */}
                          {item.notes && (
                            <div className="text-xs text-yellow-300 italic pl-6 bg-yellow-950/40 p-1 rounded border-l-2 border-yellow-400">
                              ⚠️ "{item.notes}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Order-level notes */}
                    {order.notes && (
                      <div className="text-xs text-yellow-200 bg-yellow-950/40 p-2 rounded-lg border border-yellow-700/40">
                        Catatan Meja: {order.notes}
                      </div>
                    )}

                    {/* Action Button: Start Cooking */}
                    <button
                      type="button"
                      disabled={isUpdating === order.id}
                      onClick={() => handleUpdateStatus(order.id, 'preparing')}
                      className="w-full py-3 bg-[#E1A23D] hover:bg-amber-400 active:scale-98 text-[#17212B] font-extrabold text-sm rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-all"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{isUpdating === order.id ? 'Memproses...' : 'Mulai Masak'}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Sedang Dimasak (Preparing) */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between bg-[#223240] p-3 rounded-xl border border-gray-700">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-blue-400 animate-pulse"></span>
              <h2 className="font-extrabold text-sm sm:text-base tracking-wide">2. Sedang Dimasak</h2>
            </div>
            <span className="bg-blue-400/20 text-blue-300 font-mono text-xs font-bold px-2 py-0.5 rounded-full">
              {preparingOrders.length}
            </span>
          </div>

          <div className="space-y-4 flex-1">
            {preparingOrders.length === 0 ? (
              <div className="p-8 text-center bg-[#1e2a37]/50 border border-gray-800 rounded-2xl text-gray-500 text-xs">
                Tidak ada hidangan yang sedang dimasak saat ini.
              </div>
            ) : (
              preparingOrders.map((order) => {
                const elapsed = getElapsedMinutes(order.created_at);
                const isLate = elapsed >= 18;

                return (
                  <div
                    key={order.id}
                    className="bg-[#223240] rounded-2xl border-2 border-blue-500/70 p-4 shadow-xl space-y-3 relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xl sm:text-2xl font-black text-blue-300 tracking-tight block">
                          {order.table_number}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">{order.order_number}</span>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-lg text-xs font-bold font-mono flex items-center space-x-1 ${
                          isLate ? 'bg-red-950 text-red-300 border border-red-700 animate-pulse' : 'bg-gray-800 text-blue-300'
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                        <span>{elapsed} mnt</span>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="divide-y divide-gray-700/70 border-t border-b border-gray-700/80 py-2 space-y-2">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="pt-2 first:pt-0 space-y-1">
                          <span className="text-sm font-bold text-white leading-tight block">
                            <span className="text-blue-400 text-base font-extrabold mr-1.5">
                              {item.quantity}x
                            </span>
                            {item.item_name}
                          </span>
                          {item.selected_variants && item.selected_variants.length > 0 && (
                            <div className="text-xs text-blue-200/80 font-medium pl-6">
                              {item.selected_variants.map((v) => `${v.variant_name}: ${v.option_name}`).join(', ')}
                            </div>
                          )}
                          {item.notes && (
                            <div className="text-xs text-yellow-300 italic pl-6">"{item.notes}"</div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Action Button: Mark Ready */}
                    <button
                      type="button"
                      disabled={isUpdating === order.id}
                      onClick={() => handleUpdateStatus(order.id, 'ready')}
                      className="w-full py-3 bg-[#258653] hover:bg-emerald-600 active:scale-98 text-white font-extrabold text-sm rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-all"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>{isUpdating === order.id ? 'Menyimpan...' : 'Tandai Siap Saji'}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 3: Siap Disajikan (Ready) */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between bg-[#223240] p-3 rounded-xl border border-gray-700">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
              <h2 className="font-extrabold text-sm sm:text-base tracking-wide">3. Siap Disajikan</h2>
            </div>
            <span className="bg-emerald-400/20 text-emerald-300 font-mono text-xs font-bold px-2 py-0.5 rounded-full">
              {readyOrders.length}
            </span>
          </div>

          <div className="space-y-4 flex-1">
            {readyOrders.length === 0 ? (
              <div className="p-8 text-center bg-[#1e2a37]/50 border border-gray-800 rounded-2xl text-gray-500 text-xs">
                Tidak ada pesanan siap saji yang belum diantarkan.
              </div>
            ) : (
              readyOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-[#223240] rounded-2xl border-2 border-emerald-500/70 p-4 shadow-xl space-y-3 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight block">
                        {order.table_number}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">{order.order_number}</span>
                    </div>
                    <span className="bg-emerald-950 text-emerald-300 text-xs font-bold px-2 py-1 rounded-lg border border-emerald-700">
                      SIAP DIANTAR
                    </span>
                  </div>

                  <div className="divide-y divide-gray-700/70 border-t border-b border-gray-700/80 py-2 space-y-1.5 text-xs text-gray-200">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>
                          <strong className="text-emerald-400">{item.quantity}x</strong> {item.item_name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button: Mark Served */}
                  <button
                    type="button"
                    disabled={isUpdating === order.id}
                    onClick={() => handleUpdateStatus(order.id, 'served')}
                    className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Selesai Saji ke Meja</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
