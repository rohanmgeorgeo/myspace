import { toMinorUnits } from "@/lib/money/decimal";
import type { Account, Transaction } from "@/lib/supabase/types";

export type AccountBalance = {
  account: Account;
  /** Current balance in integer minor units (paise). */
  minorUnits: number;
};

function adjust(
  balances: Map<string, number>,
  accountId: string | null,
  delta: number,
) {
  if (!accountId) {
    return;
  }

  const current = balances.get(accountId);
  if (current === undefined) {
    // Not one of this user's accounts (or already deleted) — ignore it.
    return;
  }

  balances.set(accountId, current + delta);
}

/**
 * Current balance per account:
 *
 *   Starting Balance + Income − Expenses + Transfers In − Transfers Out
 *
 * Everything is added up in integer minor units, so no rounding creeps in.
 * Transfers only move money between the user's own accounts, which is why the
 * sum of all balances is unaffected by them.
 */
export function calculateAccountBalances(
  accounts: Account[],
  transactions: Transaction[],
): AccountBalance[] {
  const balances = new Map<string, number>();

  for (const account of accounts) {
    balances.set(account.id, toMinorUnits(account.starting_balance));
  }

  for (const transaction of transactions) {
    const amount = toMinorUnits(transaction.amount);

    switch (transaction.type) {
      case "income":
        adjust(balances, transaction.account_id, amount);
        break;
      case "expense":
        adjust(balances, transaction.account_id, -amount);
        break;
      case "transfer":
        adjust(balances, transaction.account_id, -amount);
        adjust(balances, transaction.transfer_account_id, amount);
        break;
    }
  }

  return accounts.map((account) => ({
    account,
    minorUnits: balances.get(account.id) ?? 0,
  }));
}

/** Total Balance — the sum of every account's current balance, in minor units. */
export function totalMinorUnits(balances: AccountBalance[]): number {
  return balances.reduce((total, balance) => total + balance.minorUnits, 0);
}

/** MySpace's calendar timezone, so "this month" means the same thing everywhere. */
const APP_TIME_ZONE = "Asia/Kolkata";

/**
 * `YYYY-MM` for the current calendar month in `APP_TIME_ZONE`.
 *
 * `transaction_date` is a plain date, so comparing the `YYYY-MM` prefix is
 * exact; only the "which month is it now" part depends on the clock, and it no
 * longer depends on where the server happens to run.
 */
export function currentMonthKey(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";

  return `${year}-${month}`;
}

export type MonthTotals = {
  income: number;
  expenses: number;
};

/**
 * Income and expenses for a `YYYY-MM` month, in minor units.
 * Transfers are ignored on purpose — they are neither.
 */
export function monthTotals(
  transactions: Transaction[],
  monthKey: string,
): MonthTotals {
  let income = 0;
  let expenses = 0;

  for (const transaction of transactions) {
    if (!transaction.transaction_date.startsWith(monthKey)) {
      continue;
    }

    if (transaction.type === "income") {
      income += toMinorUnits(transaction.amount);
    } else if (transaction.type === "expense") {
      expenses += toMinorUnits(transaction.amount);
    }
  }

  return { income, expenses };
}
