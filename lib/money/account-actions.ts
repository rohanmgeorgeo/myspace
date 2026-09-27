"use server";

import { revalidatePath } from "next/cache";

import {
  ACCOUNT_HAS_TRANSACTIONS_MESSAGE,
  parseAccountFormData,
  type AccountFormState,
} from "@/lib/money/account-form";
import { parseIdFormValue } from "@/lib/money/ids";
import { createClient } from "@/lib/supabase/server";

/** Postgres `unique_violation` — the `unique (user_id, name)` constraint. */
const UNIQUE_VIOLATION = "23505";

const SESSION_EXPIRED: AccountFormState = {
  status: "error",
  message: "Your session has expired. Sign in again, then retry.",
};

const NOT_FOUND = "That account could not be found.";

/**
 * Creates an account for the signed-in user.
 *
 * The `user_id` is taken from the verified session, never from the form, so a
 * crafted request cannot create an account for somebody else. RLS enforces the
 * same rule at the database level (`auth.uid() = user_id`).
 */
export async function createAccount(
  _prevState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const supabase = await createClient();

  // `getUser()` is verified against the Auth server, unlike `getSession()`.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return SESSION_EXPIRED;
  }

  const parsed = parseAccountFormData(formData);

  if (!parsed.ok) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  const { name, type, startingBalance, currency } = parsed.data;

  // `startingBalance` is a validated decimal string and is passed straight to
  // the `numeric(14, 2)` column — it is never converted to a JavaScript number.
  const { error } = await supabase.from("accounts").insert({
    user_id: user.id,
    name,
    type,
    starting_balance: startingBalance,
    currency,
  });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return {
        status: "error",
        message: `You already have an account called “${name}”.`,
        fieldErrors: { name: "That name is already in use." },
      };
    }

    return {
      status: "error",
      message: `Could not add the account. ${error.message}`,
    };
  }

  revalidatePath("/app/money");

  return { status: "success", message: `“${name}” was added.` };
}

/** Updates an account's name, type and opening balance. */
export async function updateAccount(
  _prevState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
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

  const parsed = parseAccountFormData(formData);

  if (!parsed.ok) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  const { name, type, startingBalance } = parsed.data;

  // `currency` is deliberately not written: MySpace is INR-only and there is no
  // currency field to edit. Transaction history is never touched here.
  const { data: updated, error } = await supabase
    .from("accounts")
    .update({ name, type, starting_balance: startingBalance })
    .eq("id", id)
    .select("id");

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return {
        status: "error",
        message: `You already have an account called “${name}”.`,
        fieldErrors: { name: "That name is already in use." },
      };
    }

    return {
      status: "error",
      message: `Could not save the account. ${error.message}`,
    };
  }

  // RLS scopes the update, so no row back means it is not this user's account.
  if ((updated ?? []).length === 0) {
    return { status: "error", message: NOT_FOUND };
  }

  revalidatePath("/app/money");

  return { status: "success", message: `“${name}” was updated.` };
}

/**
 * Deletes an account, but only while nothing references it.
 *
 * `transactions.account_id` is `ON DELETE CASCADE`, so deleting a referenced
 * account would silently destroy financial history. The reference count is
 * checked first and deletion is refused if it is non-zero.
 */
export async function deleteAccount(
  _prevState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
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

  const { data: account, error: readError } = await supabase
    .from("accounts")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    return {
      status: "error",
      message: `Could not load the account. ${readError.message}`,
    };
  }

  if (!account) {
    return { status: "error", message: NOT_FOUND };
  }

  const { count, error: countError } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .or(`account_id.eq.${id},transfer_account_id.eq.${id}`);

  if (countError) {
    return {
      status: "error",
      message: `Could not check for transactions. ${countError.message}`,
    };
  }

  if ((count ?? 0) > 0) {
    return { status: "error", message: ACCOUNT_HAS_TRANSACTIONS_MESSAGE };
  }

  const { data: deleted, error: deleteError } = await supabase
    .from("accounts")
    .delete()
    .eq("id", id)
    .select("id");

  if (deleteError) {
    return {
      status: "error",
      message: `Could not delete the account. ${deleteError.message}`,
    };
  }

  if ((deleted ?? []).length === 0) {
    return { status: "error", message: NOT_FOUND };
  }

  revalidatePath("/app/money");

  return { status: "success", message: `“${account.name}” was deleted.` };
}