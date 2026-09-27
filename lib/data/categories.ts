import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/supabase/types";

/** Categories belonging to the signed-in user (RLS scoped), by name. */
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Could not load categories: ${error.message}`);
  }

  return data ?? [];
}
