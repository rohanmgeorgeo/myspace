"use client";

import { useState } from "react";
import { LogInIcon, UserPlusIcon } from "lucide-react";

import { CredentialsForm } from "@/components/auth/credentials-form";
import { cn } from "@/lib/utils";

export type AuthMode = "signin" | "signup";

const MODES: { value: AuthMode; label: string; icon: typeof LogInIcon }[] = [
  { value: "signin", label: "Sign in", icon: LogInIcon },
  { value: "signup", label: "Sign up", icon: UserPlusIcon },
];

/** Sign-in / sign-up switcher that hosts a single credentials form. */
export function AuthForm({ nextPath }: { nextPath?: string }) {
  const [mode, setMode] = useState<AuthMode>("signin");

  return (
    <div className="grid gap-6">
      <div
        role="tablist"
        aria-label="Authentication mode"
        className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/40 p-1"
      >
        {MODES.map(({ value, label, icon: Icon }) => {
          const isActive = mode === value;

          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setMode(value)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          );
        })}
      </div>

      <CredentialsForm key={mode} mode={mode} nextPath={nextPath} />
    </div>
  );
}
