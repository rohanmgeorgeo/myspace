# MySpace

A modular personal dashboard. The first module is **Money**; goals, boards,
notes, habits and other tools will be added on top of the same foundation.

Built with Next.js (App Router), TypeScript, Tailwind CSS v4, shadcn/ui,
Supabase (Postgres + Auth) and Lucide icons.

---

## 1. What exists today

| Area | Route | State |
| --- | --- | --- |
| Landing | `/` | Redirects to `/app` |
| Sign in / sign up | `/login` | Email + password, working |
| Home dashboard | `/app` | Greeting, balance placeholder, recent activity placeholder, quick link to Money |
| Money | `/app/money` | Overview placeholders, Accounts section, Recent transactions section |
| Settings | `/app/settings` | Profile details + theme switch |
| Auth | — | Supabase SSR sessions, proxy-protected routes, logout |

There is **no fake financial data** anywhere. When a section has no rows it
renders an empty state. The `Add account` / `Add transaction` buttons explain
that the flow is not built yet instead of pretending to work.

---

## 2. Project structure

```
app/
  layout.tsx              Root layout: fonts, theme provider, toaster
  page.tsx                Redirects to /app
  globals.css             Tailwind v4 + shadcn theme tokens (light & dark)
  login/page.tsx          Public auth page
  app/
    layout.tsx            Protected shell: auth check + sidebar/header
    page.tsx              Home dashboard
    money/page.tsx        Money module
    settings/page.tsx     Account + appearance
components/
  layout/                 App shell: sidebar, header, nav config, user menu
  auth/                   Auth form + credentials form
  money/                  Money module sections and helpers
  ui/                     shadcn/ui primitives (generated)
  *.tsx                   Small shared pieces (Section, StatCard, EmptyState…)
lib/
  supabase/
    client.ts             Browser client
    server.ts             Server client (per request)
    proxy.ts              Session refresh + route protection
    types.ts              Database types
    env.ts                Reads NEXT_PUBLIC_SUPABASE_* with a clear error
  auth/
    session.ts            getCurrentUser / getCurrentProfile (cached per request)
    actions.ts            signIn / signUp / signOut server actions
    display-name.ts       Name + initials helpers
    form-state.ts         Shared form state + next-path sanitising
  data/
    accounts.ts           Account queries
    transactions.ts       Transaction queries
  format.ts               Money / date / account-type formatting
hooks/
  use-mobile.ts           Viewport helper used by the sidebar
proxy.ts                  Next.js 16 proxy entry point (was middleware.ts)
supabase/
  migrations/             SQL schema + RLS policies
```

### Why `proxy.ts` and not `middleware.ts`

Next.js 16 renamed the `middleware.ts` convention to `proxy.ts`. The entry point
is `proxy.ts` at the project root and it delegates to `lib/supabase/proxy.ts`,
which refreshes the Supabase session on every request and redirects signed-out
visitors away from `/app`.

---

## 3. Running locally

```bash
npm install
cp .env.local.example .env.local   # then fill in the two values
npm run dev                        # http://localhost:3000
```

Other scripts:

```bash
npm run build     # production build
npm run lint      # eslint
npx tsc --noEmit  # type check
```

> Node here is installed through `nvm`. If `npm` is missing in a fresh shell,
> run `export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"` first (or add that to
> your shell profile and run `nvm use`).

---

## 4. Environment variables

`.env.local` (git-ignored, never committed):

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon / publishable key |

Only the public anon key belongs in the frontend. **Never** put a
service-role/secret key in a `NEXT_PUBLIC_*` variable or anywhere in this app.

---

## 5. Database setup

The schema lives in `supabase/migrations/20260927060000_create_money_module.sql`.
It creates `profiles`, `accounts`, `categories` and `transactions`, adds
`updated_at` triggers, an auth-user → profile trigger, and enables Row Level
Security with owner-only policies on every table.

Run it **once** in the Supabase SQL Editor:

1. Supabase Dashboard → **SQL Editor** → **New query**.
2. Paste the contents of
   `supabase/migrations/20260927060000_create_money_module.sql`.
3. **Run**.

Then check Supabase Dashboard → **Authentication → Providers → Email** and
decide whether **Confirm email** is enabled. With it on, new sign-ups must
confirm by email before they can sign in — the app already shows that message.

### How transfers stay out of income/expense

A transfer between your own accounts is one row with `type = 'transfer'`:

- `account_id` — the account the money leaves
- `transfer_account_id` — the account the money arrives in
- `category_id` — always `null`

Income and expense totals only aggregate rows with
`type in ('income', 'expense')`, so a transfer can never be counted as either.
See the comment block above the `transactions` table for the exact balance
formula.

---

## 6. Adding the next module

1. Add the route under `app/app/<module>/`.
2. Add the nav entry in `components/layout/nav-config.ts`.
3. Add a `lib/data/<module>.ts` query module.
4. Add SQL tables with `user_id`, `numeric` money columns and RLS policies
   following the same pattern as the Money module.
