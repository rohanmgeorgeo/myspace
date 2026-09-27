/**
 * Shared state shape for the auth forms.
 *
 * Deliberately has no `"use client"` / `"use server"` directive: both server
 * components (the login page) and client components (the form) import it.
 */
export type AuthFormState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export const initialAuthState: AuthFormState = { status: "idle" };

/** Only allow same-origin paths as a post-login destination. */
export function sanitizeNextPath(value: unknown): string {
  if (typeof value !== "string") {
    return "/app";
  }

  const path = value.trim();

  if (!path.startsWith("/") || path.startsWith("//")) {
    return "/app";
  }

  return path;
}

