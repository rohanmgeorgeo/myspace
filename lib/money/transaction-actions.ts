"use server";

import { revalidatePath } from "next/cache";

import {
  parseTransactionFormData,
  type TransactionFormState,
} from "@/lib/money/transaction-form";
import { createClient } from "@/lib/supabase/server";
import type { CategoryType } from "@/lib/supabase/types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

type CategoryResolution =
  | { ok: true; id: string }
  | { ok: false; error: string };

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
    return { ok: false, error: `Could not load categories. ${readError.message}` };
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

/**
 * Records a transaction for the signed-in user.
 *
 * `user_id` always comes from the verified session — never from the form — and
 * the accounts are re-read through RLS so an id belonging to somebody else
 * cannot be used. RLS enforces the same rules again on insert.
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
    return {
      status: "error",
      message: "Your session has expired. Sign in again, then retry.",
    };
  }

  const parsed = parseTransactionFormData(formData);

  if (!parsed.ok) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.fieldErrors,
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

  const accountIds = transferAccountId
    ? [accountId, transferAccountId]
    : [accountId];

  const { data: ownedAccounts, error: accountsError } = await supabase
    .from("accounts")
    .select("id")
    .in("id", accountIds);

  if (accountsError) {
    return {
      status: "error",
      message: `Could not check the account. ${accountsError.message}`,
    };
  }

  if ((ownedAccounts ?? []).length !== accountIds.length) {
    return {
      status: "error",
      message: "That account is not available.",
      fieldErrors: { accountId: "Choose an account you own." },
    };
  }

  let categoryId: string | null = null;

  if (categoryName) {
    const resolution = await resolveCategoryId(
      supabase,
      user.id,
      categoryName,
      type === "income" ? "income" : "expense",
    );

    if (!resolution.ok) {
      return { status: "error", message: resolution.error };
    }

    categoryId = resolution.id;
  }

  // `amount` is a validated decimal string, passed straight to `numeric(14,2)`.
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
