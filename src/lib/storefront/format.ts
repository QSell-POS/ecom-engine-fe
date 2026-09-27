const formats = new Map<string, Intl.NumberFormat>();

export function formatMoney(amount: number, currency = "USD") {
  let format = formats.get(currency);
  if (!format) {
    format = new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
    formats.set(currency, format);
  }
  // Whole amounts read cleaner on product cards: $48 rather than $48.00.
  return Number.isInteger(amount) ? format.format(amount).replace(/\.00$/, "") : format.format(amount);
}

export function discountPercent(price: number, compareAtPrice: number | null) {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round((1 - price / compareAtPrice) * 100);
}

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });
export const formatDate = (iso: string) => dateFormat.format(new Date(iso));
