"use client";

import { AccountForm } from "@/components/money/account-form";
import { ResponsiveFormDialog } from "@/components/money/responsive-form-dialog";
import type { Button } from "@/components/ui/button";

type AddAccountDialogProps = {
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
};

/** Working "Add account" flow built on the shared responsive form dialog. */
export function AddAccountDialog({ variant, className }: AddAccountDialogProps) {
  return (
    <ResponsiveFormDialog
      title="Add account"
      description="Track an account you own — bank, cash, wallet or other."
      triggerLabel="Add account"
      triggerVariant={variant}
      triggerClassName={className}
      renderForm={({ onCreated, onCancel }) => (
        <AccountForm onCreated={onCreated} onCancel={onCancel} />
      )}
    />
  );
}
