/**
 * Server-only OpenRouter data access.
 *
 * The management key is read from a non-`NEXT_PUBLIC_` environment variable, so
 * Next.js never includes it in a client bundle. This module must only ever be
 * imported from server components — the browser must never call OpenRouter.
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1";

/** Keeps the dashboard responsive when OpenRouter is slow to answer. */
const REQUEST_TIMEOUT_MS = 5000;

/** `GET /credits` — account totals. A management key is required. */
type CreditsResponse = {
  data?: {
    total_credits?: unknown;
    total_usage?: unknown;
  };
};

export type OpenRouterUsage = {
  /** Total credits purchased minus total usage, in USD. */
  remainingCredits: number | null;
};

function toAmount(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * One authenticated GET.
 *
 * Every failure path returns `null` deliberately: the status, the response body
 * and any provider message are never surfaced, logged or re-thrown, so neither a
 * credential nor a raw API error can reach the UI or the logs.
 */
async function getJson<T>(path: string, token: string): Promise<T | null> {
  try {
    const response = await fetch(`${OPENROUTER_API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      // No caching: a normal page refresh should show reasonably fresh numbers.
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Remaining account credits.
 *
 * Returns `null` when nothing could be read, so the card can show its
 * unavailable state; a response we could not parse leaves the amount `null` for
 * the card to render as `—`.
 */
export async function getOpenRouterUsage(): Promise<OpenRouterUsage | null> {
  const managementKey = process.env.OPENROUTER_MANAGEMENT_KEY?.trim();

  if (!managementKey) {
    return null;
  }

  const creditsResponse = await getJson<CreditsResponse>(
    "/credits",
    managementKey,
  );

  if (!creditsResponse) {
    return null;
  }

  const totalCredits = toAmount(creditsResponse.data?.total_credits);
  const totalUsage = toAmount(creditsResponse.data?.total_usage);

  return {
    remainingCredits:
      totalCredits !== null && totalUsage !== null
        ? totalCredits - totalUsage
        : null,
  };
}
