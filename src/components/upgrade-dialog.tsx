'use client';

import { useState } from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/app-context';
import { useBilling } from '@/hooks/use-billing';
import { PLANS, formatUsd, yearlySavingPct, TRIAL_DAYS } from '@/lib/plans';
import { cn } from '@/lib/utils';

/**
 * Shown when the server refuses a metered call. The copy leads with what the
 * user was trying to do, because that's the moment intent is highest.
 */
export function UpgradeDialog() {
  const { upgradeOpen, closeUpgrade, upgradeReason } = useApp();
  const { checkout, pending } = useBilling();
  const [interval, setInterval] = useState<'month' | 'year'>('year');

  const plus = PLANS.plus;
  const saving = yearlySavingPct(plus);
  const price = interval === 'year' ? plus.priceYearly! : plus.priceMonthly;

  return (
    <Dialog open={upgradeOpen} onOpenChange={(o) => !o && closeUpgrade()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle className="font-headline text-2xl">
            Keep going with Plus
          </DialogTitle>
          <DialogDescription>
            {upgradeReason ??
              'You have reached the limit of your free plan for this week.'}
          </DialogDescription>
        </DialogHeader>

        <div className="inline-flex self-start rounded-lg border bg-muted/50 p-1 text-sm">
          {(['month', 'year'] as const).map((i) => (
            <button
              key={i}
              onClick={() => setInterval(i)}
              className={cn(
                'rounded-md px-3 py-1.5 font-medium transition-colors',
                interval === i
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {i === 'month' ? 'Monthly' : 'Yearly'}
              {i === 'year' && saving > 0 && (
                <span className="ml-1.5 text-xs text-oxblood">-{saving}%</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="font-headline text-4xl">{formatUsd(price)}</span>
          <span className="text-muted-foreground">
            /{interval === 'year' ? 'year' : 'month'}
          </span>
        </div>

        <ul className="space-y-2.5 text-sm">
          {plus.features.map((f) => (
            <li key={f} className="flex gap-2.5">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-oxblood" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <Button
          size="lg"
          className="w-full"
          disabled={pending === 'plus'}
          onClick={() => checkout({ planId: 'plus', interval })}
        >
          {pending === 'plus' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Opening checkout…
            </>
          ) : (
            `Start ${TRIAL_DAYS}-day free trial`
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Cancel anytime during the trial and you won't be charged.
        </p>
      </DialogContent>
    </Dialog>
  );
}
