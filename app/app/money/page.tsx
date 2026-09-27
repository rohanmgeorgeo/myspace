import type { Metadata } from "next";
import {
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react";

import { AccountsSection } from "@/components/money/accounts-section";
import { TransactionsSection } from "@/components/money/transactions-section";
import { PageHeading } from "@/components/page-heading";
import { StatCard } from "@/components/stat-card";
import { getAccounts } from "@/lib/data/accounts";
import { getCategories } from "@/lib/data/categories";
import {
  getTransactions,
  RECENT_TRANSACTIONS_LIMIT,
} from "@/lib/data/transactions";
import { formatMinorUnits } from "@/lib/format";
import {
  calculateAccountBalances,
  currentMonthKey,
  monthTotals,
  totalMinorUnits,
} from "@/lib/money/balances";

export const metadata: Metadata = {
  title: "Money",
};

export default async function MoneyPage() {
  const [accounts, transactions, categories] = await Promise.all([
    getAccounts(),
    getTransactions(),
    getCategories(),
  ]);

  const balances = calculateAccountBalances(accounts, transactions);
  const hasAccounts = accounts.length > 0;
  const total = totalMinorUnits(balances);
  const { income, expenses } = monthTotals(transactions, currentMonthKey());

  return (
    <>
      <PageHeading
        title="Money"
        description="How much you have, where it lives, and where it goes."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total balance"
          value={hasAccounts ? formatMinorUnits(total) : "—"}
          hint={
            hasAccounts
              ? `Across ${accounts.length} account${accounts.length === 1 ? "" : "s"}`
              : "Add an account to get started."
          }
          icon={WalletIcon}
        />
        <StatCard
          label="Income"
          value={hasAccounts ? formatMinorUnits(income) : "—"}
          hint={hasAccounts ? "This month" : "No income recorded yet."}
          icon={TrendingUpIcon}
        />
        <StatCard
          label="Expenses"
          value={hasAccounts ? formatMinorUnits(expenses) : "—"}
          hint={hasAccounts ? "This month" : "No expenses recorded yet."}
          icon={TrendingDownIcon}
        />
      </div>

      <AccountsSection balances={balances} />

      <TransactionsSection
        transactions={transactions.slice(0, RECENT_TRANSACTIONS_LIMIT)}
        accounts={accounts}
        categories={categories}
      />
    </>
  );
}
