import { describe, it, expect } from 'vitest';
import { formatIDR } from '../../src/lib/utils.ts';

describe('Financial & Calculation Unit Tests', () => {
  it('correctly calculates PB1 tax (10%) and service charge (5%)', () => {
    const subtotal = 100000;
    const taxRate = 10;
    const serviceRate = 5;

    const tax = Math.round(subtotal * (taxRate / 100));
    const service = Math.round(subtotal * (serviceRate / 100));
    const total = subtotal + tax + service;

    expect(tax).toBe(10000);
    expect(service).toBe(5000);
    expect(total).toBe(115000);
  });

  it('correctly calculates cash change when customer pays sufficient cash', () => {
    const totalAmount = 115000;
    const amountTendered = 150000;

    const change = amountTendered - totalAmount;
    expect(change).toBe(35000);
    expect(change).toBeGreaterThanOrEqual(0);
  });

  it('correctly identifies insufficient cash tender', () => {
    const totalAmount = 115000;
    const amountTendered = 100000;

    const isSufficient = amountTendered >= totalAmount;
    expect(isSufficient).toBe(false);
  });

  it('formats Indonesian Rupiah (IDR) consistently', () => {
    const formatted = formatIDR(55000);
    // Should contain "55" and "000" and "Rp"
    expect(formatted).toContain('55');
    expect(formatted).toContain('000');
    expect(formatted).toContain('Rp');
  });
});
