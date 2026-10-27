// Chooses the shelf price among the text lines OCR found on a label photo.
// The user frames the right price ("por" on de/por labels), so the rule stays
// simple: the tallest line that looks like a price wins. Some labels print a
// second price at about the same size (member price, "exclusivo para
// cooperados"); those come back too, so the user can pick with one tap.

export type OcrLine = { text: string; top: number; left: number; width: number; height: number };

const PRICE = /(\d{1,3}(?:\.\d{3})+|\d{1,4})[,.](\d{2})(?!\d)/g;
// Cents printed small and apart, read by OCR as "12 99".
const SPLIT_CENTS = /^\s*(?:R\$\s*)?(\d{1,4})\s+(\d{2})\s*$/i;
// Big poster prices whose small comma OCR drops: "1899" is 18,99.
const NO_COMMA = /^\s*(?:R\$\s*)?(\d{1,3})(\d{2})\s*$/i;
// Unit prices such as "R$ 16,98/kg", "4,25 / L" or "/100g".
const UNIT_PRICE = /\/\s*\d*\s*(kg|g|l|ml|un)/i;
// Superscript cents come back as two lines: the reais ("47", sometimes with a stray mark) and the cents ("15").
const REAIS_ONLY = /^\s*(?:R\$\s*)?(\d{1,4})\s*[,.;:]?\s*$/i;
const CENTS_ONLY = /^\s*[,.]?\s*(\d{2})\s*$/;
// A price line at least this fraction of the tallest one counts as a second big price.
const SIMILAR_HEIGHT = 0.75;

function priceInLine(text: string): number | null {
  if (UNIT_PRICE.test(text)) return null;
  const split = text.match(SPLIT_CENTS) ?? text.match(NO_COMMA);
  if (split) return Number(split[1] + '.' + split[2]) || null;
  const matches = [...text.matchAll(PRICE)];
  if (!matches.length) return null;
  // On "de 12,99 por 9,99" the last one is the current price.
  const [, int, cents] = matches[matches.length - 1];
  return Number(int.replace(/\./g, '') + '.' + cents) || null;
}

/** Joins a reais line with a smaller cents line printed right after it, at the same height. */
function priceWithSuperscriptCents(reais: OcrLine, lines: OcrLine[]): number | null {
  const int = reais.text.match(REAIS_ONLY);
  if (!int) return null;
  const right = reais.left + reais.width;
  for (const other of lines) {
    const cents = other.text.match(CENTS_ONLY);
    if (!cents || other.height >= reais.height) continue;
    const besideRight = other.left >= right - reais.width * 0.2 && other.left <= right + reais.height * 0.5;
    const sameRow = other.top < reais.top + reais.height && other.top + other.height > reais.top;
    if (besideRight && sameRow) return Number(int[1] + '.' + cents[1]) || null;
  }
  return null;
}

/**
 * Returns the prices printed at about the size of the biggest one, cheapest first
 * (the member price, since the user is a member), or an empty list when none is found.
 */
export function pickPrices(lines: OcrLine[]): number[] {
  const found: { value: number; height: number }[] = [];
  for (const line of lines) {
    const value = priceInLine(line.text) ?? priceWithSuperscriptCents(line, lines);
    if (value != null) found.push({ value, height: line.height });
  }
  const tallest = Math.max(0, ...found.map((p) => p.height));
  const big = found.filter((p) => p.height >= tallest * SIMILAR_HEIGHT).map((p) => p.value);
  return [...new Set(big)].sort((a, b) => a - b);
}
