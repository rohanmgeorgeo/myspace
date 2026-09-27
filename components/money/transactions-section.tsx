import { ReceiptTextIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { AddTransactionDialog } from "@/components/money/add-transaction-dialog";
import { TRANSACTION_META } from "@/components/money/transaction-meta";
import { Section } from "@/components/section";
import { formatDate, formatMoneyValue } from "@/lib/format";
import type { Account, Category, Transaction } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type TransactionsSectionProps = {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
};

export function TransactionsSection({
  transactions,
  accounts,
  categories,
}: TransactionsSectionProps) {
  const accountsById = new Map(accounts.map((account) => [account.id, account]));
  const categoryNamesById = new Map(
    categories.map((category) => [category.id, category.name]),
  );

  // Only the fields the dialog needs, so the client payload stays small.
  const dialogAccounts = accounts.map(({ id, name }) => ({ id, name }));
  const dialogCategories = categories.map(({ id, name, type }) => ({
    id,
    name,
    type,
  }));

  return (
    <Section
      title="Recent transactions"
      description="The latest money movements across your accounts."
      action={
        accounts.length > 0 ? (
          <AddTransactionDialog
            accounts={dialogAccounts}
            categories={dialogCategories}
          />
        ) : null
      }
    >
      {transactions.length === 0 ? (
        <EmptyState
          icon={ReceiptTextIcon}
          title="No transactions yet"
          description={
            accounts.length === 0
              ? "Add an account first — every transaction belongs to one."
              : "Income, spending and transfers between your own accounts will appear here."
          }
        >
          {accounts.length > 0 ? (
            <AddTransactionDialog
              accounts={dialogAccounts}
              categories={dialogCategories}
              variant="outline"
            />
          ) : null}
        </EmptyState>
      ) : (
        <ul className="divide-y divide-border">
          {transactions.map((transaction) => (
            <li key={transaction.id}>
              <TransactionRow
                transaction={transaction}
                account={accountsById.get(transaction.account_id) ?? null}
                destination={
                  transaction.transfer_account_id
                    ? (accountsById.get(transaction.transfer_account_id) ?? null)
                    : null
                }
                categoryName={
                  transaction.category_id
                    ? (categoryNamesById.get(transaction.category_id) ?? null)
                    : null
                }
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
  destination,
  categoryName,
}: {
  transaction: Transaction;
  account: Account | null;
  destination: Account | null;
  categoryName: string | null;
}) {
  const meta = TRANSACTION_META[transaction.type];
  const Icon = meta.icon;

  const title = transaction.description?.trim() || categoryName || meta.label;

  const accountLabel =
    transaction.type === "transfer"
      ? [account?.name, destination?.name].filter(Boolean).join(" → ")
      : account?.name;

  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-3.5" />
        </span>
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {[accountLabel, formatDate(transaction.transaction_date)]
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
        {formatMoneyValue(transaction.amount, account?.currency)}
      </p>
    </div>
  );
}
