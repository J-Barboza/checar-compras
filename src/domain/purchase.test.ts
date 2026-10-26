import { describe, expect, it } from '@jest/globals';
import { formatMoney, parseMoney } from './money';
import {
  addBarcodeItem,
  addFlvItem,
  applyBudgetAlert,
  compareWithCashier,
  findByCode,
  incrementQty,
  lineTotal,
  newPurchase,
  pendingCount,
  purchaseTotal,
  removeItem,
  sortItems,
  toggleChecked,
  unitsCount,
  updateItem,
} from './purchase';

const base = () => newPurchase('Assaí', null, 0);

describe('money', () => {
  it('parses Brazilian formats', () => {
    expect(parseMoney('8,50')).toBe(8.5);
    expect(parseMoney('1.234,56')).toBe(1234.56);
    expect(parseMoney('R$ 10')).toBe(10);
    expect(parseMoney('8.5')).toBe(8.5);
    expect(parseMoney('')).toBeNull();
    expect(parseMoney('abc')).toBeNull();
  });

  it('formats with thousands separator', () => {
    expect(formatMoney(1234.5)).toBe('R$ 1.234,50');
    expect(formatMoney(0.1 + 0.2)).toBe('R$ 0,30');
  });
});

describe('totals', () => {
  it('sums barcode and FLV items by kg and by unit', () => {
    let p = addBarcodeItem(base(), '789', 'Café', 18.98);
    p = addFlvItem(p, 'Banana', 'kg', 6.99, 1.25);
    p = addFlvItem(p, 'Alface', 'un', 3.5, 2);
    expect(lineTotal(p.items[1])).toBe(8.74);
    expect(purchaseTotal(p.items)).toBe(34.72);
    expect(unitsCount(p.items)).toBe(4);
  });

  it('keeps items without price out of the total and counts them as pending', () => {
    let p = addBarcodeItem(base(), '789', 'Café', null);
    p = addFlvItem(p, 'Tomate', 'kg', 8.49, null);
    p = addBarcodeItem(p, '790', 'Arroz', 26.49);
    expect(purchaseTotal(p.items)).toBe(26.49);
    expect(pendingCount(p.items)).toBe(2);
  });
});

describe('repeated read', () => {
  it('adds one to the existing line without duplicating it', () => {
    let p = addBarcodeItem(base(), '789', 'Café', 18.98);
    const existing = findByCode(p, '789')!;
    p = incrementQty(p, existing.id);
    expect(p.items).toHaveLength(1);
    expect(p.items[0].qty).toBe(2);
    expect(purchaseTotal(p.items)).toBe(37.96);
  });
});

describe('editing', () => {
  it('fixes a price already registered (promotion case)', () => {
    let p = addBarcodeItem(base(), '789', 'Sabão', 10);
    p = updateItem(p, p.items[0].id, { unitPrice: 8.5 });
    expect(purchaseTotal(p.items)).toBe(8.5);
  });

  it('keeps the old name when the new one is blank and quantity at least 1', () => {
    let p = addBarcodeItem(base(), '789', 'Sabão', 10);
    p = updateItem(p, p.items[0].id, { name: '  ', qty: 0 });
    expect(p.items[0].name).toBe('Sabão');
    expect(p.items[0].qty).toBe(1);
  });

  it('removes and toggles items', () => {
    let p = addBarcodeItem(base(), '1', 'A', 1);
    p = addBarcodeItem(p, '2', 'B', 2);
    p = toggleChecked(p, p.items[0].id);
    expect(p.items[0].checked).toBe(true);
    p = removeItem(p, p.items[0].id);
    expect(p.items.map((i) => i.name)).toEqual(['B']);
  });
});

describe('budget alert', () => {
  it('fires once when reaching the budget and re-arms below it', () => {
    let p = newPurchase('Assaí', 30, 0);
    p = addBarcodeItem(p, '1', 'A', 20);
    let r = applyBudgetAlert(p);
    expect(r.alert).toBe(false);
    r = applyBudgetAlert(addBarcodeItem(r.purchase, '2', 'B', 10));
    expect(r.alert).toBe(true);
    r = applyBudgetAlert(addBarcodeItem(r.purchase, '3', 'C', 5));
    expect(r.alert).toBe(false);
    r = applyBudgetAlert(removeItem(removeItem(r.purchase, 3), 2));
    expect(r.purchase.alertArmed).toBe(true);
  });

  it('does nothing without a budget', () => {
    const r = applyBudgetAlert(addBarcodeItem(base(), '1', 'A', 999));
    expect(r.alert).toBe(false);
  });
});

describe('cashier comparison', () => {
  it('is ok within the tolerance and divergent above it', () => {
    expect(compareWithCashier(100, 100.8, 1)).toEqual({ diff: 0.8, ok: true });
    expect(compareWithCashier(100, 101, 1).ok).toBe(true);
    expect(compareWithCashier(100, 101.01, 1).ok).toBe(false);
    expect(compareWithCashier(100, 98.5, 1)).toEqual({ diff: -1.5, ok: false });
  });
});

describe('order', () => {
  it('sorts alphabetically in Portuguese without changing collection order', () => {
    let p = addBarcodeItem(base(), '1', 'Óleo', 1);
    p = addBarcodeItem(p, '2', 'arroz', 1);
    p = addBarcodeItem(p, '3', 'Feijão', 1);
    expect(sortItems(p.items, 'alfa').map((i) => i.name)).toEqual(['arroz', 'Feijão', 'Óleo']);
    expect(sortItems(p.items, 'coleta').map((i) => i.name)).toEqual(['Óleo', 'arroz', 'Feijão']);
  });
});
