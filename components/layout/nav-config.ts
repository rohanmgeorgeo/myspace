import {
  HomeIcon,
  SettingsIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

/** Main modules. New modules are added here as they are built. */
export const primaryNav: NavItem[] = [
  { title: "Home", href: "/app", icon: HomeIcon },
  { title: "Money", href: "/app/money", icon: WalletIcon },
];

/** Pinned to the bottom of the sidebar. */
export const secondaryNav: NavItem[] = [
  { title: "Settings", href: "/app/settings", icon: SettingsIcon },
];

const allNavItems = [...primaryNav, ...secondaryNav];

export function isNavItemActive(href: string, pathname: string) {
  if (href === "/app") {
    return pathname === "/app";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getNavTitle(pathname: string) {
  const match = allNavItems.find((item) =>
    isNavItemActive(item.href, pathname),
  );

  return match?.title ?? "MySpace";
}
