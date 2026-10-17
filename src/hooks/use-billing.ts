'use client';

import { useCallback, useState } from 'react';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { BillingInterval, PlanId } from '@/lib/plans';

/** Starts Stripe Checkout / Billing Portal flows and reports failures. */
export function useBilling() {
  const { toast } = useToast();
  const [pending, setPending] = useState<string | null>(null);

  const post = useCallback(
    async (endpoint: string, payload: Record<string, unknown>) => {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, idToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Something went wrong.');
      }
      return data.url as string;
    },
    []
  );

  const checkout = useCallback(
    async (opts: {
      planId: PlanId;
      interval?: BillingInterval;
      seats?: number;
      organizationId?: string;
    }) => {
      setPending(opts.planId);
      try {
        window.location.href = await post('/api/stripe/checkout', opts);
      } catch (e) {
        toast({
          title: 'Direct activation available',
          description: 'Card checkout is transitioning. You can activate directly via WhatsApp (08062679191) or email (lawalgiyath200716@gmail.com).',
        });
        setPending(null);
      }
    },
    [post, toast]
  );

  const openPortal = useCallback(
    async (returnPath = '/dashboard') => {
      setPending('portal');
      try {
        window.location.href = await post('/api/stripe/portal', { returnPath });
      } catch (e) {
        toast({
          variant: 'destructive',
          title: 'Billing portal unavailable',
          description: e instanceof Error ? e.message : 'Please try again.',
        });
        setPending(null);
      }
    },
    [post, toast]
  );

  return { checkout, openPortal, pending };
}
