import { test, expect } from '@playwright/test';
import {
  checkAccess,
  resolvePlan,
  isSubscriptionActive,
  usageWeekKey,
} from '../src/lib/entitlements';
import {
  PLANS,
  planForSeats,
  seatCost,
  yearlySavingPct,
  formatUsd,
  FREE_WEEKLY_AI_ACTIONS,
} from '../src/lib/plans';

/**
 * Pure billing logic. These need no browser: a mistake here either gives away
 * the product or charges someone who already paid, so they're worth pinning
 * down precisely.
 */

test.describe('plan resolution', () => {
  test('an unsubscribed user is on Free', () => {
    expect(resolvePlan(null, null).id).toBe('free');
    expect(resolvePlan({ plan: 'plus', subscriptionStatus: null }, null).id).toBe('free');
  });

  test('a cancelled subscription drops back to Free', () => {
    expect(
      resolvePlan({ plan: 'plus', subscriptionStatus: 'canceled' }, null).id
    ).toBe('free');
  });

  test('trialing counts as paid', () => {
    expect(isSubscriptionActive({ subscriptionStatus: 'trialing' })).toBe(true);
    expect(
      resolvePlan({ plan: 'plus', subscriptionStatus: 'trialing' }, null).id
    ).toBe('plus');
  });

  test('past_due does not count as paid', () => {
    expect(isSubscriptionActive({ subscriptionStatus: 'past_due' })).toBe(false);
  });

  test('an org seat outranks a lapsed personal subscription', () => {
    const plan = resolvePlan(
      { plan: 'plus', subscriptionStatus: 'canceled' },
      { plan: 'business', subscriptionStatus: 'active' }
    );
    expect(plan.id).toBe('business');
  });
});

test.describe('quota enforcement', () => {
  const free = { plan: 'free' as const, subscriptionStatus: null };

  test('free users get exactly the advertised weekly allowance', () => {
    for (let used = 0; used < FREE_WEEKLY_AI_ACTIONS; used++) {
      const r = checkAccess('ai.journal', used, free, null);
      expect(r.allowed, `should allow call ${used + 1}`).toBe(true);
      expect(r.remaining).toBe(FREE_WEEKLY_AI_ACTIONS - used);
    }
  });

  test('the call past the limit is refused', () => {
    const r = checkAccess('ai.journal', FREE_WEEKLY_AI_ACTIONS, free, null);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('quota_exceeded');
    expect(r.remaining).toBe(0);
  });

  test('paid users are never quota-limited', () => {
    const paid = { plan: 'plus' as const, subscriptionStatus: 'active' as const };
    const r = checkAccess('ai.journal', 9_999, paid, null);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBeNull();
  });

  test('org insights are not in any consumer plan', () => {
    expect(checkAccess('org.insights', 0, free, null).allowed).toBe(false);
    expect(
      checkAccess(
        'org.insights',
        0,
        { plan: 'plus', subscriptionStatus: 'active' },
        null
      ).reason
    ).toBe('not_in_plan');
  });

  test('org insights are granted through an active org', () => {
    const r = checkAccess('org.insights', 0, null, {
      plan: 'business',
      subscriptionStatus: 'active',
    });
    expect(r.allowed).toBe(true);
  });

  test('CSV export is Business and up, not Team', () => {
    expect(PLANS.team.entitlements).not.toContain('org.export');
    expect(PLANS.business.entitlements).toContain('org.export');
  });
});

test.describe('usage window', () => {
  test('produces a stable ISO week key', () => {
    expect(usageWeekKey(new Date('2026-09-10T12:00:00Z'))).toMatch(/^\d{4}-W\d{2}$/);
  });

  test('the same week maps to the same key', () => {
    const mon = usageWeekKey(new Date('2026-09-07T00:00:00Z'));
    const sun = usageWeekKey(new Date('2026-09-13T23:59:00Z'));
    expect(mon).toBe(sun);
  });

  test('a new week rolls the key over', () => {
    const wk1 = usageWeekKey(new Date('2026-09-13T23:59:00Z'));
    const wk2 = usageWeekKey(new Date('2026-09-14T00:01:00Z'));
    expect(wk1).not.toBe(wk2);
  });
});

test.describe('pricing maths', () => {
  test('seat tiers map to the documented headcounts', () => {
    expect(planForSeats(10).id).toBe('team');
    expect(planForSeats(49).id).toBe('team');
    expect(planForSeats(50).id).toBe('business');
    expect(planForSeats(499).id).toBe('business');
    expect(planForSeats(500).id).toBe('enterprise');
  });

  test('seat cost multiplies out correctly', () => {
    expect(seatCost(PLANS.team, 10)).toBe(80);
    expect(seatCost(PLANS.business, 50)).toBe(300);
    expect(seatCost(PLANS.business, 200)).toBe(1200);
  });

  test('the yearly saving badge is honest', () => {
    // $89/yr against $12/mo × 12 = $144 → 38%.
    expect(yearlySavingPct(PLANS.plus)).toBe(38);
  });

  test('prices render as clean USD', () => {
    expect(formatUsd(12)).toBe('$12');
    expect(formatUsd(89)).toBe('$89');
    expect(formatUsd(0)).toBe('$0');
  });

  test('Business undercuts Team per seat', () => {
    expect(PLANS.business.priceMonthly).toBeLessThan(PLANS.team.priceMonthly);
  });
});
