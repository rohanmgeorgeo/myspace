import type { Metadata } from "next";

import { PageHeading } from "@/components/page-heading";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDisplayName } from "@/lib/auth/display-name";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  return (
    <>
      <PageHeading
        title="Settings"
        description="Your account and how MySpace looks."
      />

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Profile</CardTitle>
          <CardDescription>Information tied to your account.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <Field label="Name" value={getDisplayName(user, profile)} />
          <Field label="Email" value={user?.email ?? "—"} />
          <Field label="User ID" value={user?.id ?? "—"} mono />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Light or dark — it follows your system by default.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground">
                Switch between light and dark mode.
              </p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        More settings will arrive alongside the next modules.
      </p>
    </>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <p className="shrink-0 text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "truncate text-sm font-medium",
          mono && "font-mono text-xs",
        )}
      >
        {value}
      </p>
    </div>
  );
}
