// Values are kept as numbers in reais and rounded to cents on every sum,
// which is enough precision for supermarket totals.

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Parses Brazilian input like "1.234,56", "8,5" or "8.50". Returns null when empty or invalid. */
export function parseMoney(text: string | null | undefined): number | null {
  if (text == null) return null;
  let t = String(text).trim().replace(/^R\$\s*/, '');
  if (!t) return null;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const v = Number(t);
  return Number.isFinite(v) && v >= 0 ? v : null;
}

export function formatMoney(n: number): string {
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  const withDots = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (n < 0 ? '-' : '') + 'R$ ' + withDots + ',' + dec;
}

/** Value for an editable field, without the "R$ " prefix. */
export function moneyToInput(n: number | null): string {
  return n == null ? '' : n.toFixed(2).replace('.', ',');
}

export function formatKg(n: number): string {
  return n.toFixed(3).replace('.', ',');
}
