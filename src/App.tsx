import React, { useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthContext.tsx';
import { CartProvider, useCart } from './context/CartContext.tsx';
import { RealtimeProvider } from './context/RealtimeContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { CustomerView } from './features/customer/CustomerView.tsx';
import { CartDrawer } from './features/customer/CartDrawer.tsx';
import { OrderTrackerModal } from './features/customer/OrderTrackerModal.tsx';
import { KitchenView } from './features/kitchen/KitchenView.tsx';
import { CashierView } from './features/cashier/CashierView.tsx';
import { AdminView } from './features/admin/AdminView.tsx';

function MainApp() {
  const [activeView, setActiveView] = useState<'customer' | 'kitchen' | 'cashier' | 'admin'>('customer');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const { setTableToken, activeOrder } = useCart();

  // Parse URL for ?table= token on initial QR Code scan
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table');
    if (tableParam) {
      setTableToken(tableParam);
    }
  }, [setTableToken]);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FDFBF7]">
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTracker={() => setIsTrackerOpen(true)}
      />

      <main className="flex-1">
        {activeView === 'customer' && (
          <CustomerView
            onOpenCart={() => setIsCartOpen(true)}
            onOpenTracker={() => setIsTrackerOpen(true)}
          />
        )}
        {activeView === 'kitchen' && <KitchenView />}
        {activeView === 'cashier' && <CashierView />}
        {activeView === 'admin' && <AdminView />}
      </main>

      {/* Cart Drawer for customer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderSuccess={() => {
          setIsCartOpen(false);
          setIsTrackerOpen(true);
        }}
      />

      {/* Order Tracker Modal */}
      {isTrackerOpen && (
        <OrderTrackerModal onClose={() => setIsTrackerOpen(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <RealtimeProvider>
          <MainApp />
        </RealtimeProvider>
      </CartProvider>
    </AuthProvider>
  );
}
