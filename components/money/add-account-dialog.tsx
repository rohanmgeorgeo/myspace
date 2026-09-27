"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { AccountForm } from "@/components/money/account-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const TITLE = "Add account";
const DESCRIPTION =
  "Track an account you own — bank, cash, wallet or other.";

type AddAccountDialogProps = {
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
};

/**
 * "Add account" trigger plus the form host.
 *
 * Desktop gets a centred dialog; small screens get a bottom sheet, which is
 * far more comfortable with a keyboard open.
 */
export function AddAccountDialog({ variant, className }: AddAccountDialogProps) {
  const isMobile = useIsMobile();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  // Bumped on every close so the form remounts with empty fields and no
  // leftover validation errors the next time it opens.
  const [formVersion, setFormVersion] = useState(0);

  const close = useCallback(() => {
    setOpen(false);
    setFormVersion((version) => version + 1);
  }, []);

  const handleCreated = useCallback(
    (message: string) => {
      close();
      toast.success(message);
      // Server Components re-render, so the new account appears immediately.
      router.refresh();
    },
    [close, router],
  );

  function handleOpenChange(next: boolean) {
    if (next) {
      setOpen(true);
      return;
    }

    close();
  }

  const trigger = (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={() => setOpen(true)}
    >
      <PlusIcon />
      {TITLE}
    </Button>
  );

  const form = (
    <AccountForm
      key={formVersion}
      onCreated={handleCreated}
      onCancel={close}
    />
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetContent side="bottom" className="max-h-[90svh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{TITLE}</SheetTitle>
              <SheetDescription>{DESCRIPTION}</SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-8">{form}</div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{TITLE}</DialogTitle>
            <DialogDescription>{DESCRIPTION}</DialogDescription>
          </DialogHeader>
          {form}
        </DialogContent>
      </Dialog>
    </>
  );
}
