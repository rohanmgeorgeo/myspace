/**
 * Exact money handling for the write boundary.
 *
 * Money arrives as a validated decimal string (see the account/transaction form
 * modules) and is only ever turned into integer minor units (paise) for
 * arithmetic. Additions and subtractions therefore never run through floating
 * point, and a validated string is what gets sent to PostgreSQL `numeric`.
 */

/** Money lives in `numeric(14, 2)`: 12 integer digits plus 2 decimals. */
export const MONEY_MAX_INTEGER_DIGITS = 12;
export const MONEY_MAX_DECIMAL_PLACES = 2;

export const MONEY_MINOR_UNITS_PER_MAJOR = 100;

/** Pattern for a plain decimal with at most 2 decimal places. */
export function moneyPattern({
  allowNegative,
}: {
  allowNegative: boolean;
}): RegExp {
  return new RegExp(
    `^${allowNegative ? "-?" : ""}\\d{1,${MONEY_MAX_INTEGER_DIGITS}}` +
      `(?:\\.\\d{0,${MONEY_MAX_DECIMAL_PLACES}})?$`,
  );
}

/**
 * Normalises pasted money with string operations only: `"1,25,000.50"`,
 * `"+500"`, `" 500 "` and `"12500."` all become plain decimal strings.
 */
export function cleanMoneyInput(raw: string): string {
  const cleaned = raw.trim().replace(/[,\s_]/g, "").replace(/^\+/, "");
  return cleaned.endsWith(".") ? cleaned.slice(0, -1) : cleaned;
}

/**
 * Converts a decimal string, or a `numeric` value returned by PostgREST, into
 * integer minor units.
 *
 * `toFixed(2)` restores the exact 2-decimal form of a number, after which all
 * of the maths is integer arithmetic: the integer part is at most 12 digits and
 * the result stays well inside `Number.MAX_SAFE_INTEGER`, so nothing is lost.
 */
export function toMinorUnits(value: number | string): number {
  const decimal = typeof value === "number" ? value.toFixed(2) : value.trim();

  const isNegative = decimal.startsWith("-");
  const digits = isNegative ? decimal.slice(1) : decimal;
  const [whole = "0", fraction = ""] = digits.split(".");
  const minorFraction = `${fraction}00`.slice(0, MONEY_MAX_DECIMAL_PLACES);

  const minor =
    Number(whole) * MONEY_MINOR_UNITS_PER_MAJOR + Number(minorFraction);

  return isNegative ? -minor : minor;
}

/**
 * Integer minor units back to a plain decimal string: `1250050` → `"12500.50"`.
 *
 * Used to prefill the edit forms. Like `toMinorUnits` this is integer-only
 * arithmetic, so the round trip is exact.
 */
export function fromMinorUnits(minorUnits: number): string {
  const isNegative = minorUnits < 0;
  const absolute = Math.abs(minorUnits);
  const whole = Math.floor(absolute / MONEY_MINOR_UNITS_PER_MAJOR);
  const fraction = absolute % MONEY_MINOR_UNITS_PER_MAJOR;

  return `${isNegative ? "-" : ""}${whole}.${String(fraction).padStart(2, "0")}`;
}
