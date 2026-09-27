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
import { getRecentTransactions } from "@/lib/data/transactions";

export const metadata: Metadata = {
  title: "Money",
};

export default async function MoneyPage() {
  const [accounts, transactions] = await Promise.all([
    getAccounts(),
    getRecentTransactions(),
  ]);

  return (
    <>
      <PageHeading
        title="Money"
        description="How much you have, where it lives, and where it goes."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total balance"
          value="—"
          hint="Available once accounts are added."
          icon={WalletIcon}
        />
        <StatCard
          label="Income"
          value="—"
          hint="No income recorded yet."
          icon={TrendingUpIcon}
        />
        <StatCard
          label="Expenses"
          value="—"
          hint="No expenses recorded yet."
          icon={TrendingDownIcon}
        />
      </div>

      <AccountsSection accounts={accounts} />

      <TransactionsSection
        transactions={transactions}
        accounts={accounts}
      />
    </>
  );
}
