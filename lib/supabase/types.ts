/**
 * Hand-written database types for the MySpace schema.
 *
 * They mirror `supabase/migrations/*_money_module.sql`. If you change the
 * schema, update this file too (or generate it with the Supabase CLI:
 * `npx supabase gen types typescript --project-id <ref> > lib/supabase/types.ts`).
 */

export const ACCOUNT_TYPES = ["bank", "cash", "wallet", "other"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const CATEGORY_TYPES = ["income", "expense"] as const;
export type CategoryType = (typeof CATEGORY_TYPES)[number];

export const TRANSACTION_TYPES = ["income", "expense", "transfer"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export type Profile = {
  id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
};

export type Account = {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  /** Numeric columns are returned as numbers by PostgREST. */
  starting_balance: number;
  /** ISO 4217 code, e.g. "USD". */
  currency: string;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  type: TransactionType;
  /** Always stored positive; `type` carries the direction. */
  amount: number;
  description: string | null;
  /** Calendar date (`YYYY-MM-DD`). */
  transaction_date: string;
  /** Destination account for `type = 'transfer'`, otherwise null. */
  transfer_account_id: string | null;
  created_at: string;
  updated_at: string;
};

/** Fields the database fills in automatically. */
type Generated = "id" | "created_at" | "updated_at";

export type TableRow<T> = T;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Pick<Profile, "id" | "display_name"> &
          Partial<Pick<Profile, Generated>>;
        Update: Partial<Omit<Profile, "id">>;
        Relationships: [];
      };
      accounts: {
        Row: Account;
        /**
         * `starting_balance` also accepts a decimal string, which is how the
         * app writes money: the validated string is handed to PostgREST and
         * cast to `numeric(14,2)` without a JavaScript number in between.
         */
        Insert: Omit<Account, Generated | "starting_balance"> &
          Partial<Pick<Account, "id">> & {
            starting_balance: number | string;
          };
        Update: Partial<Omit<Account, "id" | "user_id">>;
        Relationships: [];
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, "id" | "created_at"> &
          Partial<Pick<Category, "id">>;
        Update: Partial<Omit<Category, "id" | "user_id">>;
        Relationships: [];
      };
      transactions: {
        Row: Transaction;
        /**
         * `amount` also accepts a decimal string, which is how the app writes
         * money: the validated string goes straight to `numeric(14,2)` without
         * a JavaScript number in between.
         */
        Insert: Omit<
          Transaction,
          Generated | "transfer_account_id" | "amount"
        > &
          Partial<Pick<Transaction, "id" | "transfer_account_id">> & {
            amount: number | string;
          };
        Update: Partial<Omit<Transaction, "id" | "user_id">>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      account_type: AccountType;
      category_type: CategoryType;
      transaction_type: TransactionType;
    };
    CompositeTypes: Record<never, never>;
  };
};

export type TableName = keyof Database["public"]["Tables"];
