import React, { useState } from 'react';
import { useCart } from '../../context/CartContext.tsx';
import { formatIDR } from '../../lib/utils.ts';
import { X, CheckCircle2, AlertCircle, Banknote, Utensils } from 'lucide-react';

interface CheckoutModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CheckoutModal({ onClose, onSuccess }: CheckoutModalProps) {
  const { tableInfo, totalAmount, itemCount, submitCheckout, isCheckingOut } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      await submitCheckout(customerName.trim(), orderNotes.trim());
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirimkan pesanan.';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-[#FDFBF7] text-[#223240] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2">
            <Utensils className="w-5 h-5 text-[#E1A23D]" />
            <h3 className="font-bold text-lg">Konfirmasi Pesanan</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirmOrder} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Table & Total summary card */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 flex justify-between items-center">
            <div>
              <span className="text-xs text-gray-500">Nomor Meja</span>
              <p className="font-extrabold text-base text-[#223240]">
                {tableInfo?.table_number || 'Meja Dipilih'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500">Total ({itemCount} item)</span>
              <p className="font-extrabold text-lg text-[#E1A23D]">{formatIDR(totalAmount)}</p>
            </div>
          </div>

          {/* Customer Name */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Nama Pemesan (Opsional)
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Contoh: Bpk. Dani"
              className="w-full text-sm p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#E1A23D] focus:outline-none"
            />
          </div>

          {/* Order Notes */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Catatan Meja Tambahan
            </label>
            <textarea
              rows={2}
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Contoh: Mohon sediakan sendok garpu ekstra untuk anak kecil"
              className="w-full text-sm p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#E1A23D] focus:outline-none"
            />
          </div>

          {/* Payment Notice */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/70 text-xs text-amber-900 flex items-start space-x-2.5">
            <Banknote className="w-4 h-4 text-[#E1A23D] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Pembayaran Tunai di Kasir</p>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                Pesanan Anda akan langsung diteruskan ke Dapur. Pembayaran dilakukan secara tunai di Kasir saat hendak pulang.
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isCheckingOut}
              className="w-full bg-[#E1A23D] hover:bg-amber-400 active:scale-[0.98] text-[#17212B] font-bold py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center space-x-2 text-sm transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCheckingOut ? 'Mengirimkan Pesanan...' : 'Pesan Sekarang'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
