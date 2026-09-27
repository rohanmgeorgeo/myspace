import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SectionProps = {
  title: string;
  description?: string;
  /** Rendered in the top-right corner of the header. */
  action?: React.ReactNode;
  children: React.ReactNode;
};

/** Card with a titled header, used for Accounts, Transactions and similar. */
export function Section({ title, description, action, children }: SectionProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
