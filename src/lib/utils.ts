import { z } from 'zod';

/**
 * Format number into Indonesian Rupiah (IDR)
 * e.g. 45000 -> "Rp 45.000"
 */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format ISO date string into readable Indonesian format
 */
export function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatTimeOnly(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Zod validation schema for customer order creation
 */
export const CreateOrderItemSchema = z.object({
  menu_item_id: z.string().min(1, 'Item menu harus dipilih'),
  quantity: z.number().int().positive('Jumlah harus minimal 1'),
  selected_variants: z.array(
    z.object({
      variant_name: z.string(),
      option_name: z.string(),
      price_adjustment: z.number(),
    })
  ).default([]),
  notes: z.string().max(250).optional(),
});

export const CreateOrderSchema = z.object({
  table_token: z.string().min(1, 'Token meja diperlukan'),
  customer_name: z.string().max(50).optional(),
  notes: z.string().max(300).optional(),
  idempotency_key: z.string().optional(),
  items: z.array(CreateOrderItemSchema).min(1, 'Keranjang belanja tidak boleh kosong'),
});

/**
 * Zod validation schema for cashier payment confirmation
 */
export const ProcessPaymentSchema = z.object({
  amount_tendered: z.number().positive('Nominal tunai harus lebih dari 0'),
  idempotency_key: z.string().optional(),
});

/**
 * Zod validation schema for kitchen status update
 */
export const KitchenStatusUpdateSchema = z.object({
  status: z.enum(['preparing', 'ready', 'served', 'cancelled']),
  notes: z.string().max(200).optional(),
});
