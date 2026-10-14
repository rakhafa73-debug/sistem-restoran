import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api.ts';
import type { CartItem, MenuItem, Order, OrderItemVariantSelection } from '../types/index.ts';

interface CartContextType {
  tableToken: string | null;
  tableInfo: { table_number: string; capacity: number } | null;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  totalAmount: number;
  taxRatePercent: number;
  serviceChargePercent: number;
  activeOrder: Order | null;
  isCheckingOut: boolean;
  setTableToken: (token: string) => Promise<void>;
  addItem: (menuItem: MenuItem, quantity: number, selectedVariants: OrderItemVariantSelection[], notes: string) => void;
  updateQuantity: (index: number, quantity: number) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
  submitCheckout: (customerName?: string, orderNotes?: string) => Promise<Order>;
  setActiveOrder: (order: Order | null) => void;
  refreshActiveOrder: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [tableToken, setTableTokenState] = useState<string | null>(() => {
    return localStorage.getItem('dineqr_table_token') || 'tbl_token_m01_nusantara';
  });
  const [tableInfo, setTableInfo] = useState<{ table_number: string; capacity: number } | null>(null);
  const [taxRatePercent, setTaxRatePercent] = useState(10);
  const [serviceChargePercent, setServiceChargePercent] = useState(5);
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('dineqr_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeOrder, setActiveOrder] = useState<Order | null>(() => {
    try {
      const saved = localStorage.getItem('dineqr_active_order');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('dineqr_cart', JSON.stringify(items));
  }, [items]);

  // Sync active order to localStorage
  useEffect(() => {
    if (activeOrder) {
      localStorage.setItem('dineqr_active_order', JSON.stringify(activeOrder));
      api.setCustomerToken(activeOrder.customer_secret_token);
    } else {
      localStorage.removeItem('dineqr_active_order');
      api.setCustomerToken(null);
    }
  }, [activeOrder]);

  // Fetch Table info whenever tableToken changes
  useEffect(() => {
    if (!tableToken) return;
    localStorage.setItem('dineqr_table_token', tableToken);

    api
      .getTableInfo(tableToken)
      .then((res) => {
        setTableInfo(res.table);
        if (res.restaurant) {
          setTaxRatePercent(res.restaurant.tax_rate_percent);
          setServiceChargePercent(res.restaurant.service_charge_percent);
        }
      })
      .catch((err) => {
        console.warn('Table token invalid:', err.message);
        setTableInfo(null);
      });
  }, [tableToken]);

  const setTableToken = async (token: string) => {
    setTableTokenState(token);
  };

  const addItem = (
    menuItem: MenuItem,
    quantity: number,
    selectedVariants: OrderItemVariantSelection[],
    notes: string
  ) => {
    const extraPrice = selectedVariants.reduce((sum, v) => sum + (v.price_adjustment || 0), 0);
    const calculatedPrice = menuItem.price + extraPrice;

    // Check if duplicate item with exact same variants & notes exists
    const variantKey = JSON.stringify(selectedVariants);
    const existingIndex = items.findIndex(
      (item) =>
        item.menuItem.id === menuItem.id &&
        item.notes === notes &&
        JSON.stringify(item.selectedVariants) === variantKey
    );

    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += quantity;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          menuItem,
          quantity,
          selectedVariants,
          notes,
          calculatedPrice,
        },
      ]);
    }
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }
    const updated = [...items];
    updated[index].quantity = quantity;
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('dineqr_cart');
  };

  const subtotal = items.reduce((sum, item) => sum + item.calculatedPrice * item.quantity, 0);
  const taxAmount = Math.round(subtotal * (taxRatePercent / 100));
  const serviceCharge = Math.round(subtotal * (serviceChargePercent / 100));
  const totalAmount = subtotal + taxAmount + serviceCharge;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const submitCheckout = async (customerName?: string, orderNotes?: string): Promise<Order> => {
    if (!tableToken) {
      throw new Error('Kode meja belum dipilih.');
    }
    if (items.length === 0) {
      throw new Error('Keranjang belanja Anda masih kosong.');
    }

    setIsCheckingOut(true);
    try {
      const idempotencyKey = 'idemp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      const res = await api.createOrder({
        table_token: tableToken,
        customer_name: customerName,
        notes: orderNotes,
        idempotency_key: idempotencyKey,
        items: items.map((i) => ({
          menu_item_id: i.menuItem.id,
          quantity: i.quantity,
          selected_variants: i.selectedVariants,
          notes: i.notes,
        })),
      });

      clearCart();
      setActiveOrder(res.order);
      return res.order;
    } finally {
      setIsCheckingOut(false);
    }
  };

  const refreshActiveOrder = async () => {
    if (!activeOrder) return;
    try {
      const res = await api.getOrder(activeOrder.id, activeOrder.customer_secret_token);
      setActiveOrder(res.order);
    } catch {
      // Order may be archived
    }
  };

  return (
    <CartContext.Provider
      value={{
        tableToken,
        tableInfo,
        items,
        itemCount,
        subtotal,
        taxAmount,
        serviceCharge,
        totalAmount,
        taxRatePercent,
        serviceChargePercent,
        activeOrder,
        isCheckingOut,
        setTableToken,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        submitCheckout,
        setActiveOrder,
        refreshActiveOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
