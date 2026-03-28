export const SUPPORTED_CURRENCIES = [
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "CHF", label: "Swiss Franc", symbol: "CHF" },
  { code: "GBP", label: "British Pound", symbol: "£" },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

export function getCurrencySymbol(code: string): string {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

/**
 * Format an amount with the correct currency symbol placement.
 * EUR/USD/GBP: symbol before amount (€1,200.00)
 * CHF: symbol after amount (1,200.00 CHF)
 */
export function formatAmount(amount: number, currency: string): string {
  const formatted = amount.toFixed(2);
  if (currency === "CHF") return `${formatted} CHF`;
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${formatted}`;
}
