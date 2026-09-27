import { ReceiptTextIcon } from "lucide-react";

import { ComingSoonButton } from "@/components/coming-soon-button";
import { EmptyState } from "@/components/empty-state";
import { TRANSACTION_META } from "@/components/money/transaction-meta";
import { Section } from "@/components/section";
import { formatDate, formatMoney } from "@/lib/format";
import type { Account, Transaction } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type TransactionsSectionProps = {
  transactions: Transaction[];
  accounts: Account[];
};

export function TransactionsSection({
  transactions,
  accounts,
}: TransactionsSectionProps) {
  const accountsById = new Map(accounts.map((account) => [account.id, account]));

  return (
    <Section
      title="Recent transactions"
      description="The latest money movements across your accounts."
      action={
        transactions.length > 0 ? (
          <ComingSoonButton label="Add transaction" />
        ) : null
      }
    >
      {transactions.length === 0 ? (
        <EmptyState
          icon={ReceiptTextIcon}
          title="No transactions yet"
          description="Income, spending and transfers between your own accounts will appear here."
        >
          <ComingSoonButton label="Add transaction" variant="outline" />
        </EmptyState>
      ) : (
        <ul className="divide-y divide-border">
          {transactions.map((transaction) => (
            <li key={transaction.id}>
              <TransactionRow
                transaction={transaction}
                account={accountsById.get(transaction.account_id) ?? null}
              />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function TransactionRow({
  transaction,
  account,
}: {
  transaction: Transaction;
  account: Account | null;
}) {
  const meta = TRANSACTION_META[transaction.type];
  const Icon = meta.icon;

  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-3.5" />
        </span>
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-sm font-medium">
            {transaction.description?.trim() || meta.label}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {[account?.name, formatDate(transaction.transaction_date)]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>
      <p
        className={cn(
          "shrink-0 text-sm font-medium tabular-nums",
          meta.amountClassName,
        )}
      >
        {meta.prefix}
        {formatMoney(transaction.amount, account?.currency ?? "USD")}
      </p>
    </div>
  );
}
