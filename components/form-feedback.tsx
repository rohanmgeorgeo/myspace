/**
 * Field-level and form-level feedback shared by the Money forms.
 *
 * Presentational only — no directive needed, it is bundled with whichever
 * client component renders it.
 */

import { AlertCircleIcon } from "lucide-react";

/** Inline field error, falling back to a short hint. */
export function FormFieldFeedback({
  id,
  error,
  hint,
}: {
  id: string;
  error?: string;
  hint?: string;
}) {
  if (error) {
    return (
      <p id={id} role="alert" className="text-xs text-destructive">
        {error}
      </p>
    );
  }

  if (!hint) {
    return null;
  }

  return (
    <p id={id} className="text-xs text-muted-foreground">
      {hint}
    </p>
  );
}

/** Form-level error banner. */
export function FormErrorMessage({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
