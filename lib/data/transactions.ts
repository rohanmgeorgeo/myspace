import { createClient } from "@/lib/supabase/server";
import type { Transaction } from "@/lib/supabase/types";

const DEFAULT_LIMIT = 8;

/** Most recent transactions for the signed-in user (RLS scoped). */
export async function getRecentTransactions(
  limit: number = DEFAULT_LIMIT,
): Promise<Transaction[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Could not load transactions: ${error.message}`);
  }

  return data ?? [];
}
