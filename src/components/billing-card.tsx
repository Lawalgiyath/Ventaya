'use client';

import { CreditCard, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/app-context';
import { useBilling } from '@/hooks/use-billing';
import { formatUsd } from '@/lib/plans';

const STATUS_COPY: Record<string, { label: string; tone: string }> = {
  active: { label: 'Active', tone: 'text-oxblood' },
  trialing: { label: 'Free trial', tone: 'text-primary' },
  past_due: { label: 'Payment failed', tone: 'text-destructive' },
  canceled: { label: 'Cancelled', tone: 'text-muted-foreground' },
  unpaid: { label: 'Unpaid', tone: 'text-destructive' },
  incomplete: { label: 'Incomplete', tone: 'text-destructive' },
};

export function BillingCard() {
  const { user, organization, plan, openUpgrade } = useApp();
  const { openPortal, pending } = useBilling();

  // An org seat is billed to the employer, so there is nothing here to manage.
  const coveredByOrg =
    plan.audience === 'organization' && !user?.isLeader && !!organization;

  const status = user?.subscriptionStatus ?? null;
  const statusCopy = status ? STATUS_COPY[status] : null;
  const renews = user?.currentPeriodEnd
    ? new Date(user.currentPeriodEnd).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Plan & billing
        </CardTitle>
        <CardDescription>
          {coveredByOrg
            ? `Your seat is provided by ${organization?.name}.`
            : 'Manage your subscription, payment method and invoices.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-headline text-xl">{plan.name}</span>
              {statusCopy && (
                <span className={`text-sm font-medium ${statusCopy.tone}`}>
                  · {statusCopy.label}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {plan.priceMonthly > 0
                ? `${formatUsd(plan.priceMonthly)}/month`
                : 'No charge'}
              {renews && ` · renews ${renews}`}
            </p>
          </div>

          {plan.weeklyAiActions !== null && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              {plan.weeklyAiActions} AI sessions / week
            </span>
          )}
        </div>

        {status === 'past_due' && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            Your last payment did not go through. Update your card to keep your
            plan active.
          </p>
        )}

        {!coveredByOrg && (
          <div className="flex flex-wrap gap-2.5">
            {plan.id === 'free' ? (
              <Button onClick={() => openUpgrade()}>
                <Sparkles className="mr-2 h-4 w-4" />
                Upgrade to Plus
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => openPortal('/profile')}
                disabled={pending === 'portal'}
              >
                {pending === 'portal' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                Manage billing
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
