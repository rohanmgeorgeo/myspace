"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

/**
 * Supabase client for Client Components.
 *
 * Sessions are stored in cookies, which keeps browser and server clients in
 * sync. Create a new client per call site (or memoise it at module scope in a
 * component file) — do not share a single instance across users on the server.
 */
export function createClient() {
  const { url, anonKey } = getSupabaseEnv();

  return createBrowserClient<Database>(url, anonKey);
}
