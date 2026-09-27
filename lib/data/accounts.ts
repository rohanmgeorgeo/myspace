import { createClient } from "@/lib/supabase/server";
import type { Account } from "@/lib/supabase/types";

/**
 * Accounts belonging to the signed-in user.
 *
 * Row Level Security guarantees only the caller's rows are returned, so this
 * never needs to filter by `user_id` in the client.
 */
export async function getAccounts(): Promise<Account[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Could not load accounts: ${error.message}`);
  }

  return data ?? [];
}
