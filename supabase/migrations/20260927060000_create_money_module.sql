-- ===========================================================================
-- MySpace — Money module schema
-- ===========================================================================
-- Money is stored with `numeric(14, 2)` (never floating point).
-- Every user-owned table is protected by Row Level Security — see the bottom
-- of this file. The frontend can never be the only line of defence.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.account_type as enum ('bank', 'cash', 'wallet', 'other');
create type public.category_type as enum ('income', 'expense');
create type public.transaction_type as enum ('income', 'expense', 'transfer');

-- ---------------------------------------------------------------------------
-- Shared helper: keep `updated_at` accurate without trusting the client.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- One row per auth user, created automatically on signup.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- accounts — where the money is stored.
-- ---------------------------------------------------------------------------
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  type public.account_type not null default 'bank',
  -- May be negative (e.g. an overdrawn account).
  starting_balance numeric(14, 2) not null default 0,
  -- ISO 4217 currency code.
  currency text not null default 'USD'
    check (char_length(currency) = 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create index accounts_user_id_idx on public.accounts (user_id);

create trigger accounts_set_updated_at
before update on public.accounts
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- categories — user-defined income / expense buckets.
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  type public.category_type not null,
  created_at timestamptz not null default now(),
  unique (user_id, name, type)
);

create index categories_user_id_idx on public.categories (user_id);

-- ---------------------------------------------------------------------------
-- transactions — one row per movement of money.
-- ---------------------------------------------------------------------------
-- How transfers work
-- ------------------
-- Moving money between two of your own accounts must never count as income or
-- as spending. A transfer is therefore modelled as a SINGLE row with
-- `type = 'transfer'`, where:
--   * account_id           -> the account the money leaves
--   * transfer_account_id  -> the account the money arrives in
--   * category_id          -> always null (transfers are not categorised)
--
-- Income and expense totals only aggregate rows with
-- `type in ('income', 'expense')`, so a transfer is excluded from both by
-- construction. An account balance is:
--
--   starting_balance
--   + sum(amount) where type = 'income'   and account_id = a
--   - sum(amount) where type = 'expense'  and account_id = a
--   - sum(amount) where type = 'transfer' and account_id = a
--   + sum(amount) where type = 'transfer' and transfer_account_id = a
--
-- `amount` is always stored positive; `type` carries the direction. That keeps
-- a single source of truth without introducing double-entry bookkeeping. If
-- richer transfer reporting is needed later, a `transfer_group_id` column can
-- link the two legs without changing any of the rules above.
-- ---------------------------------------------------------------------------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  type public.transaction_type not null,
  amount numeric(14, 2) not null check (amount > 0),
  description text,
  transaction_date date not null default current_date,
  transfer_account_id uuid references public.accounts (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Only transfers carry a destination account.
  constraint transactions_transfer_account_required check (
    (type = 'transfer') = (transfer_account_id is not null)
  ),
  -- A transfer must move money between two different accounts.
  constraint transactions_transfer_distinct_accounts check (
    transfer_account_id is null or transfer_account_id <> account_id
  ),
  -- Transfers are never categorised.
  constraint transactions_transfer_has_no_category check (
    type <> 'transfer' or category_id is null
  )
);

create index transactions_user_date_idx
  on public.transactions (user_id, transaction_date desc);
create index transactions_account_id_idx
  on public.transactions (account_id);
create index transactions_transfer_account_id_idx
  on public.transactions (transfer_account_id);
create index transactions_category_id_idx
  on public.transactions (category_id);

create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Create a profile row for every new auth user.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- Every table is locked down by default: a user can only touch rows they own
-- and can only insert rows that belong to themselves. Frontend filtering is
-- never relied upon.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

-- profiles: ownership is expressed by `id`.
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  to authenticated
  using ((select auth.uid()) = id);

-- accounts
create policy "accounts_select_own"
  on public.accounts for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "accounts_insert_own"
  on public.accounts for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "accounts_update_own"
  on public.accounts for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "accounts_delete_own"
  on public.accounts for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- categories
create policy "categories_select_own"
  on public.categories for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "categories_insert_own"
  on public.categories for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "categories_update_own"
  on public.categories for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "categories_delete_own"
  on public.categories for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- transactions
create policy "transactions_select_own"
  on public.transactions for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "transactions_insert_own"
  on public.transactions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "transactions_update_own"
  on public.transactions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "transactions_delete_own"
  on public.transactions for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Table privileges. RLS still applies on top of these grants.
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.accounts to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
