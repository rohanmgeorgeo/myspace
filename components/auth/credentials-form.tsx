"use client";

import { useActionState } from "react";
import { AlertCircleIcon, CheckCircle2Icon, Loader2Icon } from "lucide-react";

import type { AuthMode } from "@/components/auth/auth-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp } from "@/lib/auth/actions";
import { initialAuthState, type AuthFormState } from "@/lib/auth/form-state";
import { cn } from "@/lib/utils";

type CredentialsFormProps = {
  mode: AuthMode;
  nextPath?: string;
};

/**
 * One form used for both modes — they differ only by the extra name field and
 * the server action being called.
 */
export function CredentialsForm({ mode, nextPath }: CredentialsFormProps) {
  const isSignUp = mode === "signup";
  const [state, formAction, isPending] = useActionState(
    isSignUp ? signUp : signIn,
    initialAuthState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="next" value={nextPath ?? ""} />

      {isSignUp ? (
        <div className="grid gap-2">
          <Label htmlFor="displayName">Name</Label>
          <Input
            id="displayName"
            name="displayName"
            autoComplete="name"
            placeholder="How should we greet you?"
            autoFocus
          />
        </div>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          autoFocus={!isSignUp}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          placeholder="••••••••"
          required
          minLength={isSignUp ? 6 : undefined}
        />
      </div>

      <AuthMessage state={state} />

      <Button
        type="submit"
        size="lg"
        className="mt-1 h-10 w-full"
        disabled={isPending}
      >
        {isPending ? <Loader2Icon className="animate-spin" /> : null}
        {isPending ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
      </Button>
    </form>
  );
}

function AuthMessage({ state }: { state: AuthFormState }) {
  if (!state.message) {
    return null;
  }

  const isError = state.status === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
        isError
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-border bg-muted/50 text-muted-foreground",
      )}
    >
      {isError ? (
        <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
      ) : (
        <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" />
      )}
      <span>{state.message}</span>
    </div>
  );
}
