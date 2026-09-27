"use client";

import { Fragment, useActionState, useEffect } from "react";
import {
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";

import { FormErrorMessage } from "@/components/form-feedback";
import {
  RecordSummary,
  RecordSummaryRow,
} from "@/components/money/record-summary";
import { FormDialogPanel } from "@/components/money/responsive-form-dialog";
import { TransactionForm } from "@/components/money/transaction-form";
import { TRANSACTION_META } from "@/components/money/transaction-meta";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActionDialog } from "@/hooks/use-action-dialog";
import { formatDate, formatMoneyValue } from "@/lib/format";
import { deleteTransaction } from "@/lib/money/transaction-actions";
import { initialTransactionFormState } from "@/lib/money/transaction-form";
import type { Account, Category, Transaction } from "@/lib/supabase/types";

type TransactionRowActionsProps = {
  transaction: Transaction;
  accounts: Pick<Account, "id" | "name">[];
  categories: Pick<Category, "id" | "name" | "type">[];
};

/** Per-row actions menu: edit the transaction, or delete it behind a confirm. */
export function TransactionRowActions({
  transaction,
  accounts,
  categories,
}: TransactionRowActionsProps) {
  const editDialog = useActionDialog();
  const deleteDialog = useActionDialog();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Transaction actions"
          >
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
        title="Edit transaction"
        description="Adjust the details and save. Balances update straight away."
      >
        <Fragment key={editDialog.version}>
          <TransactionForm
            transaction={transaction}
            accounts={accounts}
            categories={categories}
            onCreated={editDialog.notifySuccess}
            onCancel={editDialog.close}
          />
        </Fragment>
      </FormDialogPanel>

      <FormDialogPanel
        open={deleteDialog.open}
        onOpenChange={deleteDialog.handleOpenChange}
        title="Delete this transaction?"
        description="It is removed from your history and your balances are recalculated. This cannot be undone."
      >
        <Fragment key={deleteDialog.version}>
          <DeleteTransactionConfirm
            transaction={transaction}
            accounts={accounts}
            categories={categories}
            onDeleted={deleteDialog.notifySuccess}
            onCancel={deleteDialog.close}
          />
        </Fragment>
      </FormDialogPanel>
    </>
  );
}

/** Shows exactly what is going, so the confirmation is never a guess. */
function DeleteTransactionConfirm({
  transaction,
  accounts,
  categories,
  onDeleted,
  onCancel,
}: {
  transaction: Transaction;
  accounts: Pick<Account, "id" | "name">[];
  categories: Pick<Category, "id" | "name" | "type">[];
  onDeleted: (message: string) => void;
  onCancel: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    deleteTransaction,
    initialTransactionFormState,
  );

  useEffect(() => {
    if (state.status === "success") {
      onDeleted(state.message ?? "Transaction deleted.");
    }
  }, [state, onDeleted]);

  const meta = TRANSACTION_META[transaction.type];

  const accountName =
    accounts.find((account) => account.id === transaction.account_id)?.name ??
    null;
  const destinationName = transaction.transfer_account_id
    ? (accounts.find(
        (account) => account.id === transaction.transfer_account_id,
      )?.name ?? null)
    : null;
  const categoryName = transaction.category_id
    ? (categories.find(
        (category) => category.id === transaction.category_id,
      )?.name ?? null)
    : null;

  return (
    <form action={formAction} className="grid gap-5">
      {/* The id is validated on the server; ownership is enforced by RLS. */}
      <input type="hidden" name="id" value={transaction.id} />

      <RecordSummary>
        <RecordSummaryRow label="Type" value={meta.label} />
        <RecordSummaryRow
          label="Amount"
          value={`${meta.prefix}${formatMoneyValue(transaction.amount)}`}
        />
        <RecordSummaryRow
          label={transaction.type === "transfer" ? "Route" : "Account"}
          value={
            transaction.type === "transfer"
              ? [accountName, destinationName].filter(Boolean).join(" → ")
              : accountName
          }
        />
        <RecordSummaryRow label="Category" value={categoryName} />
        <RecordSummaryRow
          label="Date"
          value={formatDate(transaction.transaction_date)}
        />
        <RecordSummaryRow
          label="Note"
          value={transaction.description?.trim()}
        />
      </RecordSummary>

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
          Cancel
        </Button>
        <Button type="submit" variant="destructive" disabled={isPending}>
          {isPending ? <Loader2Icon className="animate-spin" /> : null}
          {isPending ? "Deleting…" : "Delete transaction"}
        </Button>
      </div>
    </form>
  );
}
