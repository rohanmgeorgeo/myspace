import { LandmarkIcon } from "lucide-react";

import { ComingSoonButton } from "@/components/coming-soon-button";
import { EmptyState } from "@/components/empty-state";
import { AccountIcon } from "@/components/money/account-icon";
import { Section } from "@/components/section";
import { formatAccountType, formatMoney } from "@/lib/format";
import type { Account } from "@/lib/supabase/types";

export function AccountsSection({ accounts }: { accounts: Account[] }) {
  return (
    <Section
      title="Accounts"
      description="Where your money is stored — bank, cash, wallet or other."
      action={
        accounts.length > 0 ? <ComingSoonButton label="Add account" /> : null
      }
    >
      {accounts.length === 0 ? (
        <EmptyState
          icon={LandmarkIcon}
          title="No accounts yet"
          description="Add your first account to start tracking how much you have and where it lives."
        >
          <ComingSoonButton label="Add account" variant="outline" />
        </EmptyState>
      ) : (
        <ul className="divide-y divide-border">
          {accounts.map((account) => (
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
              <div className="shrink-0 text-right">
                <p className="text-sm font-medium tabular-nums">
                  {formatMoney(account.starting_balance, account.currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Starting balance
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
