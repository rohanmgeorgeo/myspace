"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2Icon } from "lucide-react";

import { FormErrorMessage, FormFieldFeedback } from "@/components/form-feedback";
import { TRANSACTION_META } from "@/components/money/transaction-meta";
import { NativeSelect } from "@/components/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_CURRENCY, getCurrencySymbol } from "@/lib/format";
import { createTransaction } from "@/lib/money/transaction-actions";
import {
  CATEGORY_NAME_MAX_LENGTH,
  TRANSACTION_DESCRIPTION_MAX_LENGTH,
  initialTransactionFormState,
} from "@/lib/money/transaction-form";
import type { Account, Category, TransactionType } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type TransactionFormProps = {
  accounts: Pick<Account, "id" | "name">[];
  categories: Pick<Category, "id" | "name" | "type">[];
  onCreated: (message: string) => void;
  onCancel: () => void;
};

/** Expense / Income / Transfer, in the order people expect to see them. */
const TYPE_ORDER: TransactionType[] = ["expense", "income", "transfer"];

const CURRENCY_SYMBOL = getCurrencySymbol(DEFAULT_CURRENCY);

function todayAsLocalDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Add-transaction form.
 *
 * Inputs are controlled so a rejected submission keeps what the user typed, and
 * the server action validates everything again — this is only the UI.
 */
export function TransactionForm({
  accounts,
  categories,
  onCreated,
  onCancel,
}: TransactionFormProps) {
  const [state, formAction, isPending] = useActionState(
    createTransaction,
    initialTransactionFormState,
  );

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [transferAccountId, setTransferAccountId] = useState(
    () => accounts.find((account) => account.id !== accounts[0]?.id)?.id ?? "",
  );
  const [category, setCategory] = useState("");
  const [transactionDate, setTransactionDate] = useState(todayAsLocalDate);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (state.status === "success") {
      onCreated(state.message ?? "Transaction added.");
    }
  }, [state, onCreated]);

  const errors = state.fieldErrors;
  const isTransfer = type === "transfer";
  const transferOptions = accounts.filter(
    (account) => account.id !== accountId,
  );
  const knownCategories = categories.filter((option) => option.type === type);

  return (
    <form action={formAction} aria-busy={isPending} className="grid gap-5">
      <div className="grid gap-2">
        <span className="text-sm leading-none font-medium">Type</span>
        <div
          role="tablist"
          aria-label="Transaction type"
          className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-muted/40 p-1"
        >
          {TYPE_ORDER.map((option) => {
            const meta = TRANSACTION_META[option];
            const Icon = meta.icon;
            const isActive = type === option;

            return (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setType(option)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {meta.label}
              </button>
            );
          })}
        </div>
        {/* The switch is made of buttons, so the value needs submitting. */}
        <input type="hidden" name="type" value={type} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="transaction-amount">Amount</Label>
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground"
          >
            {CURRENCY_SYMBOL}
          </span>
          <Input
            id="transaction-amount"
            name="amount"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            autoComplete="off"
            autoFocus
            className="pl-7 tabular-nums"
            aria-invalid={Boolean(errors?.amount)}
            aria-describedby="transaction-amount-feedback"
          />
        </div>
        <FormFieldFeedback
          id="transaction-amount-feedback"
          error={errors?.amount}
          hint="Always positive — the type decides the direction."
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="transaction-account">
          {isTransfer ? "From account" : "Account"}
        </Label>
        <NativeSelect
          id="transaction-account"
          name="accountId"
          value={accountId}
          onChange={(event) => {
            const next = event.target.value;
            setAccountId(next);
            if (transferAccountId === next) {
              setTransferAccountId(
                accounts.find((account) => account.id !== next)?.id ?? "",
              );
            }
          }}
          aria-invalid={Boolean(errors?.accountId)}
          aria-describedby="transaction-account-feedback"
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </NativeSelect>
        <FormFieldFeedback
          id="transaction-account-feedback"
          error={errors?.accountId}
          hint={isTransfer ? "The account the money leaves." : undefined}
        />
      </div>

      {isTransfer ? (
        <div className="grid gap-2">
          <Label htmlFor="transaction-destination">To account</Label>
          <NativeSelect
            id="transaction-destination"
            name="transferAccountId"
            value={transferAccountId}
            onChange={(event) => setTransferAccountId(event.target.value)}
            aria-invalid={Boolean(errors?.transferAccountId)}
            aria-describedby="transaction-destination-feedback"
          >
            <option value="">Choose an account</option>
            {transferOptions.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </NativeSelect>
          <FormFieldFeedback
            id="transaction-destination-feedback"
            error={errors?.transferAccountId}
            hint={
              transferOptions.length === 0
                ? "Add a second account first — a transfer needs two."
                : "The account the money arrives in."
            }
          />
        </div>
      ) : null}

      {!isTransfer ? (
        <div className="grid gap-2">
          <Label htmlFor="transaction-category">Category</Label>
          <Input
            id="transaction-category"
            name="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Food"
            maxLength={CATEGORY_NAME_MAX_LENGTH}
            autoComplete="off"
            list="transaction-category-options"
            aria-invalid={Boolean(errors?.category)}
            aria-describedby="transaction-category-feedback"
          />
          <datalist id="transaction-category-options">
            {knownCategories.map((option) => (
              <option key={option.id} value={option.name} />
            ))}
          </datalist>
          {knownCategories.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {knownCategories.map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCategory(option.name)}
                >
                  {option.name}
                </Button>
              ))}
            </div>
          ) : null}
          <FormFieldFeedback
            id="transaction-category-feedback"
            error={errors?.category}
            hint="An existing name is reused; a new one is created for you."
          />
        </div>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="transaction-date">Date</Label>
        <Input
          id="transaction-date"
          name="transactionDate"
          type="date"
          value={transactionDate}
          onChange={(event) => setTransactionDate(event.target.value)}
          aria-invalid={Boolean(errors?.transactionDate)}
          aria-describedby="transaction-date-feedback"
        />
        <FormFieldFeedback
          id="transaction-date-feedback"
          error={errors?.transactionDate}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="transaction-description">
          Note
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="transaction-description"
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What was this for?"
          maxLength={TRANSACTION_DESCRIPTION_MAX_LENGTH}
          autoComplete="off"
          aria-invalid={Boolean(errors?.description)}
          aria-describedby="transaction-description-feedback"
        />
        <FormFieldFeedback
          id="transaction-description-feedback"
          error={errors?.description}
        />
      </div>

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
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2Icon className="animate-spin" /> : null}
          {isPending ? "Adding…" : "Add transaction"}
        </Button>
      </div>
    </form>
  );
}

