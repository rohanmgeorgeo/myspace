import {
  cleanMoneyInput,
  moneyPattern,
  toMinorUnits,
  MONEY_MAX_DECIMAL_PLACES,
} from "@/lib/money/decimal";
import { isUuid } from "@/lib/money/ids";
import {
  TRANSACTION_TYPES,
  type TransactionType,
} from "@/lib/supabase/types";

/**
 * Shared contract for the "Add transaction" form.
 *
 * No `"use client"` / `"use server"` directive: the server action and the client
 * form both import it, so validation lives in one place and the server stays
 * authoritative.
 */

export const TRANSACTION_DESCRIPTION_MAX_LENGTH = 200;
export const CATEGORY_NAME_MAX_LENGTH = 60;

export type TransactionFieldName =
  | "type"
  | "amount"
  | "accountId"
  | "transferAccountId"
  | "category"
  | "transactionDate"
  | "description";

export type TransactionFieldErrors = Partial<
  Record<TransactionFieldName, string>
>;

export type TransactionFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: TransactionFieldErrors;
};

export const initialTransactionFormState: TransactionFormState = {
  status: "idle",
};

export type NewTransaction = {
  type: TransactionType;
  /** Validated decimal string, sent to `numeric(14,2)` as-is. */
  amount: string;
  accountId: string;
  /** Destination account — only for transfers. */
  transferAccountId: string | null;
  /** Category name — only for income/expense. */
  categoryName: string | null;
  /** `YYYY-MM-DD`. */
  transactionDate: string;
  description: string | null;
};

export type TransactionFormParseResult =
  | { ok: true; data: NewTransaction }
  | { ok: false; fieldErrors: TransactionFieldErrors };

type ParseField<T> = { ok: true; value: T } | { ok: false; error: string };

/** A transaction amount is always positive; `type` carries the direction. */
const AMOUNT_PATTERN = moneyPattern({ allowNegative: false });
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseTransactionTypeFormValue(
  raw: string,
): ParseField<TransactionType> {
  const value = raw.trim().toLowerCase();

  if (value.length === 0) {
    return { ok: false, error: "Choose a transaction type." };
  }

  if (!(TRANSACTION_TYPES as readonly string[]).includes(value)) {
    return { ok: false, error: "Choose Expense, Income or Transfer." };
  }

  return { ok: true, value: value as TransactionType };
}

export function parseTransactionAmountFormValue(
  raw: string,
): ParseField<string> {
  const cleaned = cleanMoneyInput(raw);

  if (cleaned.length === 0) {
    return { ok: false, error: "Enter an amount." };
  }

  if (cleaned.startsWith("-")) {
    return {
      ok: false,
      error: "Enter a positive amount — the type decides the direction.",
    };
  }

  if (!AMOUNT_PATTERN.test(cleaned)) {
    return {
      ok: false,
      error: `Use a number with up to ${MONEY_MAX_DECIMAL_PLACES} decimal places, e.g. 500 or 1250.50.`,
    };
  }

  if (toMinorUnits(cleaned) <= 0) {
    return { ok: false, error: "The amount must be more than zero." };
  }

  return { ok: true, value: cleaned };
}

export function parseAccountIdFormValue(
  raw: string,
  what: string,
): ParseField<string> {
  const value = raw.trim();

  if (!isUuid(value)) {
    return { ok: false, error: `Choose ${what}.` };
  }

  return { ok: true, value };
}

export function parseTransactionDateFormValue(raw: string): ParseField<string> {
  const value = raw.trim();
  const match = DATE_PATTERN.exec(value);

  if (!match) {
    return { ok: false, error: "Choose a date." };
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const asUtc = new Date(Date.UTC(year, month - 1, day));

  if (
    asUtc.getUTCFullYear() !== year ||
    asUtc.getUTCMonth() !== month - 1 ||
    asUtc.getUTCDate() !== day
  ) {
    return { ok: false, error: "That date does not exist." };
  }

  return { ok: true, value };
}

export function parseCategoryNameFormValue(
  raw: string,
): ParseField<string> {
  const value = raw.trim();

  if (value.length === 0) {
    return { ok: false, error: "Enter a category, e.g. Food or Salary." };
  }

  if (value.length > CATEGORY_NAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `Use ${CATEGORY_NAME_MAX_LENGTH} characters or fewer.`,
    };
  }

  return { ok: true, value };
}

export function parseDescriptionFormValue(
  raw: string,
): ParseField<string | null> {
  const value = raw.trim();

  if (value.length === 0) {
    return { ok: true, value: null };
  }

  if (value.length > TRANSACTION_DESCRIPTION_MAX_LENGTH) {
    return {
      ok: false,
      error: `Use ${TRANSACTION_DESCRIPTION_MAX_LENGTH} characters or fewer.`,
    };
  }

  return { ok: true, value };
}

/**
 * Reads and validates the submitted form.
 *
 * Which fields are required depends on the type: income/expense need a category
 * and no destination, transfers need a destination and no category.
 */
export function parseTransactionFormData(
  formData: FormData,
): TransactionFormParseResult {
  const read = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };

  const type = parseTransactionTypeFormValue(read("type"));
  const amount = parseTransactionAmountFormValue(read("amount"));
  const accountId = parseAccountIdFormValue(read("accountId"), "an account");
  const transactionDate = parseTransactionDateFormValue(
    read("transactionDate"),
  );
  const description = parseDescriptionFormValue(read("description"));

  const fieldErrors: TransactionFieldErrors = {};
  if (!type.ok) fieldErrors.type = type.error;
  if (!amount.ok) fieldErrors.amount = amount.error;
  if (!accountId.ok) fieldErrors.accountId = accountId.error;
  if (!transactionDate.ok) fieldErrors.transactionDate = transactionDate.error;
  if (!description.ok) fieldErrors.description = description.error;

  const isTransfer = type.ok && type.value === "transfer";

  // Only transfers may carry a destination account.
  const destination = isTransfer
    ? parseAccountIdFormValue(read("transferAccountId"), "a destination account")
    : null;
  if (destination && !destination.ok) {
    fieldErrors.transferAccountId = destination.error;
  }

  // Only income/expense may carry a category.
  const category = isTransfer
    ? null
    : parseCategoryNameFormValue(read("category"));
  if (category && !category.ok) {
    fieldErrors.category = category.error;
  }

  if (!type.ok || !amount.ok || !accountId.ok || !transactionDate.ok || !description.ok) {
    return { ok: false, fieldErrors };
  }

  if (type.value === "transfer") {
    if (!destination?.ok) {
      fieldErrors.transferAccountId = "Choose a destination account.";
      return { ok: false, fieldErrors };
    }

    if (destination.value === accountId.value) {
      fieldErrors.transferAccountId =
        "Choose a destination different from the source account.";
      return { ok: false, fieldErrors };
    }

    return {
      ok: true,
      data: {
        type: type.value,
        amount: amount.value,
        accountId: accountId.value,
        transferAccountId: destination.value,
        categoryName: null,
        transactionDate: transactionDate.value,
        description: description.value,
      },
    };
  }

  if (!category?.ok) {
    fieldErrors.category = "Enter a category.";
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    data: {
      type: type.value,
      amount: amount.value,
      accountId: accountId.value,
      transferAccountId: null,
      categoryName: category.value,
      transactionDate: transactionDate.value,
      description: description.value,
    },
  };
}
