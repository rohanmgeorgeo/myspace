"use client";

import { PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type ComingSoonButtonProps = {
  label: string;
  /** Extra context for the toast. */
  hint?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
};

/**
 * Placeholder action for flows that are not built yet. Deliberately explains
 * itself instead of silently doing nothing.
 *
 * The icon lives inside this file on purpose: a component cannot be serialised
 * from a server component into a client component.
 */
export function ComingSoonButton({
  label,
  hint,
  variant = "default",
  size,
  className,
}: ComingSoonButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={() =>
        toast.info(
          `${label} is coming soon`,
          hint ? { description: hint } : undefined,
        )
      }
    >
      <PlusIcon />
      {label}
    </Button>
  );
}
