'use server';

/**
 * Guarded server actions wrapping every AI flow.
 *
 * Components MUST call these rather than importing the flows directly: this
 * is the only layer that checks entitlements and meters usage before a model
 * call happens. Importing `@/ai/flows/*` from a component bypasses billing.
 *
 * Each action takes the caller's Firebase ID token as its first argument;
 * `useAi()` in `src/hooks/use-ai.ts` supplies it automatically.
 */

import { requireEntitlement, recordUsage, EntitlementError } from '@/lib/guard';
import type { Entitlement } from '@/lib/plans';

import { planDay, type DailyPlannerInput } from '@/ai/flows/daily-planner-flow';
import { correctText, type TextCorrectionInput } from '@/ai/flows/text-correction-flow';
import {
  mentalHealthAssessment,
  type MentalHealthAssessmentInput,
} from '@/ai/flows/mental-health-assessment';
import { vetStory, type StoryVettingInput } from '@/ai/flows/story-vetting-flow';
import {
  analyzeJournalEntry,
  type JournalAnalysisInput,
} from '@/ai/flows/journal-analysis-flow';
import { reframeWorry, type ReframeWorryInput } from '@/ai/flows/worry-jar-flow';
import {
  personalizedContentSuggestions,
  type PersonalizedContentInput,
} from '@/ai/flows/personalized-content';
import {
  generateOrganizationInsights,
  type OrganizationInsightsInput,
} from '@/ai/flows/organization-insights-flow';

/** Uniform shape so callers can render upsell UI instead of a raw throw. */
export type AiResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: string;
      code: 'unauthenticated' | 'quota_exceeded' | 'not_in_plan' | 'failed';
    };

async function guarded<T>(
  idToken: string | undefined,
  entitlement: Entitlement,
  run: () => Promise<T>
): Promise<AiResult<T>> {
  let uid: string;
  try {
    ({ uid } = await requireEntitlement(idToken, entitlement));
  } catch (e) {
    if (e instanceof EntitlementError) {
      return { ok: false, error: e.message, code: e.code };
    }
    throw e;
  }

  try {
    const data = await run();
    // Only bill for work that actually succeeded.
    await recordUsage(uid, entitlement);
    return { ok: true, data };
  } catch (e) {
    console.error(`[ventaya] ${entitlement} flow failed:`, e);
    return {
      ok: false,
      code: 'failed',
      error:
        'Aya could not respond just now. Please try again in a moment.',
    };
  }
}

export async function aiPlanDay(idToken: string | undefined, input: DailyPlannerInput) {
  return guarded(idToken, 'ai.planner', () => planDay(input));
}

export async function aiAssessment(
  idToken: string | undefined,
  input: MentalHealthAssessmentInput
) {
  return guarded(idToken, 'ai.assessment', () => mentalHealthAssessment(input));
}

export async function aiAnalyzeJournal(
  idToken: string | undefined,
  input: JournalAnalysisInput
) {
  return guarded(idToken, 'ai.journal', () => analyzeJournalEntry(input));
}

export async function aiReframeWorry(
  idToken: string | undefined,
  input: ReframeWorryInput
) {
  return guarded(idToken, 'ai.worryJar', () => reframeWorry(input));
}

export async function aiPersonalizedContent(
  idToken: string | undefined,
  input: PersonalizedContentInput
) {
  return guarded(idToken, 'ai.content', () =>
    personalizedContentSuggestions(input)
  );
}

export async function aiVetStory(idToken: string | undefined, input: StoryVettingInput) {
  return guarded(idToken, 'ai.inspire', () => vetStory(input));
}

export async function aiOrgInsights(
  idToken: string | undefined,
  input: OrganizationInsightsInput
) {
  return guarded(idToken, 'org.insights', () =>
    generateOrganizationInsights(input)
  );
}

/**
 * Spelling/grammar tidy-up on user input. Deliberately ungated: it's a tiny
 * call, and charging quota for fixing a typo would feel punitive.
 */
export async function aiCorrectText(input: TextCorrectionInput) {
  try {
    return { ok: true as const, data: await correctText(input) };
  } catch {
    // Non-critical: callers fall back to the original text.
    return { ok: false as const, error: 'unavailable', code: 'failed' as const };
  }
}
