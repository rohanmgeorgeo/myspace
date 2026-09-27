import { createClient } from "@/lib/supabase/server";
import type { Transaction } from "@/lib/supabase/types";

/** How many transactions the Money page lists under "Recent transactions". */
export const RECENT_TRANSACTIONS_LIMIT = 8;

/**
 * Every transaction for the signed-in user, newest first (RLS scoped).
 *
 * Account balances need the whole history, so this is intentionally not
 * limited. If the table ever grows large, the aggregation should move into SQL
 * (PostgREST cannot group rows without an RPC, which is why it lives in
 * `lib/money/balances.ts` for now).
 */
export async function getTransactions(): Promise<Transaction[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load transactions: ${error.message}`);
  }

  return data ?? [];
}
