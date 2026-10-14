import React, { useState } from 'react';
import { useCart } from '../../context/CartContext.tsx';
import { formatIDR } from '../../lib/utils.ts';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { CheckoutModal } from './CheckoutModal.tsx';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: () => void;
}

export function CartDrawer({ isOpen, onClose, onOrderSuccess }: CartDrawerProps) {
  const {
    items,
    itemCount,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    taxAmount,
    serviceCharge,
    totalAmount,
    taxRatePercent,
    serviceChargePercent,
    tableInfo,
  } = useCart();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
        <div className="w-full max-w-md bg-[#FDFBF7] text-[#223240] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-[#E1A23D]" />
              <h2 className="font-bold text-lg">Pesanan Saya</h2>
              {tableInfo && (
                <span className="bg-[#223240] text-[#E1A23D] text-xs font-semibold px-2 py-0.5 rounded-full">
                  {tableInfo.table_number}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <ShoppingBag className="w-8 h-8 text-gray-300" />
                </div>
                <p className="font-semibold text-gray-600">Keranjang Masih Kosong</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  Silakan pilih hidangan lezat khas Nusantara dari daftar menu kami.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-500">{itemCount} item dipilih</span>
                  <button
                    onClick={clearCart}
                    className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Kosongkan</span>
                  </button>
                </div>

                {items.map((item, index) => (
                  <div
                    key={`${item.menuItem.id}-${index}`}
                    className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-[#223240]">{item.menuItem.name}</h4>
                        <div className="text-xs font-bold text-[#E1A23D]">
                          {formatIDR(item.calculatedPrice)}
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(index)}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Variant selections */}
                    {item.selectedVariants.length > 0 && (
                      <div className="bg-amber-50/60 p-2 rounded-lg text-xs space-y-0.5 text-amber-900 border border-amber-100">
                        {item.selectedVariants.map((v, vIdx) => (
                          <div key={vIdx} className="flex justify-between">
                            <span className="text-gray-600">{v.variant_name}:</span>
                            <span className="font-medium text-gray-800">{v.option_name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Notes */}
                    {item.notes && (
                      <div className="text-xs text-gray-500 italic bg-gray-50 p-1.5 rounded-md border border-gray-100">
                        "{item.notes}"
                      </div>
                    )}

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-gray-400">
                        Subtotal: <strong className="text-gray-700">{formatIDR(item.calculatedPrice * item.quantity)}</strong>
                      </span>
                      <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                        <button
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-l-lg"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center font-bold text-xs">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-r-lg"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Bill Calculation & CTA */}
          {items.length > 0 && (
            <div className="p-4 bg-white border-t border-gray-200 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-800">{formatIDR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Pajak Restoran PB1 ({taxRatePercent}%)</span>
                  <span className="font-semibold text-gray-800">{formatIDR(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Biaya Layanan ({serviceChargePercent}%)</span>
                  <span className="font-semibold text-gray-800">{formatIDR(serviceCharge)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#223240] pt-2 border-t border-gray-200">
                  <span>Total Tagihan</span>
                  <span className="text-base text-[#E1A23D] font-extrabold">{formatIDR(totalAmount)}</span>
                </div>
              </div>

              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full bg-[#E1A23D] hover:bg-amber-400 active:scale-[0.98] text-[#17212B] font-bold py-3.5 px-4 rounded-xl shadow-md flex items-center justify-between text-sm transition-all"
              >
                <span>Lanjut ke Konfirmasi</span>
                <div className="flex items-center space-x-1">
                  <span>{formatIDR(totalAmount)}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {isCheckoutOpen && (
        <CheckoutModal
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={() => {
            setIsCheckoutOpen(false);
            onClose();
            onOrderSuccess();
          }}
        />
      )}
    </>
  );
}
