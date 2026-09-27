"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Open/close state for a dialog that hosts a server action.
 *
 * Closing bumps a version so the hosted form remounts with fresh values, and
 * `notifySuccess` closes the dialog, toasts, and refreshes the route so derived
 * balances and totals update immediately.
 */
export function useActionDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState(0);

  const close = useCallback(() => {
    setOpen(false);
    setVersion((current) => current + 1);
  }, []);

  const openDialog = useCallback(() => setOpen(true), []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        setOpen(true);
        return;
      }

      close();
    },
    [close],
  );

  const notifySuccess = useCallback(
    (message: string) => {
      close();
      if (message) {
        toast.success(message);
      }
      router.refresh();
    },
    [close, router],
  );

  return { open, version, openDialog, close, handleOpenChange, notifySuccess };
}
