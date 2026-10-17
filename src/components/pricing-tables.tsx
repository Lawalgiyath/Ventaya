'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Minus, Plus as PlusIcon, Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/app-context';
import { useBilling } from '@/hooks/use-billing';
import {
  CONSUMER_PLANS,
  ORG_PLANS,
  PLANS,
  formatUsd,
  planForSeats,
  seatCost,
  yearlySavingPct,
  type BillingInterval,
} from '@/lib/plans';
import { SITE } from '@/lib/site';

type Audience = 'individual' | 'organization';

export function PricingTables({ defaultAudience = 'individual' as Audience }) {
  const [audience, setAudience] = useState<Audience>(defaultAudience);

  return (
    <div className="space-y-10">
      <div className="flex justify-center">
        <div className="pill inline-flex border border-foreground/20 p-1">
          {(
            [
              ['individual', 'For me', User],
              ['organization', 'For my team', Building2],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              onClick={() => setAudience(value)}
              className={cn(
                'pill inline-flex items-center gap-2 px-5 py-2 text-sm font-medium transition-all',
                audience === value
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {audience === 'individual' ? <ConsumerPricing /> : <OrgPricing />}
    </div>
  );
}

function ConsumerPricing() {
  const [interval, setInterval] = useState<BillingInterval>('year');
  const { user, plan: currentPlan } = useApp();
  const { checkout, pending } = useBilling();
  const router = useRouter();
  const saving = yearlySavingPct(PLANS.plus);

  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <div className="pill inline-flex border border-foreground/20 p-1 text-sm">
          {(['month', 'year'] as const).map((i) => (
            <button
              key={i}
              onClick={() => setInterval(i)}
              className={cn(
                'pill px-5 py-1.5 font-medium transition-colors',
                interval === i
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {i === 'month' ? 'Monthly' : 'Yearly'}
              {i === 'year' && saving > 0 && (
                <span className="ml-1.5 text-xs font-semibold text-oxblood">
                  Save {saving}%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        {CONSUMER_PLANS.map((plan) => {
          const isCurrent = Boolean(user) && currentPlan.id === plan.id;
          const price =
            plan.id === 'plus' && interval === 'year'
              ? plan.priceYearly!
              : plan.priceMonthly;

          return (
            <div
              key={plan.id}
              className={cn(
                'relative flex flex-col border border-foreground/20 p-7',
                plan.highlight && 'border-primary bg-card'
              )}
            >
              {plan.highlight && (
                <span className="eyebrow absolute -top-3 left-7 bg-primary px-3 py-1 text-primary-foreground">
                  Most popular
                </span>
              )}

              <h3 className="font-headline text-3xl">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="font-headline text-5xl">{formatUsd(price)}</span>
                {price > 0 && (
                  <span className="text-muted-foreground">
                    /{interval === 'year' ? 'yr' : 'mo'}
                  </span>
                )}
              </div>

              <ul className="mt-7 flex-1 space-y-3 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-oxblood" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                variant={plan.highlight ? 'default' : 'outline'}
                className="pill mt-8"
                disabled={isCurrent || pending === plan.id}
                onClick={() => {
                  if (plan.id === 'free') return router.push('/signup');
                  if (!user) return router.push('/signup?next=/pricing');
                  checkout({ planId: 'plus', interval });
                }}
              >
                {pending === plan.id && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isCurrent ? 'Your current plan' : plan.cta}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrgPricing() {
  const [seats, setSeats] = useState(50);
  const { user, organization } = useApp();
  const { checkout, pending } = useBilling();
  const router = useRouter();

  const recommended = planForSeats(seats);
  const monthly = seatCost(recommended, seats);

  return (
    <div className="space-y-10">
      {/* Seat calculator: makes the per-seat price concrete before they choose. */}
      <div className="mx-auto max-w-2xl border border-foreground/20 bg-card p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Team size</p>
            <div className="mt-1 flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="pill h-9 w-9"
                onClick={() => setSeats((s) => Math.max(10, s - 10))}
                aria-label="Fewer seats"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-headline text-4xl tabular-nums">{seats}</span>
              <Button
                variant="outline"
                size="icon"
                className="pill h-9 w-9"
                onClick={() => setSeats((s) => Math.min(1000, s + 10))}
                aria-label="More seats"
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {recommended.id === 'enterprise'
                ? 'Custom pricing'
                : `${formatUsd(recommended.priceMonthly)} per person / month`}
            </p>
            <p className="font-headline text-4xl">
              {recommended.id === 'enterprise'
                ? "Let's talk"
                : `${formatUsd(monthly)}/mo`}
            </p>
          </div>
        </div>

        <Slider
          value={[seats]}
          min={10}
          max={1000}
          step={10}
          onValueChange={([v]) => setSeats(v)}
          className="mt-7"
          aria-label="Number of seats"
        />
        <p className="mt-3 text-sm text-muted-foreground">
          Recommended plan:{' '}
          <span className="font-medium text-foreground">{recommended.name}</span>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {ORG_PLANS.map((plan) => {
          const isRecommended = plan.id === recommended.id;
          return (
            <div
              key={plan.id}
              className={cn(
                'relative flex flex-col border border-foreground/20 p-7 transition-colors',
                isRecommended && 'border-primary bg-card'
              )}
            >
              {isRecommended && (
                <span className="eyebrow absolute -top-3 left-7 bg-primary px-3 py-1 text-primary-foreground">
                  Recommended for {seats}
                </span>
              )}
              <h3 className="font-headline text-3xl">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>

              <div className="mt-6 flex items-baseline gap-1.5">
                {plan.id === 'enterprise' ? (
                  <span className="font-headline text-4xl">Custom</span>
                ) : (
                  <>
                    <span className="font-headline text-5xl">
                      {formatUsd(plan.priceMonthly)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /person/mo
                    </span>
                  </>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {plan.maxSeats
                  ? `${plan.minSeats} to ${plan.maxSeats} seats`
                  : `${plan.minSeats}+ seats`}
              </p>

              <ul className="mt-7 flex-1 space-y-3 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-oxblood" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                variant={isRecommended ? 'default' : 'outline'}
                className="pill mt-8"
                disabled={pending === plan.id}
                onClick={() => {
                  if (plan.id === 'enterprise') {
                    window.location.href = `mailto:${SITE.salesEmail}?subject=Enterprise%20enquiry`;
                    return;
                  }
                  if (!user?.isLeader || !organization) {
                    router.push('/organization/signup');
                    return;
                  }
                  checkout({
                    planId: plan.id,
                    seats: Math.max(seats, plan.minSeats ?? 10),
                    organizationId: organization.id,
                  });
                }}
              >
                {pending === plan.id && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {plan.cta}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="mx-auto max-w-2xl border border-foreground/15 bg-card p-6 text-center space-y-3">
        <h4 className="font-headline text-xl">Need Nigerian Bank Transfer, Invoicing, or NGO Grant Subsidies?</h4>
        <p className="text-sm text-muted-foreground">
          We support direct corporate bank transfer, Naira payments, and grant-subsidized licenses for non-profits and women&apos;s organizations.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <a
            href={`https://wa.me/2348062679191?text=${encodeURIComponent("Hello Ventaya, I would like to arrange payment / subscription via WhatsApp.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="pill inline-flex items-center gap-2 bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            WhatsApp Billing: 08062679191
          </a>
          <a
            href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent("Ventaya Subscription & Billing Inquiry")}`}
            className="pill inline-flex items-center gap-2 border border-foreground/20 px-5 py-2 text-sm font-semibold hover:bg-muted"
          >
            Email: {SITE.contactEmail}
          </a>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Every plan includes the anonymity guarantee. Leaders see aggregate trends
        only, never an individual&apos;s entries.
      </p>
    </div>
  );
}
