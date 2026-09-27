"use client";

import { Fragment, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";

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

export type FormDialogHelpers = {
  /** Call on success: closes the panel, toasts, and refreshes the route. */
  onCreated: (message: string) => void;
  onCancel: () => void;
};

type ResponsiveFormDialogProps = {
  title: string;
  description: string;
  triggerLabel: string;
  triggerVariant?: React.ComponentProps<typeof Button>["variant"];
  triggerClassName?: string;
  renderForm: (helpers: FormDialogHelpers) => React.ReactNode;
};

/**
 * Trigger button plus the panel that hosts a form.
 *
 * Desktop gets a centred dialog; small screens get a bottom sheet, which is far
 * more comfortable with a keyboard open. The form is remounted on every close
 * so it reopens with empty fields and no stale validation errors.
 */
export function ResponsiveFormDialog({
  title,
  description,
  triggerLabel,
  triggerVariant,
  triggerClassName,
  renderForm,
}: ResponsiveFormDialogProps) {
  const isMobile = useIsMobile();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [formVersion, setFormVersion] = useState(0);

  const close = useCallback(() => {
    setOpen(false);
    setFormVersion((version) => version + 1);
  }, []);

  const handleCreated = useCallback(
    (message: string) => {
      close();
      toast.success(message);
      // Server Components re-render, so the list and the cards update at once.
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
      variant={triggerVariant}
      className={triggerClassName}
      onClick={() => setOpen(true)}
    >
      <PlusIcon />
      {triggerLabel}
    </Button>
  );

  const form = (
    <Fragment key={formVersion}>
      {renderForm({ onCreated: handleCreated, onCancel: close })}
    </Fragment>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetContent side="bottom" className="max-h-[90svh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>{description}</SheetDescription>
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
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {form}
        </DialogContent>
      </Dialog>
    </>
  );
}
