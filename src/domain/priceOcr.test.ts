import { describe, expect, it } from '@jest/globals';
import { pickPrices, type OcrLine } from './priceOcr';

// Builds a line with only text and height; position matters only for split cents.
const line = (text: string, height: number, top = 0, left = 0, width = 0): OcrLine => ({ text, height, top, left, width });
// The price that fills the field.
const pickPrice = (lines: OcrLine[]) => pickPrices(lines)[0] ?? null;

describe('pickPrice', () => {
  it('reads common price formats', () => {
    expect(pickPrice([line('12,99', 80)])).toBe(12.99);
    expect(pickPrice([line('R$ 12,99', 80)])).toBe(12.99);
    expect(pickPrice([line('R$12.99', 80)])).toBe(12.99);
    expect(pickPrice([line('1.234,56', 80)])).toBe(1234.56);
  });

  it('picks the tallest price and ignores small text', () => {
    const lines = [
      line('CAFE PILAO 500G', 20),
      line('7891234567895', 15),
      line('R$ 39,80', 18),
      line('19,90', 90),
    ];
    expect(pickPrice(lines)).toBe(19.9);
  });

  it('ignores unit prices like per kg or per liter', () => {
    const lines = [
      line('8,49', 60),
      line('R$ 16,98/kg', 70),
      line('R$ 4,25 / L', 70),
    ];
    expect(pickPrice(lines)).toBe(8.49);
  });

  it('joins cents printed apart from the reais', () => {
    expect(pickPrice([line('R$ 12 99', 80)])).toBe(12.99);
    expect(pickPrice([line('12 99', 80)])).toBe(12.99);
  });

  it('takes the last price when one line has "de/por"', () => {
    expect(pickPrice([line('de 12,99 por 9,99', 80)])).toBe(9.99);
  });

  // The cases below come from ML Kit output on real shelf posters.
  it('reads big prices whose comma OCR dropped', () => {
    const lines = [line('19,99', 135), line('R$', 119), line('1899', 759), line('Oferta VIP', 288)];
    expect(pickPrice(lines)).toBe(18.99);
    expect(pickPrice([line('ARROZA', 663), line('3650', 696)])).toBe(36.5);
  });

  it('joins superscript cents returned as a separate line', () => {
    expect(pickPrice([line('ARROZ', 284), line('47', 549, 1721, 678, 865), line('15', 260, 1761, 1586, 348), line('R$', 223, 2113, 1895, 319)])).toBe(47.15);
    expect(pickPrice([line('47;', 675, 1352, 589, 1033), line('15', 281, 1404, 1535, 367), line('9 R$', 256, 1777, 1489, 716)])).toBe(47.15);
  });

  it('does not join numbers that are far apart', () => {
    expect(pickPrice([line('47', 549, 1721, 678, 865), line('15', 260, 3000, 1586, 348)])).toBeNull();
    expect(pickPrice([line('5', 300, 0, 0, 200), line('10', 100, 0, 2000, 100)])).toBeNull();
  });

  // "Por" and member ("exclusivo para cooperados") prices printed at about the same size.
  it('returns every big price, cheapest first', () => {
    const bread = [line('OFERTA', 90), line('DE: R$', 20), line('6,19', 100), line('EXCLUSIVO PARA COOPERADOS', 25), line('5,79', 105), line('/UN', 20)];
    expect(pickPrices(bread)).toEqual([5.79, 6.19]);
    const cheese = [line('DE: R$', 20), line('24,69', 60), line('21,39', 120), line('17,99', 115), line('1KG', 55)];
    expect(pickPrices(cheese)).toEqual([17.99, 21.39]);
  });

  it('lists a repeated price once', () => {
    expect(pickPrices([line('5,79', 100), line('5,79', 95)])).toEqual([5.79]);
  });

  it('returns null when there is no price', () => {
    expect(pickPrice([])).toBeNull();
    expect(pickPrice([line('OFERTA', 80), line('500 g', 30)])).toBeNull();
    expect(pickPrice([line('0,00', 80)])).toBeNull();
  });
});
