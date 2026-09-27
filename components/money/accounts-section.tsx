import { LandmarkIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { AccountIcon } from "@/components/money/account-icon";
import { AccountRowActions } from "@/components/money/account-row-actions";
import { AddAccountDialog } from "@/components/money/add-account-dialog";
import { Section } from "@/components/section";
import { formatAccountType, formatMinorUnits } from "@/lib/format";
import type { AccountBalance } from "@/lib/money/balances";
import type { Transaction } from "@/lib/supabase/types";

type AccountsSectionProps = {
  balances: AccountBalance[];
  /** Only used to tell whether an account can be deleted safely. */
  transactions: Transaction[];
};

export function AccountsSection({
  balances,
  transactions,
}: AccountsSectionProps) {
  const referencedAccountIds = new Set<string>();
  for (const transaction of transactions) {
    referencedAccountIds.add(transaction.account_id);
    if (transaction.transfer_account_id) {
      referencedAccountIds.add(transaction.transfer_account_id);
    }
  }

  return (
    <Section
      title="Accounts"
      description="Where your money is stored — bank, cash, wallet or other."
      action={balances.length > 0 ? <AddAccountDialog /> : null}
    >
      {balances.length === 0 ? (
        <EmptyState
          icon={LandmarkIcon}
          title="No accounts yet"
          description="Add your first account to start tracking how much you have and where it lives."
        >
          <AddAccountDialog variant="outline" />
        </EmptyState>
      ) : (
        <ul className="divide-y divide-border">
          {balances.map(({ account, minorUnits }) => (
            <li
              key={account.id}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <AccountIcon type={account.type} className="size-4" />
                </span>
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-sm font-medium">{account.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatAccountType(account.type)} · {account.currency}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-medium tabular-nums">
                    {formatMinorUnits(minorUnits, account.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Current balance
                  </p>
                </div>
                <AccountRowActions
                  account={account}
                  minorUnits={minorUnits}
                  hasTransactions={referencedAccountIds.has(account.id)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
