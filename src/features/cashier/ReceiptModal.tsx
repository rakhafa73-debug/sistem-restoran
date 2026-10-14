import React from 'react';
import type { Order, Payment } from '../../types/index.ts';
import { formatDateTime, formatIDR } from '../../lib/utils.ts';
import { X, Printer, CheckCircle } from 'lucide-react';

interface ReceiptModalProps {
  order: Order | null;
  payment: Payment | null;
  onClose: () => void;
}

export function ReceiptModal({ order, payment, onClose }: ReceiptModalProps) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-white text-gray-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Modal Action Controls (Hidden when printed) */}
        <div className="p-3 bg-[#223240] text-white flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-1.5">
            <CheckCircle className="w-4 h-4 text-[#E1A23D]" />
            <span className="font-bold text-xs">Struk Pembayaran Kasir</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={handlePrint}
              className="p-1.5 bg-[#E1A23D] hover:bg-amber-400 text-[#17212B] rounded-lg text-xs font-bold flex items-center space-x-1 px-2.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Struk</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-300 hover:text-white rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable Thermal Paper (80mm formatted) */}
        <div
          id="printable-receipt"
          className="p-6 overflow-y-auto flex-1 font-mono text-xs text-gray-800 space-y-4 bg-white"
        >
          {/* Header */}
          <div className="text-center space-y-1 border-b border-dashed border-gray-400 pb-3">
            <h2 className="font-black text-sm text-black tracking-wider uppercase">
              NUSANTARA RASA SIGNATURE
            </h2>
            <p className="text-[10px] text-gray-600">Jl. Senopati No. 45, Kebayoran Baru</p>
            <p className="text-[10px] text-gray-600">Jakarta Selatan • Telp: 0812-3456-7890</p>
            <div className="text-[10px] text-gray-500 pt-1">
              NPWP: 01.234.567.8-012.000 (PB1 Restoran)
            </div>
          </div>

          {/* Meta Details */}
          <div className="space-y-1 text-[11px] border-b border-dashed border-gray-400 pb-2">
            <div className="flex justify-between">
              <span>No. Pesanan:</span>
              <strong className="text-black">{order.order_number}</strong>
            </div>
            <div className="flex justify-between">
              <span>Meja:</span>
              <strong className="text-black">{order.table_number}</strong>
            </div>
            <div className="flex justify-between">
              <span>Waktu:</span>
              <span>{formatDateTime(order.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir:</span>
              <span>{payment?.cashier_name || 'Kasir DineQR'}</span>
            </div>
            {order.customer_name && (
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span>{order.customer_name}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="space-y-2 border-b border-dashed border-gray-400 pb-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between">
                  <span className="font-bold text-black">
                    {item.quantity}x {item.item_name}
                  </span>
                  <span>{formatIDR(item.subtotal)}</span>
                </div>
                {item.selected_variants && item.selected_variants.length > 0 && (
                  <div className="text-[10px] text-gray-500 pl-4">
                    {item.selected_variants.map((v) => `${v.variant_name}: ${v.option_name}`).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bill Calculation */}
          <div className="space-y-1 text-[11px] border-b border-dashed border-gray-400 pb-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatIDR(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>PB1 Pajak Restoran (10%):</span>
              <span>{formatIDR(order.tax_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Biaya Layanan (5%):</span>
              <span>{formatIDR(order.service_charge)}</span>
            </div>
            <div className="flex justify-between text-sm font-black pt-1 border-t border-gray-300 text-black">
              <span>TOTAL TAGIHAN:</span>
              <span>{formatIDR(order.total_amount)}</span>
            </div>
          </div>

          {/* Payment Cash Details */}
          <div className="space-y-1 text-[11px] border-b border-dashed border-gray-400 pb-2">
            <div className="flex justify-between">
              <span>Metode Pembayaran:</span>
              <strong className="text-black">TUNAI / CASH</strong>
            </div>
            <div className="flex justify-between">
              <span>Tunai Diterima:</span>
              <span className="font-bold">
                {payment ? formatIDR(payment.amount_tendered) : formatIDR(order.total_amount)}
              </span>
            </div>
            <div className="flex justify-between text-black font-bold">
              <span>Kembalian:</span>
              <span>
                {payment ? formatIDR(payment.change_amount) : 'Rp 0'}
              </span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center space-y-1 pt-1 text-[10px] text-gray-600">
            <p className="font-bold text-black uppercase">*** LUNAS ***</p>
            <p>Terima kasih atas kunjungan Anda!</p>
            <p>Kritik & saran: info@dineqr.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
