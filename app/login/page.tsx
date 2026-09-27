import type { Metadata } from "next";
import {
  NotebookPenIcon,
  SparklesIcon,
  TargetIcon,
  WalletIcon,
} from "lucide-react";

import { AuthForm } from "@/components/auth/auth-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { sanitizeNextPath } from "@/lib/auth/form-state";

export const metadata: Metadata = {
  title: "Sign in",
};

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const highlights = [
  { icon: WalletIcon, title: "Money", body: "Accounts, income and spending." },
  { icon: TargetIcon, title: "Goals", body: "Plans that stay visible." },
  { icon: NotebookPenIcon, title: "More to come", body: "Boards, notes and habits." },
];

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = sanitizeNextPath(
    typeof params.next === "string" ? params.next : undefined,
  );

  return (
    <div className="relative flex min-h-svh flex-col lg:grid lg:grid-cols-2">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <aside className="relative hidden overflow-hidden border-r border-border bg-muted/30 p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-foreground/5 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -bottom-32 size-96 rounded-full bg-foreground/5 blur-3xl"
        />

        <div className="relative flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <SparklesIcon className="size-4" />
          </span>
          <span className="text-lg font-semibold tracking-tight">MySpace</span>
        </div>

        <div className="relative max-w-md space-y-10">
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-balance xl:text-5xl">
              Your personal space, kept simple.
            </h1>
            <p className="text-base text-muted-foreground">
              Money first — then goals, boards, notes and habits. One quiet
              dashboard instead of ten scattered apps.
            </p>
          </div>

          <ul className="space-y-4">
            {highlights.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                  <Icon className="size-4" />
                </span>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-muted-foreground">
          Your data is private to your account.
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-5 py-14 sm:px-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex items-center gap-2.5 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <SparklesIcon className="size-4" />
            </span>
            <span className="text-lg font-semibold tracking-tight">MySpace</span>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h2>
            <p className="text-sm text-muted-foreground">
              Sign in to your space, or create an account in seconds.
            </p>
          </div>

          <AuthForm nextPath={nextPath} />
        </div>
      </main>
    </div>
  );
}
