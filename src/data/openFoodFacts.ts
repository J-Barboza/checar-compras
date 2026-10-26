// Only the barcode leaves the phone. Without internet the suggestion is simply skipped.
const TIMEOUT_MS = 4000;

export async function suggestName(code: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name_pt,product_name,brands,quantity`,
      { signal: controller.signal, headers: { 'User-Agent': 'ChecarCompras/1.0 (Android)' } },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const p = json?.product;
    const name: string | undefined = p?.product_name_pt || p?.product_name;
    if (!name) return null;
    const brand: string | undefined = p.brands?.split(',')[0]?.trim();
    const parts = [name.trim()];
    if (brand && !name.toLowerCase().includes(brand.toLowerCase())) parts.push(brand);
    if (p.quantity) parts.push(String(p.quantity).trim());
    return parts.join(' ');
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
