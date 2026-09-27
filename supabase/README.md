# Supabase

## `migrations/20260927060000_create_money_module.sql`

Creates the Money module schema:

- `profiles` — one row per auth user (auto-created by a trigger on `auth.users`)
- `accounts` — `bank` / `cash` / `wallet` / `other`, `numeric(14,2)` balances
- `categories` — user-defined `income` / `expense` buckets
- `transactions` — `income` / `expense` / `transfer`, `numeric(14,2)` amounts

It also enables Row Level Security on all four tables with owner-only policies
(`select`, `insert`, `update`, `delete`), plus `updated_at` triggers.

## Applying it

Option A — Supabase dashboard (no tooling required)

1. Open your project → **SQL Editor** → **New query**.
2. Paste the whole migration file.
3. Press **Run**. It is written to run once against a fresh project.

Option B — Supabase CLI

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

## Notes

- Money columns use `numeric(14, 2)`. Floating point is never used for amounts.
- `amount` is always stored positive; the transaction `type` carries direction.
- Transfers move money between the user's own accounts and are excluded from
  income/expense totals by construction (see the comments above the
  `transactions` table).
- Keep a service-role key out of `.env.local`. Only the anon/publishable key is
  used by the app; RLS does the access control.
