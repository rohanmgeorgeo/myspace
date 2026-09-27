"use server";

import { revalidatePath } from "next/cache";

import {
  parseAccountFormData,
  type AccountFormState,
} from "@/lib/money/account-form";
import { createClient } from "@/lib/supabase/server";

/** Postgres `unique_violation` — the `unique (user_id, name)` constraint. */
const UNIQUE_VIOLATION = "23505";

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
    return {
      status: "error",
      message: "Your session has expired. Sign in again, then retry.",
    };
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
