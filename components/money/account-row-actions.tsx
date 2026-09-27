"use client";

import { Fragment, useActionState, useEffect } from "react";
import {
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";

import { FormErrorMessage } from "@/components/form-feedback";
import { AccountForm } from "@/components/money/account-form";
import {
  RecordSummary,
  RecordSummaryRow,
} from "@/components/money/record-summary";
import { FormDialogPanel } from "@/components/money/responsive-form-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActionDialog } from "@/hooks/use-action-dialog";
import { formatAccountType, formatMinorUnits } from "@/lib/format";
import { deleteAccount } from "@/lib/money/account-actions";
import {
  ACCOUNT_HAS_TRANSACTIONS_MESSAGE,
  initialAccountFormState,
} from "@/lib/money/account-form";
import type { Account } from "@/lib/supabase/types";

type AccountRowActionsProps = {
  account: Account;
  /** Current balance in minor units, shown in the delete confirmation. */
  minorUnits: number;
  /** True when a transaction references this account, as source or destination. */
  hasTransactions: boolean;
};

/** Per-row actions menu: edit the account, or delete it behind a confirm. */
export function AccountRowActions({
  account,
  minorUnits,
  hasTransactions,
}: AccountRowActionsProps) {
  const editDialog = useActionDialog();
  const deleteDialog = useActionDialog();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Account actions">
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={editDialog.openDialog}>
            <PencilIcon />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={deleteDialog.openDialog}
          >
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <FormDialogPanel
        open={editDialog.open}
        onOpenChange={editDialog.handleOpenChange}
        title="Edit account"
        description="Rename it, change its type, or correct the opening balance."
      >
        <Fragment key={editDialog.version}>
          <AccountForm
            account={account}
            onCreated={editDialog.notifySuccess}
            onCancel={editDialog.close}
          />
        </Fragment>
      </FormDialogPanel>

      <FormDialogPanel
        open={deleteDialog.open}
        onOpenChange={deleteDialog.handleOpenChange}
        title="Delete this account?"
        description="Transactions are never deleted with an account."
      >
        <Fragment key={deleteDialog.version}>
          <DeleteAccountConfirm
            account={account}
            minorUnits={minorUnits}
            hasTransactions={hasTransactions}
            onDeleted={deleteDialog.notifySuccess}
            onCancel={deleteDialog.close}
          />
        </Fragment>
      </FormDialogPanel>
    </>
  );
}

/**
 * Confirms deletion and explains the blocking rule up front when transactions
 * still reference the account. The server enforces the same rule.
 */
function DeleteAccountConfirm({
  account,
  minorUnits,
  hasTransactions,
  onDeleted,
  onCancel,
}: {
  account: Account;
  minorUnits: number;
  hasTransactions: boolean;
  onDeleted: (message: string) => void;
  onCancel: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    deleteAccount,
    initialAccountFormState,
  );

  useEffect(() => {
    if (state.status === "success") {
      onDeleted(state.message ?? "Account deleted.");
    }
  }, [state, onDeleted]);

  return (
    <form action={formAction} className="grid gap-5">
      {/* The id is validated on the server; ownership is enforced by RLS. */}
      <input type="hidden" name="id" value={account.id} />

      <RecordSummary>
        <RecordSummaryRow label="Account" value={account.name} />
        <RecordSummaryRow
          label="Type"
          value={formatAccountType(account.type)}
        />
        <RecordSummaryRow
          label="Current balance"
          value={formatMinorUnits(minorUnits, account.currency)}
        />
      </RecordSummary>

      {hasTransactions ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {ACCOUNT_HAS_TRANSACTIONS_MESSAGE}
        </p>
      ) : null}

      <FormErrorMessage
        message={state.status === "error" ? state.message : undefined}
      />

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          {hasTransactions ? "Close" : "Cancel"}
        </Button>
        {hasTransactions ? null : (
          <Button type="submit" variant="destructive" disabled={isPending}>
            {isPending ? <Loader2Icon className="animate-spin" /> : null}
            {isPending ? "Deleting…" : "Delete account"}
          </Button>
        )}
      </div>
    </form>
  );
}
