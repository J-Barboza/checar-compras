import { round2 } from './money';

export type ItemMode = 'un' | 'kg';

export interface Item {
  id: number;
  /** Barcode; null for FLV / bulk items. */
  code: string | null;
  name: string;
  kind: 'bar' | 'flv';
  mode: ItemMode;
  /** Price per unit or per kg; null while pending. */
  unitPrice: number | null;
  qty: number;
  kg: number | null;
  checked: boolean;
}

export interface Purchase {
  market: string;
  budget: number | null;
  startedAt: number;
  items: Item[];
  nextId: number;
  /** True while the "budget reached" warning may still fire. */
  alertArmed: boolean;
}

export function newPurchase(market: string, budget: number | null, now: number): Purchase {
  return { market, budget: budget && budget > 0 ? budget : null, startedAt: now, items: [], nextId: 1, alertArmed: true };
}

export function lineTotal(it: Item): number | null {
  if (it.unitPrice == null) return null;
  if (it.mode === 'kg') return it.kg == null ? null : round2(it.unitPrice * it.kg);
  return round2(it.unitPrice * it.qty);
}

export function purchaseTotal(items: Item[]): number {
  return round2(items.reduce((sum, it) => sum + (lineTotal(it) ?? 0), 0));
}

/** Units for the footer: each kg item counts as one. */
export function unitsCount(items: Item[]): number {
  return items.reduce((sum, it) => sum + (it.mode === 'kg' ? 1 : it.qty), 0);
}

export function pendingCount(items: Item[]): number {
  return items.filter((it) => lineTotal(it) == null).length;
}

export function findByCode(p: Purchase, code: string): Item | undefined {
  return p.items.find((it) => it.code === code);
}

/** A repeated barcode read adds one to the existing line instead of creating another. */
export function incrementQty(p: Purchase, id: number): Purchase {
  return { ...p, items: p.items.map((it) => (it.id === id ? { ...it, qty: it.qty + 1 } : it)) };
}

export function addBarcodeItem(p: Purchase, code: string, name: string, unitPrice: number | null): Purchase {
  const item: Item = { id: p.nextId, code, name, kind: 'bar', mode: 'un', unitPrice, qty: 1, kg: null, checked: false };
  return { ...p, items: [...p.items, item], nextId: p.nextId + 1 };
}

export function addFlvItem(p: Purchase, name: string, mode: ItemMode, unitPrice: number | null, amount: number | null): Purchase {
  const item: Item = {
    id: p.nextId,
    code: null,
    name,
    kind: 'flv',
    mode,
    unitPrice,
    qty: mode === 'un' ? Math.max(1, Math.round(amount ?? 1)) : 1,
    kg: mode === 'kg' ? amount : null,
    checked: false,
  };
  return { ...p, items: [...p.items, item], nextId: p.nextId + 1 };
}

export interface ItemChanges {
  name?: string;
  unitPrice?: number | null;
  qty?: number;
  kg?: number | null;
}

export function updateItem(p: Purchase, id: number, changes: ItemChanges): Purchase {
  return {
    ...p,
    items: p.items.map((it) => {
      if (it.id !== id) return it;
      const next = { ...it, ...changes };
      next.name = next.name.trim() || it.name;
      next.qty = Math.max(1, Math.round(next.qty));
      return next;
    }),
  };
}

export function removeItem(p: Purchase, id: number): Purchase {
  return { ...p, items: p.items.filter((it) => it.id !== id) };
}

/** Works on the purchase in progress and on a receipt under review. */
export function toggleChecked<P extends { items: Item[] }>(p: P, id: number): P {
  return { ...p, items: p.items.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it)) };
}

/**
 * Decides whether the "budget reached" warning should show after a change.
 * It fires once when the total reaches the budget and re-arms if the total drops below it again.
 */
export function applyBudgetAlert(p: Purchase): { purchase: Purchase; alert: boolean } {
  if (p.budget == null) return { purchase: p, alert: false };
  const total = purchaseTotal(p.items);
  if (total >= p.budget && p.alertArmed) return { purchase: { ...p, alertArmed: false }, alert: true };
  if (total < p.budget && !p.alertArmed) return { purchase: { ...p, alertArmed: true }, alert: false };
  return { purchase: p, alert: false };
}

export type Order = 'coleta' | 'alfa';

export function sortItems(items: Item[], order: Order): Item[] {
  if (order === 'coleta') return items;
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export interface Comparison {
  /** Cashier minus registered: positive means the cashier charged more. */
  diff: number;
  ok: boolean;
}

export function compareWithCashier(registered: number, cashier: number, tolerance: number): Comparison {
  const diff = round2(cashier - registered);
  return { diff, ok: Math.abs(diff) <= tolerance };
}

/** What stays on the device after a purchase is concluded (spec 4.9). */
export interface Receipt {
  /** Set by the database; 0 before saving. */
  id: number;
  market: string;
  /** When the purchase was concluded. */
  at: number;
  items: Item[];
  cashier: number;
  /** Tolerance in force at conclusion, so later changes in the settings don't alter the result. */
  tolerance: number;
}

export function concludePurchase(p: Purchase, cashier: number, tolerance: number, now: number): Receipt {
  return { id: 0, market: p.market, at: now, items: p.items, cashier, tolerance };
}

export function receiptResult(r: Receipt): Comparison & { total: number } {
  const total = purchaseTotal(r.items);
  return { total, ...compareWithCashier(total, r.cashier, r.tolerance) };
}
