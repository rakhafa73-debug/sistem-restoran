import React, { useState } from 'react';
import type { MenuItem, OrderItemVariantSelection } from '../../types/index.ts';
import { formatIDR } from '../../lib/utils.ts';
import { X, Plus, Minus, Clock, Check } from 'lucide-react';

interface ItemDetailModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (
    item: MenuItem,
    quantity: number,
    selectedVariants: OrderItemVariantSelection[],
    notes: string
  ) => void;
}

export function ItemDetailModal({ item, onClose, onAddToCart }: ItemDetailModalProps) {
  if (!item) return null;

  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, { optionName: string; price: number }>>(() => {
    const initial: Record<string, { optionName: string; price: number }> = {};
    if (item.variants) {
      for (const variant of item.variants) {
        if (variant.options.length > 0) {
          // Default to first option for required variants
          if (variant.required) {
            initial[variant.name] = {
              optionName: variant.options[0].name,
              price: variant.options[0].price_adjustment || 0,
            };
          }
        }
      }
    }
    return initial;
  });
  const [notes, setNotes] = useState('');

  const handleVariantSelect = (variantName: string, optionName: string, price: number) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [variantName]: { optionName, price },
    }));
  };

  const extraTotal = Object.values(selectedVariants).reduce((sum, v) => sum + v.price, 0);
  const unitPrice = item.price + extraTotal;
  const totalPrice = unitPrice * quantity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedVariants: OrderItemVariantSelection[] = Object.entries(selectedVariants).map(
      ([variantName, opt]) => ({
        variant_name: variantName,
        option_name: opt.optionName,
        price_adjustment: opt.price,
      })
    );
    onAddToCart(item, quantity, formattedVariants, notes.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#FDFBF7] text-[#223240] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Image Header with Close Button */}
        <div className="relative h-56 sm:h-64 w-full bg-gray-200">
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-3 bg-[#223240]/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-[#E1A23D]" />
            <span>±{item.prep_time_minutes} mnt</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div>
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold tracking-tight">{item.name}</h3>
              <span className="text-lg font-extrabold text-[#E1A23D] whitespace-nowrap ml-2">
                {formatIDR(item.price)}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">{item.description}</p>
          </div>

          {/* Variants */}
          {item.variants && item.variants.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-gray-200">
              {item.variants.map((v) => (
                <div key={v.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      {v.name}
                    </label>
                    <span className="text-[11px] font-semibold text-gray-500">
                      {v.required ? '(Wajib)' : '(Opsional)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    {v.options.map((opt) => {
                      const isSelected = selectedVariants[v.name]?.optionName === opt.name;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleVariantSelect(v.name, opt.name, opt.price_adjustment)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-[#E1A23D] bg-amber-50 text-[#223240] font-semibold ring-1 ring-[#E1A23D]'
                              : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected ? 'border-[#E1A23D] bg-[#E1A23D]' : 'border-gray-300'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-sm">{opt.name}</span>
                          </div>
                          {opt.price_adjustment > 0 && (
                            <span className="text-xs font-medium text-amber-700">
                              +{formatIDR(opt.price_adjustment)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Custom Notes */}
          <div className="pt-2 border-t border-gray-200">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-1.5">
              Catatan Khusus ke Dapur (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Pisahkan kuah, sedikit minyak, tanpa daun seledri"
              maxLength={150}
              className="w-full text-sm p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E1A23D] text-gray-800 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-gray-200 flex items-center space-x-3">
          {/* Quantity Controls */}
          <div className="flex items-center border border-gray-300 rounded-xl bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-9 text-center font-bold text-sm text-[#223240]">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-xs text-gray-700 hover:bg-gray-100"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 bg-[#E1A23D] hover:bg-amber-400 active:scale-[0.98] text-[#17212B] font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-between text-sm transition-all"
          >
            <span>Tambah ke Keranjang</span>
            <span className="font-extrabold">{formatIDR(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
