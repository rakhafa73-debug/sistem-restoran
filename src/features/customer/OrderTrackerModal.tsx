import React, { useState } from 'react';
import { useCart } from '../../context/CartContext.tsx';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { api } from '../../services/api.ts';
import { formatIDR, formatTimeOnly } from '../../lib/utils.ts';
import type { OrderStatus } from '../../types/index.ts';
import {
  X,
  Clock,
  CheckCircle,
  ChefHat,
  BellRing,
  AlertOctagon,
  RefreshCw,
  Utensils,
  Receipt,
} from 'lucide-react';

interface OrderTrackerModalProps {
  onClose: () => void;
}

const statusSteps: Array<{ key: OrderStatus; label: string; description: string; icon: any }> = [
  { key: 'confirmed', label: 'Diterima Dapur', description: 'Pesanan masuk ke antrean masak', icon: Clock },
  { key: 'preparing', label: 'Sedang Dimasak', description: 'Chef sedang menyiapkan hidangan', icon: ChefHat },
  { key: 'ready', label: 'Siap Disajikan', description: 'Makanan selesai, sedang diantar ke meja', icon: BellRing },
  { key: 'served', label: 'Telah Disajikan', description: 'Selamat menikmati santapan Anda', icon: Utensils },
  { key: 'completed', label: 'Selesai', description: 'Transaksi selesai & lunas', icon: CheckCircle },
];

export function OrderTrackerModal({ onClose }: OrderTrackerModalProps) {
  const { activeOrder, refreshActiveOrder, setActiveOrder } = useCart();
  const { isConnected } = useRealtime();
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!activeOrder) return null;

  const currentStepIndex = statusSteps.findIndex((s) => s.key === activeOrder.status);
  const isCancelled = activeOrder.status === 'cancelled';
  const canCancel = activeOrder.status === 'confirmed';

  const handleCancel = async () => {
    setIsCancelling(true);
    setErrorMessage(null);
    try {
      const res = await api.cancelOrder(activeOrder.id, cancelReason);
      setActiveOrder(res.order);
      setShowCancelPrompt(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membatalkan pesanan.';
      setErrorMessage(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#FDFBF7] text-[#223240] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-[#223240] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-[#E1A23D]" />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base">{activeOrder.order_number}</h3>
                <span className="text-[10px] bg-[#E1A23D] text-[#17212B] font-bold px-1.5 py-0.5 rounded">
                  {activeOrder.table_number}
                </span>
              </div>
              <p className="text-[11px] text-gray-300">
                Waktu Pesan: {formatTimeOnly(activeOrder.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => refreshActiveOrder()}
              className="p-1.5 text-gray-300 hover:text-white rounded-lg hover:bg-white/10"
              title="Perbarui status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-300 hover:text-white rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live sync banner */}
        <div className="bg-amber-50 px-4 py-2 border-b border-amber-200/60 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center space-x-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium">
              Pelacakan Real-time {isConnected ? '(Terhubung)' : '(Menghubungkan...)'}
            </span>
          </div>
          <div>
            <span
              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                activeOrder.payment_status === 'paid'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {activeOrder.payment_status === 'paid' ? 'LUNAS (KASIR)' : 'BELUM DIBAYAR'}
            </span>
          </div>
        </div>

        {/* Body Tracker Steps */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {errorMessage}
            </div>
          )}

          {isCancelled ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center space-y-2">
              <AlertOctagon className="w-8 h-8 text-red-500 mx-auto" />
              <h4 className="font-bold text-red-800">Pesanan Dibatalkan</h4>
              <p className="text-xs text-red-600">
                Pesanan ini telah dibatalkan. Anda dapat membuat pesanan baru dari menu.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200">
              {statusSteps.map((step, idx) => {
                const Icon = step.icon;
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={step.key} className="relative flex items-start space-x-3">
                    <div
                      className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-[#E1A23D] text-[#17212B] ring-4 ring-amber-100'
                          : isPassed
                          ? 'bg-[#258653] text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isPassed && !isCurrent ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : (
                        <Icon className="w-3 h-3" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h5
                          className={`text-sm font-bold ${
                            isCurrent
                              ? 'text-[#E1A23D]'
                              : isPassed
                              ? 'text-[#223240]'
                              : 'text-gray-400'
                          }`}
                        >
                          {step.label}
                        </h5>
                        {isCurrent && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-full">
                            Sedang Berlangsung
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Ordered Items summary */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Daftar Hidangan Diproses
            </h5>
            <div className="divide-y divide-gray-100 text-xs">
              {activeOrder.items?.map((item, idx) => (
                <div key={idx} className="py-2 flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-gray-800">
                      {item.quantity}x {item.item_name}
                    </span>
                    {item.selected_variants && item.selected_variants.length > 0 && (
                      <div className="text-[11px] text-gray-500">
                        {item.selected_variants.map((v) => `${v.variant_name}: ${v.option_name}`).join(', ')}
                      </div>
                    )}
                    {item.notes && (
                      <div className="text-[11px] text-amber-800 italic">"{item.notes}"</div>
                    )}
                  </div>
                  <span className="font-semibold text-gray-700">{formatIDR(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-gray-200 flex justify-between text-xs font-bold">
              <span>Total Tagihan:</span>
              <span className="text-[#E1A23D] font-extrabold">{formatIDR(activeOrder.total_amount)}</span>
            </div>
          </div>

          {/* Cancellation section */}
          {canCancel && !isCancelled && (
            <div className="pt-2">
              {!showCancelPrompt ? (
                <button
                  type="button"
                  onClick={() => setShowCancelPrompt(true)}
                  className="w-full py-2.5 px-3 border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-xl transition-all"
                >
                  Batalkan Pesanan Ini
                </button>
              ) : (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 text-xs">
                  <p className="font-bold text-red-800">Konfirmasi Pembatalan Pesanan</p>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Alasan pembatalan (misal: ingin mengganti menu)"
                    className="w-full p-2 bg-white border border-red-200 rounded-lg text-xs"
                  />
                  <div className="flex space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCancelPrompt(false)}
                      className="flex-1 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg"
                    >
                      Kembali
                    </button>
                    <button
                      type="button"
                      disabled={isCancelling}
                      onClick={handleCancel}
                      className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg disabled:opacity-50"
                    >
                      {isCancelling ? 'Membatalkan...' : 'Ya, Batalkan'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
          <p className="text-[11px] text-gray-500">
            Pembayaran tunai dapat dilakukan di kasir saat hidangan selesai dinikmati.
          </p>
        </div>
      </div>
    </div>
  );
}
