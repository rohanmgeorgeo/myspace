/**
 * Single place where the public Supabase credentials are read.
 *
 * These values are inlined into the browser bundle by Next.js, so the helper
 * uses static `process.env.NEXT_PUBLIC_*` lookups (never dynamic access).
 */
export type SupabaseEnv = {
  url: string;
  anonKey: string;
};

export const MISSING_SUPABASE_ENV_MESSAGE =
  "Supabase is not configured yet. Copy `.env.local.example` to `.env.local`, " +
  "add your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then " +
  "restart the dev server.";

function readEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

/** `true` when both public credentials are present. */
export function hasSupabaseEnv(): boolean {
  return readEnv() !== null;
}

/**
 * Credentials, or a thrown error with setup instructions. Used by server and
 * browser clients so a misconfigured project fails loudly and usefully.
 */
export function getSupabaseEnv(): SupabaseEnv {
  const env = readEnv();

  if (!env) {
    throw new Error(MISSING_SUPABASE_ENV_MESSAGE);
  }

  return env;
}
