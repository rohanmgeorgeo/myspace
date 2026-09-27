"use server";

import { revalidatePath } from "next/cache";

import { parseIdFormValue } from "@/lib/money/ids";
import {
  parseTransactionFormData,
  type TransactionFormState,
} from "@/lib/money/transaction-form";
import { createClient } from "@/lib/supabase/server";
import type { CategoryType, TransactionType } from "@/lib/supabase/types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const SESSION_EXPIRED: TransactionFormState = {
  status: "error",
  message: "Your session has expired. Sign in again, then retry.",
};

const NOT_FOUND = "That transaction could not be found.";

type CategoryResolution = { ok: true; id: string } | { ok: false; error: string };

/**
 * Finds the user's existing category by name (case-insensitive) or creates it.
 *
 * Reusing a match keeps the category list tidy; the comparison is done here
 * rather than with `ilike` so a name containing `%` or `_` cannot act as a
 * wildcard.
 */
async function resolveCategoryId(
  supabase: Supabase,
  userId: string,
  name: string,
  type: CategoryType,
): Promise<CategoryResolution> {
  const { data: existing, error: readError } = await supabase
    .from("categories")
    .select("id, name")
    .eq("type", type);

  if (readError) {
    return {
      ok: false,
      error: `Could not load categories. ${readError.message}`,
    };
  }

  const match = (existing ?? []).find(
    (category) => category.name.toLowerCase() === name.toLowerCase(),
  );
  if (match) {
    return { ok: true, id: match.id };
  }

  const { data: created, error: insertError } = await supabase
    .from("categories")
    .insert({ user_id: userId, name, type })
    .select("id")
    .single();

  if (insertError || !created) {
    return {
      ok: false,
      error: `Could not save the category. ${insertError?.message ?? "Unknown error"}`,
    };
  }

  return { ok: true, id: created.id };
}

/** The column values a transaction needs, ready to insert or update. */
type TransactionWrites = {
  accountId: string;
  categoryId: string | null;
  type: TransactionType;
  /** Validated decimal string — sent straight to `numeric(14,2)`. */
  amount: string;
  description: string | null;
  transactionDate: string;
  transferAccountId: string | null;
};

type PreparedTransaction =
  | { ok: true; writes: TransactionWrites }
  | { ok: false; state: TransactionFormState };

/**
 * Validates a submitted transaction and resolves its category, so create and
 * update share exactly one set of rules.
 */
async function prepareTransaction(
  supabase: Supabase,
  userId: string,
  formData: FormData,
): Promise<PreparedTransaction> {
  const parsed = parseTransactionFormData(formData);

  if (!parsed.ok) {
    return {
      ok: false,
      state: {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: parsed.fieldErrors,
      },
    };
  }

  const {
    type,
    amount,
    accountId,
    transferAccountId,
    categoryName,
    transactionDate,
    description,
  } = parsed.data;

  // Ownership comes from RLS: an account belonging to somebody else simply
  // comes back empty, so a forged id can never be written.
  const accountIds = transferAccountId
    ? [accountId, transferAccountId]
    : [accountId];

  const { data: ownedAccounts, error: accountsError } = await supabase
    .from("accounts")
    .select("id")
    .in("id", accountIds);

  if (accountsError) {
    return {
      ok: false,
      state: {
        status: "error",
        message: `Could not check the account. ${accountsError.message}`,
      },
    };
  }

  if ((ownedAccounts ?? []).length !== accountIds.length) {
    return {
      ok: false,
      state: {
        status: "error",
        message: "That account is not available.",
        fieldErrors: { accountId: "Choose an account you own." },
      },
    };
  }

  let categoryId: string | null = null;

  if (categoryName) {
    const resolution = await resolveCategoryId(
      supabase,
      userId,
      categoryName,
      type === "income" ? "income" : "expense",
    );

    if (!resolution.ok) {
      return {
        ok: false,
        state: { status: "error", message: resolution.error },
      };
    }

    categoryId = resolution.id;
  }

  return {
    ok: true,
    writes: {
      accountId,
      categoryId,
      type,
      amount,
      description,
      transactionDate,
      transferAccountId,
    },
  };
}

/**
 * Records a transaction for the signed-in user.
 *
 * `user_id` always comes from the verified session — never from the form.
 */
export async function createTransaction(
  _prevState: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return SESSION_EXPIRED;
  }

  const prepared = await prepareTransaction(supabase, user.id, formData);
  if (!prepared.ok) {
    return prepared.state;
  }

  const {
    accountId,
    categoryId,
    type,
    amount,
    description,
    transactionDate,
    transferAccountId,
  } = prepared.writes;

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    account_id: accountId,
    category_id: categoryId,
    type,
    amount,
    description,
    transaction_date: transactionDate,
    transfer_account_id: transferAccountId,
  });

  if (error) {
    return {
      status: "error",
      message: `Could not save the transaction. ${error.message}`,
    };
  }

  revalidatePath("/app/money");

  return { status: "success", message: "Transaction added." };
}

/** Updates an existing transaction, reusing the same validation as create. */
export async function updateTransaction(
  _prevState: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return SESSION_EXPIRED;
  }

  const id = parseIdFormValue(formData.get("id"));
  if (!id) {
    return { status: "error", message: NOT_FOUND };
  }

  const prepared = await prepareTransaction(supabase, user.id, formData);
  if (!prepared.ok) {
    return prepared.state;
  }

  const {
    accountId,
    categoryId,
    type,
    amount,
    description,
    transactionDate,
    transferAccountId,
  } = prepared.writes;

  const { data: updated, error } = await supabase
    .from("transactions")
    .update({
      account_id: accountId,
      category_id: categoryId,
      type,
      amount,
      description,
      transaction_date: transactionDate,
      transfer_account_id: transferAccountId,
    })
    .eq("id", id)
    .select("id");

  if (error) {
    return {
      status: "error",
      message: `Could not save the transaction. ${error.message}`,
    };
  }

  // RLS scopes the update, so no row back means it is not this user's row.
  if ((updated ?? []).length === 0) {
    return { status: "error", message: NOT_FOUND };
  }

  revalidatePath("/app/money");

  return { status: "success", message: "Transaction updated." };
}

/** Deletes one transaction. Derived balances follow because they are computed. */
export async function deleteTransaction(
  _prevState: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return SESSION_EXPIRED;
  }

  const id = parseIdFormValue(formData.get("id"));
  if (!id) {
    return { status: "error", message: NOT_FOUND };
  }

  const { data: deleted, error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    return {
      status: "error",
      message: `Could not delete the transaction. ${error.message}`,
    };
  }

  if ((deleted ?? []).length === 0) {
    return { status: "error", message: NOT_FOUND };
  }

  revalidatePath("/app/money");

  return { status: "success", message: "Transaction deleted." };
}
