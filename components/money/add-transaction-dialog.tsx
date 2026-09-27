"use client";

import { TransactionForm } from "@/components/money/transaction-form";
import { ResponsiveFormDialog } from "@/components/money/responsive-form-dialog";
import type { Button } from "@/components/ui/button";
import type { Account, Category } from "@/lib/supabase/types";

type AddTransactionDialogProps = {
  accounts: Pick<Account, "id" | "name">[];
  categories: Pick<Category, "id" | "name" | "type">[];
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
};

/** Working "Add transaction" flow built on the shared responsive dialog. */
export function AddTransactionDialog({
  accounts,
  categories,
  variant,
  className,
}: AddTransactionDialogProps) {
  return (
    <ResponsiveFormDialog
      title="Add transaction"
      description="Record spending, income, or a move between your own accounts."
      triggerLabel="Add transaction"
      triggerVariant={variant}
      triggerClassName={className}
      renderForm={({ onCreated, onCancel }) => (
        <TransactionForm
          accounts={accounts}
          categories={categories}
          onCreated={onCreated}
          onCancel={onCancel}
        />
      )}
    />
  );
}
