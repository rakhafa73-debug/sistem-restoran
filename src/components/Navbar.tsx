import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useRealtime } from '../context/RealtimeContext.tsx';
import type { Role } from '../types/index.ts';
import {
  UtensilsCrossed,
  ChefHat,
  Receipt,
  ShieldCheck,
  User,
  Radio,
  QrCode,
  ShoppingBag,
} from 'lucide-react';

interface NavbarProps {
  onOpenCart?: () => void;
  onOpenTracker?: () => void;
  activeView: 'customer' | 'kitchen' | 'cashier' | 'admin';
  setActiveView: (view: 'customer' | 'kitchen' | 'cashier' | 'admin') => void;
}

export function Navbar({ onOpenCart, onOpenTracker, activeView, setActiveView }: NavbarProps) {
  const { role, switchRoleDemo, user } = useAuth();
  const { itemCount, activeOrder, tableInfo, tableToken, setTableToken } = useCart();
  const { isConnected } = useRealtime();

  const handleRoleChange = async (newRole: Role | 'customer') => {
    setActiveView(newRole);
    await switchRoleDemo(newRole);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#223240] text-white shadow-md border-b border-[#2d4255]">
      {/* Top Banner: Role Mode Switcher & Real-time Indicator */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between text-xs border-b border-[#2d4255]/70 gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-gray-300 font-medium hidden sm:inline">Peran Aktif:</span>
          <div className="flex bg-[#17212B] p-0.5 rounded-lg border border-gray-700">
            <button
              onClick={() => handleRoleChange('customer')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center space-x-1 ${
                activeView === 'customer'
                  ? 'bg-[#E1A23D] text-[#17212B] font-bold shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Pelanggan</span>
            </button>
            <button
              onClick={() => handleRoleChange('kitchen')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center space-x-1 ${
                activeView === 'kitchen'
                  ? 'bg-[#E1A23D] text-[#17212B] font-bold shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Dapur</span>
            </button>
            <button
              onClick={() => handleRoleChange('cashier')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center space-x-1 ${
                activeView === 'cashier'
                  ? 'bg-[#E1A23D] text-[#17212B] font-bold shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Kasir</span>
            </button>
            <button
              onClick={() => handleRoleChange('admin')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center space-x-1 ${
                activeView === 'admin'
                  ? 'bg-[#E1A23D] text-[#17212B] font-bold shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Live SSE status & Table Selector for Customer */}
        <div className="flex items-center space-x-3">
          {activeView === 'customer' && (
            <div className="flex items-center bg-[#17212B] px-2 py-1 rounded-md border border-gray-700 text-xs">
              <QrCode className="w-3.5 h-3.5 text-[#E1A23D] mr-1.5" />
              <span className="text-gray-400 mr-1 hidden sm:inline">Simulasi Meja:</span>
              <select
                aria-label="Simulasi Meja"
                value={tableToken || 'tbl_token_m01_nusantara'}
                onChange={(e) => setTableToken(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="tbl_token_m01_nusantara" className="bg-[#223240]">Meja 01 (2 Org)</option>
                <option value="tbl_token_m02_nusantara" className="bg-[#223240]">Meja 02 (4 Org)</option>
                <option value="tbl_token_m03_nusantara" className="bg-[#223240]">Meja 03 (4 Org)</option>
                <option value="tbl_token_m04_nusantara" className="bg-[#223240]">Meja 04 (6 Org)</option>
                <option value="tbl_token_m05_nusantara" className="bg-[#223240]">Meja 05 (VIP 8 Org)</option>
                <option value="tbl_token_m06_nusantara" className="bg-[#223240]">Meja 06 (Outdoor)</option>
                <option value="invalid_token_test" className="bg-[#223240]">Token Meja Tidak Valid (Test)</option>
              </select>
            </div>
          )}

          <div
            className={`flex items-center space-x-1.5 px-2 py-1 rounded-md ${
              isConnected ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/60' : 'bg-red-950/70 text-red-400 border border-red-800/60'
            }`}
          >
            <Radio className={`w-3 h-3 ${isConnected ? 'animate-pulse' : ''}`} />
            <span className="font-mono text-[10px] tracking-wide">{isConnected ? 'LIVE SYNC' : 'OFFLINE'}</span>
          </div>
        </div>
      </div>

      {/* Main Navbar Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveView('customer')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E1A23D] to-amber-300 flex items-center justify-center text-[#223240] shadow-md shadow-amber-500/20">
            <UtensilsCrossed className="w-5 h-5 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">DineQR</span>
              <span className="text-[10px] bg-[#E1A23D] text-[#17212B] font-bold px-1.5 py-0.5 rounded uppercase">
                {activeView}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 hidden sm:block">Smart QR Restaurant Ordering System</p>
          </div>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {activeView === 'customer' && (
            <>
              {activeOrder && (
                <button
                  onClick={onOpenTracker}
                  className="flex items-center space-x-1.5 bg-[#17212B] hover:bg-[#1a2733] border border-[#E1A23D]/50 text-[#E1A23D] px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span>Lacak Pesanan ({activeOrder.order_number})</span>
                </button>
              )}

              <button
                onClick={onOpenCart}
                className="relative flex items-center space-x-2 bg-[#E1A23D] hover:bg-amber-400 text-[#17212B] px-3.5 py-1.5 rounded-lg font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Keranjang</span>
                {itemCount > 0 && (
                  <span className="bg-[#223240] text-white text-[11px] font-extrabold px-1.5 py-0.2 rounded-full min-w-5 text-center">
                    {itemCount}
                  </span>
                )}
              </button>
            </>
          )}

          {activeView !== 'customer' && (
            <div className="text-right">
              <span className="text-xs text-gray-400 block">{user?.name || `Staf ${activeView}`}</span>
              <span className="text-[10px] text-[#E1A23D] font-mono uppercase tracking-wider">{activeView} Mode</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
