/**
 * Entitlement resolution: pure, dependency-free, and shared by both the
 * client (to render locks and meters) and the server (to actually enforce).
 *
 * The client copy is a convenience. The server copy is the real gate; see
 * `src/lib/guard.ts`. A paywall that only exists in React is not a paywall.
 */

import {
  PLANS,
  type Entitlement,
  type Plan,
  type PlanId,
  FREE_WEEKLY_AI_ACTIONS,
} from './plans';

/** Stripe subscription states we treat as "paid and usable". */
export const ACTIVE_STATUSES = ['active', 'trialing'] as const;
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'unpaid'
  | null;

export interface BillingState {
  plan?: PlanId | null;
  subscriptionStatus?: SubscriptionStatus;
  currentPeriodEnd?: string | null;
  stripeCustomerId?: string | null;
  subscriptionId?: string | null;
}

export interface OrgBillingState extends BillingState {
  seatsPurchased?: number;
  seatsUsed?: number;
}

export function isSubscriptionActive(state?: BillingState | null): boolean {
  if (!state?.subscriptionStatus) return false;
  return (ACTIVE_STATUSES as readonly string[]).includes(
    state.subscriptionStatus
  );
}

/**
 * The plan a user actually gets right now.
 *
 * Org coverage wins over a personal subscription: if your employer bought you
 * a seat you get the org tier, even if your own card lapsed.
 */
export function resolvePlan(
  user?: BillingState | null,
  org?: OrgBillingState | null
): Plan {
  if (org && isSubscriptionActive(org) && org.plan) {
    return PLANS[org.plan] ?? PLANS.free;
  }
  if (user && isSubscriptionActive(user) && user.plan) {
    return PLANS[user.plan] ?? PLANS.free;
  }
  return PLANS.free;
}

/** Does this plan include the capability at all (ignoring usage limits)? */
export function planGrants(plan: Plan, entitlement: Entitlement): boolean {
  return plan.entitlements.includes(entitlement);
}

export interface AccessResult {
  allowed: boolean;
  /** Why access was refused: drives which upsell the UI shows. */
  reason?: 'not_in_plan' | 'quota_exceeded';
  /** Remaining actions this week; null when unlimited. */
  remaining: number | null;
  limit: number | null;
  plan: Plan;
}

/**
 * The full check: capability + weekly quota.
 *
 * `usedThisWeek` comes from the metered counter in Firestore.
 */
export function checkAccess(
  entitlement: Entitlement,
  usedThisWeek: number,
  user?: BillingState | null,
  org?: OrgBillingState | null
): AccessResult {
  const plan = resolvePlan(user, org);

  if (!planGrants(plan, entitlement)) {
    return {
      allowed: false,
      reason: 'not_in_plan',
      remaining: 0,
      limit: plan.weeklyAiActions,
      plan,
    };
  }

  const limit = plan.weeklyAiActions;
  if (limit === null) {
    return { allowed: true, remaining: null, limit: null, plan };
  }

  const remaining = Math.max(0, limit - usedThisWeek);
  return remaining > 0
    ? { allowed: true, remaining, limit, plan }
    : { allowed: false, reason: 'quota_exceeded', remaining: 0, limit, plan };
}

/** Metered entitlements: the ones that spend model tokens. */
const METERED: Entitlement[] = [
  'ai.journal',
  'ai.assessment',
  'ai.planner',
  'ai.worryJar',
  'ai.content',
  'ai.inspire',
];

export function isMetered(entitlement: Entitlement): boolean {
  return METERED.includes(entitlement);
}

/**
 * Stable key for the current usage window (ISO week, UTC).
 * Example: "2026-W37".
 */
export function usageWeekKey(date = new Date()): string {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  // ISO weeks run Monday-Sunday and are numbered from the week containing Jan 4.
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Human copy for the usage meter. */
export function quotaLabel(result: AccessResult): string {
  if (result.limit === null) return 'Unlimited';
  return `${result.remaining} of ${result.limit} left this week`;
}

export { FREE_WEEKLY_AI_ACTIONS };
