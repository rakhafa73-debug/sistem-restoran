import React, { useEffect, useState } from 'react';
import { api } from '../../services/api.ts';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import type { Order, Payment } from '../../types/index.ts';
import { formatIDR, formatTimeOnly } from '../../lib/utils.ts';
import { ReceiptModal } from './ReceiptModal.tsx';
import {
  Receipt,
  Search,
  CheckCircle,
  Clock,
  Banknote,
  Printer,
  RefreshCw,
  Coins,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export function CashierView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'unpaid' | 'paid'>('unpaid');
  const [searchQuery, setSearchQuery] = useState('');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<{ order: Order; payment: Payment | null } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { subscribe } = useRealtime();

  const loadOrders = async () => {
    try {
      const res = await api.getCashierOrders();
      setOrders(res.orders);

      // Refresh selected order if it exists
      if (selectedOrder) {
        const found = res.orders.find((o) => o.id === selectedOrder.id);
        if (found) setSelectedOrder(found);
      }
    } catch (err) {
      console.error('Failed to load cashier orders:', err);
    }
  };

  useEffect(() => {
    loadOrders();

    const unsubscribe = subscribe((event) => {
      if (
        event.type === 'ORDER_CREATED' ||
        event.type === 'PAYMENT_COMPLETED' ||
        event.type === 'ORDER_STATUS_UPDATED'
      ) {
        loadOrders();
      }
    });

    const interval = setInterval(loadOrders, 15000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [selectedOrder?.id]);

  const filteredOrders = orders.filter((o) => {
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'unpaid' && o.payment_status === 'unpaid') ||
      (filterStatus === 'paid' && o.payment_status === 'paid');

    const matchesSearch =
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.table_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const numericTendered = parseFloat(cashTendered.replace(/\D/g, '')) || 0;
  const currentTotal = selectedOrder?.total_amount || 0;
  const changeAmount = Math.max(0, numericTendered - currentTotal);
  const isSufficient = numericTendered >= currentTotal && currentTotal > 0;

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setCashTendered('');
    setErrorMessage(null);
  };

  const setQuickNominal = (amount: number) => {
    setCashTendered(amount.toString());
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!isSufficient) {
      setErrorMessage(`Uang tunai kurang sebesar ${formatIDR(currentTotal - numericTendered)}`);
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await api.processCashPayment(selectedOrder.id, numericTendered);
      const paidOrder = { ...selectedOrder, payment_status: 'paid' as const };
      const paymentData: Payment = {
        id: res.order_id,
        order_id: selectedOrder.id,
        amount_due: res.amount_due,
        amount_tendered: res.amount_tendered,
        change_amount: res.change_amount,
        payment_method: 'cash',
        cashier_id: 'cashier-active',
        cashier_name: res.cashier_name,
        created_at: new Date().toISOString(),
      };

      setReceiptOrder({ order: paidOrder, payment: paymentData });
      setSelectedOrder(paidOrder);
      await loadOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses pembayaran.';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F5F7] text-[#223240] p-4 sm:p-6">
      {/* Header Bar */}
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-[#223240] text-[#E1A23D] flex items-center justify-center font-bold shadow-md">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Kasir POS</h1>
              <span className="text-[11px] bg-emerald-100 text-[#258653] font-bold px-2 py-0.5 rounded">
                TUNAI AKTIF
              </span>
            </div>
            <p className="text-xs text-gray-500">Konfirmasi kas tunai, kembalian, dan cetak struk</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadOrders}
            className="p-2.5 bg-white hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-200 shadow-xs flex items-center space-x-1 text-xs font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Segarkan</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Orders Queue on left, Payment & Bill on right */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left Column: Orders List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Filter & Search */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Meja, No. Pesanan, Nama..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E1A23D]"
              />
            </div>

            <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setFilterStatus('unpaid')}
                className={`py-1.5 rounded-lg transition-all ${
                  filterStatus === 'unpaid'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Belum Bayar
              </button>
              <button
                onClick={() => setFilterStatus('paid')}
                className={`py-1.5 rounded-lg transition-all ${
                  filterStatus === 'paid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Lunas
              </button>
              <button
                onClick={() => setFilterStatus('all')}
                className={`py-1.5 rounded-lg transition-all ${
                  filterStatus === 'all'
                    ? 'bg-[#223240] text-white shadow-xs'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Semua
              </button>
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center bg-white border border-gray-200 rounded-2xl text-gray-400 text-xs">
                Tidak ada pesanan pada filter ini.
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                const isPaid = order.payment_status === 'paid';

                return (
                  <div
                    key={order.id}
                    onClick={() => handleSelectOrder(order)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#E1A23D] bg-amber-50/50 shadow-md ring-2 ring-[#E1A23D]'
                        : 'border-gray-200 bg-white hover:border-gray-300 shadow-xs'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-base text-[#223240]">
                            {order.table_number}
                          </span>
                          <span className="text-xs font-mono text-gray-500">
                            {order.order_number}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {order.customer_name || 'Pelanggan'} • {formatTimeOnly(order.created_at)}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {isPaid ? 'LUNAS' : 'TAGIHAN AKTIF'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        {order.items?.length || 0} item • Status Dapur: <strong className="text-gray-700 uppercase">{order.status}</strong>
                      </span>
                      <span className="text-sm font-extrabold text-[#E1A23D]">
                        {formatIDR(order.total_amount)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Bill & Cash Settlement (7 cols) */}
        <div className="lg:col-span-7">
          {selectedOrder ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
              {/* Order Header */}
              <div className="flex justify-between items-start border-b border-gray-200 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-2xl font-black text-[#223240]">
                      {selectedOrder.table_number}
                    </h2>
                    <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                      {selectedOrder.order_number}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Pemesan: <strong className="text-gray-800">{selectedOrder.customer_name || 'Pelanggan'}</strong> • Masuk pada {formatTimeOnly(selectedOrder.created_at)}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  {selectedOrder.payment_status === 'paid' && (
                    <button
                      onClick={() => setReceiptOrder({ order: selectedOrder, payment: null })}
                      className="px-3 py-2 bg-[#223240] hover:bg-[#1a2733] text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-sm"
                    >
                      <Printer className="w-4 h-4 text-[#E1A23D]" />
                      <span>Cetak Struk</span>
                    </button>
                  )}
                  <span
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                      selectedOrder.payment_status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {selectedOrder.payment_status === 'paid' ? 'STATUS: LUNAS' : 'STATUS: BELUM BAYAR'}
                  </span>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Rincian Item Hidangan
                </h4>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl p-3 bg-gray-50/50 max-h-48 overflow-y-auto">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="py-2 flex justify-between items-start text-xs">
                      <div>
                        <span className="font-bold text-gray-800">
                          {item.quantity}x {item.item_name}
                        </span>
                        {item.selected_variants && item.selected_variants.length > 0 && (
                          <div className="text-[11px] text-gray-500">
                            {item.selected_variants.map((v) => `${v.variant_name}: ${v.option_name}`).join(', ')}
                          </div>
                        )}
                        {item.notes && <div className="text-[11px] text-amber-800 italic">"{item.notes}"</div>}
                      </div>
                      <span className="font-semibold text-gray-700">{formatIDR(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Totals Card */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal Makanan & Minuman</span>
                  <span className="font-semibold text-gray-800">{formatIDR(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Pajak Restoran PB1 (10%)</span>
                  <span className="font-semibold text-gray-800">{formatIDR(selectedOrder.tax_amount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Biaya Layanan (5%)</span>
                  <span className="font-semibold text-gray-800">{formatIDR(selectedOrder.service_charge)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-extrabold text-[#223240] pt-2 border-t border-gray-200">
                  <span>TOTAL TAGIHAN</span>
                  <span className="text-xl text-[#E1A23D]">{formatIDR(selectedOrder.total_amount)}</span>
                </div>
              </div>

              {/* Cash Settlement Form (Only if unpaid) */}
              {selectedOrder.payment_status === 'unpaid' ? (
                <form onSubmit={handleProcessPayment} className="space-y-4 pt-2 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-xs font-bold text-gray-700">
                    <Banknote className="w-4 h-4 text-[#E1A23D]" />
                    <span>Pembayaran Kas Tunai</span>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Cash Input */}
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">
                      Nominal Uang Diterima dari Pelanggan (Rp)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={cashTendered}
                        onChange={(e) => setCashTendered(e.target.value)}
                        placeholder="Contoh: 100000"
                        className="w-full text-lg font-bold p-3 pl-4 bg-gray-50 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#E1A23D] focus:bg-white text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-gray-500">Pilihan Cepat Nominal:</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setQuickNominal(selectedOrder.total_amount)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-xs font-bold text-gray-800"
                      >
                        Uang Pas ({formatIDR(selectedOrder.total_amount)})
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickNominal(50000)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-xs font-bold text-gray-800"
                      >
                        Rp 50.000
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickNominal(100000)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-xs font-bold text-gray-800"
                      >
                        Rp 100.000
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickNominal(200000)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-xs font-bold text-gray-800"
                      >
                        Rp 200.000
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickNominal(500000)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-xs font-bold text-gray-800"
                      >
                        Rp 500.000
                      </button>
                    </div>
                  </div>

                  {/* Change Calculation Box */}
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-emerald-800 block">Kembalian Uang</span>
                      <span className="text-[11px] text-emerald-700">
                        {numericTendered > 0
                          ? isSufficient
                            ? 'Uang cukup, kembalikan ke pelanggan'
                            : 'Uang tunai kurang!'
                          : 'Masukkan nominal uang di atas'}
                      </span>
                    </div>
                    <span
                      className={`text-2xl font-black ${
                        isSufficient ? 'text-emerald-700' : 'text-gray-400'
                      }`}
                    >
                      {formatIDR(changeAmount)}
                    </span>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={!isSufficient || isProcessing}
                    className="w-full py-4 bg-[#258653] hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-base rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-40"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>
                      {isProcessing ? 'Menyimpan Transaksi...' : 'Konfirmasi Lunas & Cetak Struk'}
                    </span>
                  </button>
                </form>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center font-bold">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-emerald-900 text-base">Tagihan Sudah Lunas</h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Pembayaran tunai telah dicatat dan masuk ke laporan penjualan kasir.
                    </p>
                  </div>
                  <button
                    onClick={() => setReceiptOrder({ order: selectedOrder, payment: null })}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center space-x-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Tampilkan / Cetak Ulang Struk</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400 space-y-2 h-full flex flex-col items-center justify-center shadow-xs">
              <FileCheck className="w-12 h-12 text-gray-300" />
              <h3 className="font-bold text-gray-700 text-base">Pilih Pesanan</h3>
              <p className="text-xs text-gray-400 max-w-sm">
                Klik salah satu antrean pesanan di sebelah kiri untuk melihat rincian tagihan meja dan memproses pembayaran tunai.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {receiptOrder && (
        <ReceiptModal
          order={receiptOrder.order}
          payment={receiptOrder.payment}
          onClose={() => setReceiptOrder(null)}
        />
      )}
    </div>
  );
}
