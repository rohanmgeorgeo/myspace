import {
  ArrowLeftRightIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  type LucideIcon,
} from "lucide-react";

import type { TransactionType } from "@/lib/supabase/types";

export type TransactionMeta = {
  label: string;
  icon: LucideIcon;
  /** Prefix shown before the formatted amount. */
  prefix: string;
  amountClassName: string;
};

/**
 * Presentation metadata per transaction type.
 *
 * A transfer is intentionally neutral: it moves money between the user's own
 * accounts, so it must never read as income or spending.
 */
export const TRANSACTION_META: Record<TransactionType, TransactionMeta> = {
  income: {
    label: "Income",
    icon: TrendingUpIcon,
    prefix: "+",
    amountClassName: "text-emerald-600 dark:text-emerald-400",
  },
  expense: {
    label: "Expense",
    icon: TrendingDownIcon,
    prefix: "−",
    amountClassName: "text-foreground",
  },
  transfer: {
    label: "Transfer",
    icon: ArrowLeftRightIcon,
    prefix: "",
    amountClassName: "text-muted-foreground",
  },
};
