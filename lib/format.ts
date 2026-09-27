import type { AccountType } from "@/lib/supabase/types";

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  bank: "Bank",
  cash: "Cash",
  wallet: "Wallet",
  other: "Other",
};

export function formatAccountType(type: AccountType): string {
  return ACCOUNT_TYPE_LABELS[type] ?? type;
}

const FALLBACK_CURRENCY = "USD";
const CURRENCY_PATTERN = /^[A-Z]{3}$/;

/**
 * Formats a stored amount for display. Never used to calculate anything —
 * money maths belongs in SQL, not in the UI.
 */
export function formatMoney(amount: number, currency: string): string {
  const code = currency.trim().toUpperCase();
  const safeCode = CURRENCY_PATTERN.test(code) ? code : FALLBACK_CURRENCY;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: safeCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${safeCode}`;
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
