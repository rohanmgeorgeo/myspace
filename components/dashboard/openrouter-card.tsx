import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoneyValue } from "@/lib/format";
import type { OpenRouterUsage } from "@/lib/openrouter/usage";

/** OpenRouter reports credits in USD, whatever the Money module uses. */
const CREDITS_CURRENCY = "USD";

type OpenRouterCardProps = {
  /** `null` when neither OpenRouter request could be read. */
  usage: OpenRouterUsage | null;
};

/** Usage/credit tile for the dashboard's Developer section. */
export function OpenRouterCard({ usage }: OpenRouterCardProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>OpenRouter</CardTitle>
        <CardDescription>Account credits and usage</CardDescription>
      </CardHeader>

      <CardContent>
        {usage === null ? (
          <p className="text-sm text-muted-foreground">
            OpenRouter data unavailable
          </p>
        ) : (
          <dl className="grid gap-2">
            <UsageRow label="Remaining" value={usage.remainingCredits} />
          </dl>
        )}
      </CardContent>

      {usage === null ? null : (
        <CardFooter>
          <p className="text-xs text-muted-foreground">Updated just now</p>
        </CardFooter>
      )}
    </Card>
  );
}

function UsageRow({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium tabular-nums">
        {value === null ? "—" : formatMoneyValue(value, CREDITS_CURRENCY)}
      </dd>
    </div>
  );
}
