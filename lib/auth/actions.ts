"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { sanitizeNextPath, type AuthFormState } from "@/lib/auth/form-state";
import {
  hasSupabaseEnv,
  MISSING_SUPABASE_ENV_MESSAGE,
} from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const MIN_PASSWORD_LENGTH = 6;

/**
 * Returns an error state when the project has not been pointed at a Supabase
 * instance yet, so the form explains itself instead of 500-ing.
 */
function notConfiguredState(): AuthFormState | null {
  if (hasSupabaseEnv()) {
    return null;
  }

  return { status: "error", message: MISSING_SUPABASE_ENV_MESSAGE };
}

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };
}

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const notConfigured = notConfiguredState();
  if (notConfigured) {
    return notConfigured;
  }

  const { email, password } = readCredentials(formData);

  if (!email || !password) {
    return { status: "error", message: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      status: "error",
      message:
        error.message === "Invalid login credentials"
          ? "That email and password combination is not correct."
          : error.message,
    };
  }

  revalidatePath("/", "layout");
  redirect(sanitizeNextPath(formData.get("next")));
}

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const notConfigured = notConfiguredState();
  if (notConfigured) {
    return notConfigured;
  }

  const { email, password } = readCredentials(formData);
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (!email || !password) {
    return { status: "error", message: "Enter your email and password." };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      status: "error",
      message: `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: displayName ? { display_name: displayName } : undefined,
    },
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  // With email confirmation enabled, Supabase returns no session yet.
  if (!data.session) {
    return {
      status: "success",
      message: "Check your inbox to confirm your email, then sign in.",
    };
  }

  revalidatePath("/", "layout");
  redirect(sanitizeNextPath(formData.get("next")));
}

export async function signOut() {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
