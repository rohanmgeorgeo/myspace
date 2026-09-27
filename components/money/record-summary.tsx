/** Label/value rows used to confirm exactly what is about to be deleted. */
export function RecordSummary({ children }: { children: React.ReactNode }) {
  return (
    <dl className="grid gap-2 rounded-lg border border-border bg-muted/40 px-3 py-3">
      {children}
    </dl>
  );
}

export function RecordSummaryRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) {
    return null;
  }

  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-sm font-medium">{value}</dd>
    </div>
  );
}
