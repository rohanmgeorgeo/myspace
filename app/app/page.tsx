import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, WalletIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeading } from "@/components/page-heading";
import { Section } from "@/components/section";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDisplayName } from "@/lib/auth/display-name";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Home",
};

export default async function HomePage() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();
  const displayName = getDisplayName(user, profile);

  return (
    <>
      <PageHeading
        title={`Welcome back, ${displayName}`}
        description="Everything you are tracking, at a glance."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          className="lg:col-span-2"
          label="Total balance"
          value="—"
          hint="Add your first account in Money to see a real balance."
          icon={WalletIcon}
        />

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Money</CardTitle>
            <CardDescription>
              Balances, accounts, income and spending.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 text-sm text-muted-foreground">
            Nothing recorded yet.
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/app/money">
                Open Money
                <ArrowRightIcon />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Section
        title="Recent activity"
        description="The latest money movements across your accounts."
      >
        <EmptyState
          icon={WalletIcon}
          title="Nothing to show yet"
          description="Once you add accounts and transactions, the most recent ones will appear here."
        >
          <Button asChild variant="outline" size="sm">
            <Link href="/app/money">
              Set up Money
              <ArrowRightIcon />
            </Link>
          </Button>
        </EmptyState>
      </Section>
    </>
  );
}
