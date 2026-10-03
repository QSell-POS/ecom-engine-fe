/**
 * Store currency for display. The API returns bare numbers, so the currency
 * is a presentation choice; set NEXT_PUBLIC_DEFAULT_CURRENCY to change it
 * (it is inlined at build time, so a rebuild is needed).
 */
export const DEFAULT_CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || "NPR";

const formatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(amount: number | null | undefined, currency = DEFAULT_CURRENCY): string {
  if (amount === null || amount === undefined || !Number.isFinite(Number(amount))) return "—";
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 });
    formatters.set(currency, formatter);
  }
  return formatter.format(Number(amount));
}
