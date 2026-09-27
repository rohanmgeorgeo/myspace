import {
  BanknoteIcon,
  LandmarkIcon,
  SmartphoneIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";

import type { AccountType } from "@/lib/supabase/types";

const ACCOUNT_TYPE_ICONS: Record<AccountType, LucideIcon> = {
  bank: LandmarkIcon,
  cash: BanknoteIcon,
  wallet: SmartphoneIcon,
  other: WalletIcon,
};

export function AccountIcon({
  type,
  className,
}: {
  type: AccountType;
  className?: string;
}) {
  const Icon = ACCOUNT_TYPE_ICONS[type] ?? WalletIcon;

  return <Icon className={className} />;
}
