import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type AppShellProps = {
  displayName: string;
  email: string;
  children: React.ReactNode;
};

/** Sidebar + header + content area used by every `/app` route. */
export function AppShell({ displayName, email, children }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar displayName={displayName} email={email} />
      <SidebarInset>
        <AppHeader />
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
