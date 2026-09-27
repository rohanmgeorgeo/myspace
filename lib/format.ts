import { MONEY_MINOR_UNITS_PER_MAJOR, toMinorUnits } from "@/lib/money/decimal";
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
 * Formats a major-unit value. Private on purpose — callers use
 * `formatMinorUnits` or `formatMoneyValue` so money never travels as a loose
 * JavaScript number.
 */
function formatMoney(amount: number, currency?: string): string {
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

/**
 * Formats integer minor units (paise) for display.
 *
 * Dividing by 100 is presentation only — every money *calculation* happens in
 * integer minor units — and Intl then renders exactly two decimals.
 */
export function formatMinorUnits(
  minorUnits: number,
  currency?: string,
): string {
  return formatMoney(minorUnits / MONEY_MINOR_UNITS_PER_MAJOR, currency);
}

/** Formats a single stored value, which PostgREST may return as a string. */
export function formatMoneyValue(
  value: number | string,
  currency?: string,
): string {
  return formatMinorUnits(toMinorUnits(value), currency);
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
