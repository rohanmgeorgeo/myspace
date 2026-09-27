import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Styled native `<select>`.
 *
 * Used instead of a custom listbox on purpose: it always submits the exact
 * value with the form, and it gives the operating system's picker on phones.
 */
export function NativeSelect({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-8 w-full min-w-0 appearance-none rounded-lg border border-input bg-transparent py-1 pr-8 pl-2.5 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 [&>option]:bg-background [&>option]:text-foreground",
          className,
        )}
        {...props}
      />
      <ChevronDownIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
