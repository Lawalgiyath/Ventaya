'use client';

import { Sparkles, Infinity as InfinityIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useApp } from '@/context/app-context';
import { cn } from '@/lib/utils';

/**
 * Shows what's left of the free weekly AI allowance.
 *
 * Visible before the wall is hit, not just at it: a meter that only appears
 * when you're blocked reads as a trap rather than a limit.
 */
export function UsageMeter({ className }: { className?: string }) {
  const { plan, weeklyUsage, openUpgrade } = useApp();
  const limit = plan.weeklyAiActions;

  if (limit === null) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-sm',
          className
        )}
      >
        <InfinityIcon className="h-4 w-4 text-primary" />
        <span className="font-medium">{plan.name}</span>
        <span className="text-muted-foreground">· unlimited AI</span>
      </div>
    );
  }

  const used = Math.min(weeklyUsage, limit);
  const remaining = Math.max(0, limit - used);
  const spent = remaining === 0;

  return (
    <div className={cn('rounded-lg border p-3', className)}>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          AI sessions
        </span>
        <span
          className={cn(
            'tabular-nums',
            spent ? 'text-destructive' : 'text-muted-foreground'
          )}
        >
          {remaining} of {limit} left
        </span>
      </div>

      <Progress value={(used / limit) * 100} className="mt-2.5 h-1.5" />

      <p className="mt-2 text-xs text-muted-foreground">
        {spent ? 'Resets Monday.' : 'Your allowance resets every Monday.'}
      </p>

      <Button
        size="sm"
        variant={spent ? 'default' : 'outline'}
        className="mt-3 w-full"
        onClick={() => openUpgrade()}
      >
        {spent ? 'Upgrade for unlimited' : 'Go unlimited'}
      </Button>
    </div>
  );
}
