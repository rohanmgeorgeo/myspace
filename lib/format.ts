import type { AccountType } from "@/lib/supabase/types";

/** The currency MySpace records money in for now. Multi-currency comes later. */
export const DEFAULT_CURRENCY = "INR";

const CURRENCY_PATTERN = /^[A-Z]{3}$/;

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  bank: "Bank",
  cash: "Cash",
  wallet: "Wallet",
  other: "Other",
};

export function formatAccountType(type: AccountType): string {
  return ACCOUNT_TYPE_LABELS[type] ?? type;
}

const FALLBACK_CURRENCY = DEFAULT_CURRENCY;

function safeCurrency(currency?: string): string {
  const code = (currency ?? "").trim().toUpperCase();
  return CURRENCY_PATTERN.test(code) ? code : FALLBACK_CURRENCY;
}

/** INR groups the Indian way (₹1,25,000.00) under `en-IN`. */
function localeFor(code: string): string {
  return code === FALLBACK_CURRENCY ? "en-IN" : "en-US";
}

/**
 * Formats a stored amount for display. Never used to calculate anything —
 * money maths belongs in SQL, not in the UI.
 */
export function formatMoney(amount: number, currency?: string): string {
  const code = safeCurrency(currency);

  try {
    return new Intl.NumberFormat(localeFor(code), {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${code}`;
  }
}

/** Just the symbol, e.g. `₹` — used as an input prefix. */
export function getCurrencySymbol(currency?: string): string {
  const code = safeCurrency(currency);

  try {
    const parts = new Intl.NumberFormat(localeFor(code), {
      style: "currency",
      currency: code,
    }).formatToParts(0);

    return parts.find((part) => part.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
}

/** Formats a `YYYY-MM-DD` date column without time-zone surprises. */
export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
