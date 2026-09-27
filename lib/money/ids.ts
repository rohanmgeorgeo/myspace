/**
 * Record ids come from hidden form fields, so they are validated before use.
 * Ownership is never inferred from an id — RLS and explicit checks decide that.
 */

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/** Returns the id, or `null` when it is missing or not a UUID. */
export function parseIdFormValue(raw: unknown): string | null {
  if (typeof raw !== "string") {
    return null;
  }

  const value = raw.trim();
  return isUuid(value) ? value : null;
}
