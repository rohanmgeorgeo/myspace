"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2Icon } from "lucide-react";

import { FormErrorMessage, FormFieldFeedback } from "@/components/form-feedback";
import { NativeSelect } from "@/components/native-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_CURRENCY, getCurrencySymbol } from "@/lib/format";
import { createAccount } from "@/lib/money/account-actions";
import {
  ACCOUNT_NAME_MAX_LENGTH,
  ACCOUNT_TYPE_OPTIONS,
  initialAccountFormState,
} from "@/lib/money/account-form";
import type { AccountType } from "@/lib/supabase/types";

type AccountFormProps = {
  /** Called once the server confirms the account was created. */
  onCreated: (message: string) => void;
  onCancel: () => void;
};

/**
 * Add-account form.
 *
 * Inputs are controlled so a rejected submission never loses what the user
 * typed. The server action validates everything again and is the only source
 * of truth — these fields are just the UI.
 */
export function AccountForm({ onCreated, onCancel }: AccountFormProps) {
  const [state, formAction, isPending] = useActionState(
    createAccount,
    initialAccountFormState,
  );

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>(ACCOUNT_TYPE_OPTIONS[0].value);
  const [balance, setBalance] = useState("");

  useEffect(() => {
    if (state.status === "success") {
      onCreated(state.message ?? "Account added.");
    }
  }, [state, onCreated]);

  const errors = state.fieldErrors;

  return (
    <form action={formAction} aria-busy={isPending} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="account-name">Account name</Label>
        <Input
          id="account-name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="SBI Bank"
          maxLength={ACCOUNT_NAME_MAX_LENGTH}
          autoComplete="off"
          autoFocus
          aria-invalid={Boolean(errors?.name)}
          aria-describedby="account-name-feedback"
        />
        <FormFieldFeedback
          id="account-name-feedback"
          error={errors?.name}
          hint={`For example SBI Bank, Cash or PhonePe Wallet. Up to ${ACCOUNT_NAME_MAX_LENGTH} characters.`}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="account-type">Account type</Label>
        {/*
          A native select is used on purpose: it always submits the exact enum
          value, and it gives the OS picker on phones.
        */}
        <NativeSelect
          id="account-type"
          name="type"
          value={type}
          onChange={(event) => setType(event.target.value as AccountType)}
          aria-invalid={Boolean(errors?.type)}
          aria-describedby="account-type-feedback"
        >
          {ACCOUNT_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
        <FormFieldFeedback
          id="account-type-feedback"
          error={errors?.type}
          hint="Where this money is kept."
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="account-balance">Current balance</Label>
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground"
          >
            {getCurrencySymbol(DEFAULT_CURRENCY)}
          </span>
          <Input
            id="account-balance"
            name="startingBalance"
            value={balance}
            onChange={(event) => setBalance(event.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            autoComplete="off"
            className="pl-7 tabular-nums"
            aria-invalid={Boolean(errors?.startingBalance)}
            aria-describedby="account-balance-feedback"
          />
        </div>
        <FormFieldFeedback
          id="account-balance-feedback"
          error={errors?.startingBalance}
          hint="What the account holds today. Zero and negative values are allowed."
        />
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">Currency</p>
          <p className="text-xs text-muted-foreground">
            Fixed to {DEFAULT_CURRENCY} for now.
          </p>
        </div>
        <Badge variant="outline">{DEFAULT_CURRENCY}</Badge>
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
          {isPending ? "Adding…" : "Add account"}
        </Button>
      </div>
    </form>
  );
}
