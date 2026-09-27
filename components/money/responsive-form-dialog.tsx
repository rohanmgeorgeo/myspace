"use client";

import { Fragment } from "react";
import { PlusIcon } from "lucide-react";

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
import { useActionDialog } from "@/hooks/use-action-dialog";
import { useIsMobile } from "@/hooks/use-mobile";

export type FormDialogHelpers = {
  /** Call on success: closes the panel, toasts, and refreshes the route. */
  onCreated: (message: string) => void;
  onCancel: () => void;
};

type FormDialogPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
};

/**
 * The panel itself, without a trigger.
 *
 * Desktop gets a centred dialog; small screens get a bottom sheet, which is far
 * more comfortable with a keyboard open. Callers own the trigger — which lets a
 * row action menu open the same panel.
 */
export function FormDialogPanel({
  open,
  onOpenChange,
  title,
  description,
  children,
}: FormDialogPanelProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[90svh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-8">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

type ResponsiveFormDialogProps = {
  title: string;
  description: string;
  triggerLabel: string;
  triggerVariant?: React.ComponentProps<typeof Button>["variant"];
  triggerClassName?: string;
  renderForm: (helpers: FormDialogHelpers) => React.ReactNode;
};

/**
 * Trigger button plus the panel that hosts an "add" form.
 *
 * The form is remounted on every close so it reopens with empty fields and no
 * stale validation errors.
 */
export function ResponsiveFormDialog({
  title,
  description,
  triggerLabel,
  triggerVariant,
  triggerClassName,
  renderForm,
}: ResponsiveFormDialogProps) {
  const dialog = useActionDialog();

  return (
    <>
      <Button
        type="button"
        variant={triggerVariant}
        className={triggerClassName}
        onClick={dialog.openDialog}
      >
        <PlusIcon />
        {triggerLabel}
      </Button>

      <FormDialogPanel
        open={dialog.open}
        onOpenChange={dialog.handleOpenChange}
        title={title}
        description={description}
      >
        <Fragment key={dialog.version}>
          {renderForm({
            onCreated: dialog.notifySuccess,
            onCancel: dialog.close,
          })}
        </Fragment>
      </FormDialogPanel>
    </>
  );
}
