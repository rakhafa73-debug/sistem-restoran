import { describe, it, expect } from 'vitest';
import { CreateOrderSchema, ProcessPaymentSchema } from '../../src/lib/utils.ts';

describe('Order & Payment Schema Validation Tests', () => {
  it('passes valid order creation payload', () => {
    const validData = {
      table_token: 'tbl_token_m01_nusantara',
      customer_name: 'Budi Santoso',
      items: [
        {
          menu_item_id: 'm1',
          quantity: 2,
          selected_variants: [
            { variant_name: 'Pedas', option_name: 'Level 1', price_adjustment: 0 },
          ],
          notes: 'Tidak pakai bawang goreng',
        },
      ],
    };

    const result = CreateOrderSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects order with zero items', () => {
    const invalidData = {
      table_token: 'tbl_token_m01_nusantara',
      items: [],
    };

    const result = CreateOrderSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects order item with non-positive quantity', () => {
    const invalidData = {
      table_token: 'tbl_token_m01_nusantara',
      items: [
        {
          menu_item_id: 'm1',
          quantity: 0,
        },
      ],
    };

    const result = CreateOrderSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('validates cash payment tender', () => {
    const validPayment = { amount_tendered: 150000 };
    expect(ProcessPaymentSchema.safeParse(validPayment).success).toBe(true);

    const invalidPayment = { amount_tendered: -5000 };
    expect(ProcessPaymentSchema.safeParse(invalidPayment).success).toBe(false);
  });
});
