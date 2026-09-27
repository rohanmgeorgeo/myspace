"use client";

import { usePathname } from "next/navigation";

import { getNavTitle } from "@/components/layout/nav-config";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-sm sm:px-4">
      <SidebarTrigger />
      <div aria-hidden className="mx-1 h-5 w-px bg-border" />
      <h1 className="truncate text-sm font-medium">{getNavTitle(pathname)}</h1>
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
      </div>
    </header>
  );
}
