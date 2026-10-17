/**
 * Pricing and entitlements: the single source of truth.
 *
 * Every price shown in the UI, every gate in the API, and every Stripe
 * Checkout line item reads from this file. Nothing hardcodes a price.
 *
 * Positioning basis (2026 market research):
 *  - B2C: freemium converts ~2.1-2.6% at day 35, while card-required trials
 *    convert ~48.8%; Health & Fitness trials run ~40%. Hence a 7-day
 *    card-required trial rather than an open-ended free tier.
 *  - B2B: Lyra Health / Spring Health PEPM runs $4-18, so $6-8/seat sits
 *    mid-band while undercutting the incumbents on entry price.
 */

export type PlanId = 'free' | 'plus' | 'team' | 'business' | 'enterprise';
export type BillingInterval = 'month' | 'year';

/** Capabilities that cost money to serve (every one calls the model). */
export type Entitlement =
  | 'ai.journal'
  | 'ai.assessment'
  | 'ai.planner'
  | 'ai.worryJar'
  | 'ai.content'
  | 'ai.inspire'
  | 'history.full'
  | 'org.insights'
  | 'org.export';

/** Free-tier weekly allowance across all AI features combined. */
export const FREE_WEEKLY_AI_ACTIONS = 3;

/** Aggregate org insights are withheld below this many active members. */
export const MIN_COHORT_FOR_INSIGHTS = 5;

export const TRIAL_DAYS = 7;

const CONSUMER_AI: Entitlement[] = [
  'ai.journal',
  'ai.assessment',
  'ai.planner',
  'ai.worryJar',
  'ai.content',
  'ai.inspire',
];

export interface Plan {
  id: PlanId;
  name: string;
  audience: 'individual' | 'organization';
  /** Price in whole USD. Per-seat/month for org plans. */
  priceMonthly: number;
  priceYearly?: number;
  /** Seat bounds for org plans. */
  minSeats?: number;
  maxSeats?: number;
  tagline: string;
  features: string[];
  entitlements: Entitlement[];
  /** null = unlimited */
  weeklyAiActions: number | null;
  stripePriceIds?: Partial<Record<BillingInterval, string | undefined>>;
  highlight?: boolean;
  cta: string;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    audience: 'individual',
    priceMonthly: 0,
    tagline: 'Build the habit. No card required.',
    features: [
      'Daily mood tracking & streaks',
      'Unlimited private journal entries',
      'Wellness goals & progress charts',
      `${FREE_WEEKLY_AI_ACTIONS} AI sessions per week`,
      'Full crisis & support directory',
    ],
    entitlements: [...CONSUMER_AI],
    weeklyAiActions: FREE_WEEKLY_AI_ACTIONS,
    cta: 'Start free',
  },

  plus: {
    id: 'plus',
    name: 'Plus',
    audience: 'individual',
    priceMonthly: 12,
    priceYearly: 89,
    tagline: `Everything, unlimited. ${TRIAL_DAYS} days free.`,
    features: [
      'Everything in Free',
      'Unlimited AI journaling & reflection',
      'Unlimited assessments & re-checks',
      'Daily planner with meal planning',
      'Worry Jar reframing, unlimited',
      'Complete history & pattern insights',
      'Priority support',
    ],
    entitlements: [...CONSUMER_AI, 'history.full'],
    weeklyAiActions: null,
    stripePriceIds: {
      month: process.env.NEXT_PUBLIC_STRIPE_PRICE_PLUS_MONTHLY,
      year: process.env.NEXT_PUBLIC_STRIPE_PRICE_PLUS_YEARLY,
    },
    highlight: true,
    cta: `Start ${TRIAL_DAYS}-day free trial`,
  },

  team: {
    id: 'team',
    name: 'Team',
    audience: 'organization',
    priceMonthly: 8,
    minSeats: 10,
    maxSeats: 49,
    tagline: 'For growing teams that want to get ahead of burnout.',
    features: [
      'Everything in Plus, for every member',
      'Private invite code onboarding',
      'Aggregate wellbeing snapshot',
      'Anonymity guaranteed by design',
      'Email support',
    ],
    entitlements: [...CONSUMER_AI, 'history.full', 'org.insights'],
    weeklyAiActions: null,
    stripePriceIds: { month: process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM_SEAT },
    cta: 'Start with 10 seats',
  },

  business: {
    id: 'business',
    name: 'Business',
    audience: 'organization',
    priceMonthly: 6,
    minSeats: 50,
    maxSeats: 499,
    tagline: 'Volume pricing with the full insights suite.',
    features: [
      'Everything in Team',
      'AI organizational insights & recommendations',
      'Trend reporting over time',
      'CSV export for HR reporting',
      'Onboarding assistance',
      'Priority support',
    ],
    entitlements: [
      ...CONSUMER_AI,
      'history.full',
      'org.insights',
      'org.export',
    ],
    weeklyAiActions: null,
    stripePriceIds: { month: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_SEAT },
    highlight: true,
    cta: 'Start with 50 seats',
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    audience: 'organization',
    priceMonthly: 0, // quoted
    minSeats: 500,
    tagline: 'For organizations with compliance requirements.',
    features: [
      'Everything in Business',
      'SSO / SAML',
      'Custom data residency',
      'BAA & security review',
      'Dedicated success manager',
      'Custom integrations',
    ],
    entitlements: [
      ...CONSUMER_AI,
      'history.full',
      'org.insights',
      'org.export',
    ],
    weeklyAiActions: null,
    cta: 'Talk to sales',
  },
};

export const CONSUMER_PLANS: Plan[] = [PLANS.free, PLANS.plus];
export const ORG_PLANS: Plan[] = [PLANS.team, PLANS.business, PLANS.enterprise];

/** Percentage saved by paying yearly, for the "save X%" badge. */
export function yearlySavingPct(plan: Plan): number {
  if (!plan.priceYearly || !plan.priceMonthly) return 0;
  return Math.round((1 - plan.priceYearly / (plan.priceMonthly * 12)) * 100);
}

/** Monthly cost of a seat-based plan at a given headcount. */
export function seatCost(plan: Plan, seats: number): number {
  return plan.priceMonthly * seats;
}

/** Cheapest org plan that legitimately covers this headcount. */
export function planForSeats(seats: number): Plan {
  if (seats >= 500) return PLANS.enterprise;
  if (seats >= 50) return PLANS.business;
  return PLANS.team;
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

/** Resolve a Stripe Price ID, or null when billing isn't configured yet. */
export function stripePriceFor(
  planId: PlanId,
  interval: BillingInterval = 'month'
): string | null {
  return PLANS[planId].stripePriceIds?.[interval] || null;
}

/** True when Stripe price IDs are present, i.e. checkout can actually run. */
export function isBillingConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_STRIPE_PRICE_PLUS_MONTHLY &&
      process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM_SEAT
  );
}
