import { DEFAULT_CURRENCY, formatAccountType } from "@/lib/format";
import { ACCOUNT_TYPES, type AccountType } from "@/lib/supabase/types";

/**
 * Shared contract for the "Add account" form.
 *
 * Has no `"use client"` / `"use server"` directive on purpose: the server action
 * and the client form both import it, so validation lives in exactly one place
 * and the server stays authoritative.
 */

export const ACCOUNT_NAME_MAX_LENGTH = 80;

/**
 * Shown when deletion is refused because transactions still reference the
 * account (as source or transfer destination).
 */
export const ACCOUNT_HAS_TRANSACTIONS_MESSAGE =
  "This account has transactions. Delete or move those transactions before deleting the account.";

/** `numeric(14, 2)` in Postgres — 14 digits in total, 2 of them decimals. */
export const BALANCE_MAX_INTEGER_DIGITS = 12;
export const BALANCE_MAX_DECIMAL_PLACES = 2;

/** Options rendered by the type select, derived from the database enum. */
export const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] =
  ACCOUNT_TYPES.map((value) => ({ value, label: formatAccountType(value) }));

export type AccountFieldErrors = Partial<
  Record<"name" | "type" | "startingBalance" | "currency", string>
>;

export type AccountFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: AccountFieldErrors;
};

export const initialAccountFormState: AccountFormState = { status: "idle" };

export type NewAccount = {
  name: string;
  type: AccountType;
  /**
   * A validated decimal string, sent straight to the `numeric(14,2)` column.
   * It is never converted to a JavaScript number.
   */
  startingBalance: string;
  currency: string;
};

export type AccountFormParseResult =
  | { ok: true; data: NewAccount }
  | { ok: false; fieldErrors: AccountFieldErrors };

type ParseField<T> = { ok: true; value: T } | { ok: false; error: string };

const CURRENCY_PATTERN = /^[A-Z]{3}$/;

/** Digits only, optional leading minus, optional 1–2 decimal places. */
const BALANCE_PATTERN = new RegExp(
  `^-?\\d{1,${BALANCE_MAX_INTEGER_DIGITS}}(?:\\.\\d{0,${BALANCE_MAX_DECIMAL_PLACES}})?$`,
);

export function parseAccountNameFormValue(raw: string): ParseField<string> {
  const name = raw.trim();

  if (name.length === 0) {
    return { ok: false, error: "Enter an account name." };
  }

  if (name.length > ACCOUNT_NAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `Use ${ACCOUNT_NAME_MAX_LENGTH} characters or fewer.`,
    };
  }

  return { ok: true, value: name };
}

export function parseAccountTypeFormValue(raw: string): ParseField<AccountType> {
  const value = raw.trim().toLowerCase();

  if (value.length === 0) {
    return { ok: false, error: "Choose an account type." };
  }

  if (!(ACCOUNT_TYPES as readonly string[]).includes(value)) {
    return { ok: false, error: "Choose Bank, Cash, Wallet or Other." };
  }

  return { ok: true, value: value as AccountType };
}

export function parseStartingBalanceFormValue(raw: string): ParseField<string> {
  // Be forgiving about how people paste money: "1,25,000.50", "+500", " 500 ".
  const cleaned = raw.trim().replace(/[,\s_]/g, "").replace(/^\+/, "");

  if (cleaned.length === 0) {
    return { ok: false, error: "Enter the current balance." };
  }

  if (!BALANCE_PATTERN.test(cleaned)) {
    return {
      ok: false,
      error: `Use a number with up to ${BALANCE_MAX_DECIMAL_PLACES} decimal places, e.g. 12500.50.`,
    };
  }

  // Dropping a trailing "." keeps the string plain decimal input ("12500."
  // becomes "12500") without any numeric conversion.
  const value = cleaned.endsWith(".") ? cleaned.slice(0, -1) : cleaned;

  // Returned as a decimal string on purpose: it is passed to the
  // `numeric(14, 2)` column unchanged, so the value never becomes a JavaScript
  // floating point number.
  return { ok: true, value };
}

function parseCurrencyValue(raw: string): ParseField<string> {
  const value = raw.trim().toUpperCase();

  if (!CURRENCY_PATTERN.test(value)) {
    return { ok: false, error: "Unsupported currency." };
  }

  return { ok: true, value };
}

/**
 * Reads and validates the submitted form.
 *
 * `currency` is a server-side decision in this version — whatever the client
 * sends is ignored, so an account can never be created in an unexpected
 * currency.
 */
export function parseAccountFormData(formData: FormData): AccountFormParseResult {
  const read = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };

  const name = parseAccountNameFormValue(read("name"));
  const type = parseAccountTypeFormValue(read("type"));
  const startingBalance = parseStartingBalanceFormValue(read("startingBalance"));
  const currency = parseCurrencyValue(DEFAULT_CURRENCY);

  const fieldErrors: AccountFieldErrors = {};
  if (!name.ok) fieldErrors.name = name.error;
  if (!type.ok) fieldErrors.type = type.error;
  if (!startingBalance.ok) fieldErrors.startingBalance = startingBalance.error;
  if (!currency.ok) fieldErrors.currency = currency.error;

  if (!name.ok || !type.ok || !startingBalance.ok || !currency.ok) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    data: {
      name: name.value,
      type: type.value,
      startingBalance: startingBalance.value,
      currency: currency.value,
    },
  };
}
