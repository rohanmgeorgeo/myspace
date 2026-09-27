import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getDisplayName } from "@/lib/auth/display-name";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/session";

/**
 * Protected area. The proxy already redirects signed-out visitors, but we
 * check again here so the data-loading code below can rely on a real user.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();

  return (
    <AppShell
      displayName={getDisplayName(user, profile)}
      email={user.email ?? ""}
    >
      {children}
    </AppShell>
  );
}
