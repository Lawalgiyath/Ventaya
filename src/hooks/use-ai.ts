'use client';

import { useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/context/app-context';
import type { AiResult } from '@/app/actions/ai';

/**
 * Calls a guarded AI server action with the current user's ID token attached,
 * and converts a refusal into either an upgrade prompt or a toast.
 *
 * Usage:
 *   const { run } = useAi();
 *   const plan = await run(aiPlanDay, input);   // null when refused
 */
export function useAi() {
  const { toast } = useToast();
  const { openUpgrade } = useApp();

  const run = useCallback(
    async <TInput, TData>(
      action: (token: string | undefined, input: TInput) => Promise<AiResult<TData>>,
      input: TInput
    ): Promise<TData | null> => {
      let token: string | undefined;
      try {
        token = await auth.currentUser?.getIdToken();
      } catch {
        token = undefined;
      }

      const result = await action(token, input);

      if (result.ok) return result.data;

      if (result.code === 'quota_exceeded' || result.code === 'not_in_plan') {
        openUpgrade(result.error);
        return null;
      }

      toast({
        variant: 'destructive',
        title:
          result.code === 'unauthenticated'
            ? 'Please sign in again'
            : 'Something went wrong',
        description: result.error,
      });
      return null;
    },
    [toast, openUpgrade]
  );

  return { run };
}
