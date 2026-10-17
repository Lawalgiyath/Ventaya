import { NextResponse } from 'next/server';
import { requireUser, EntitlementError } from '@/lib/guard';
import { getAdmin } from '@/lib/firebase-admin';
import { generateOrganizationInsights } from '@/ai/flows/organization-insights-flow';
import { MIN_COHORT_FOR_INSIGHTS } from '@/lib/plans';

export const runtime = 'nodejs';

/**
 * Aggregate organization wellbeing: the only way a leader can see anything
 * about their team.
 *
 * The previous implementation queried `users` straight from the leader's
 * browser, which shipped every member's name, email and full mood history to
 * the client. Aggregation happens here instead, and the response contains
 * counts only. No identifier for any member ever crosses this boundary.
 *
 * Below `MIN_COHORT_FOR_INSIGHTS` active members nothing is returned at all:
 * with three people on a team, "one person is struggling" identifies someone.
 */

interface MoodEntry {
  mood: string;
  date: string;
}

const MOODS = ['Happy', 'Calm', 'Okay', 'Anxious', 'Sad'] as const;

export async function POST(req: Request) {
  const admin = getAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: 'Server credentials are not configured on this deployment.' },
      { status: 503 }
    );
  }

  let idToken: string | undefined;
  try {
    ({ idToken } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  let uid: string;
  try {
    uid = await requireUser(idToken);
  } catch (e) {
    const msg = e instanceof EntitlementError ? e.message : 'Not signed in.';
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  const leaderSnap = await admin.db.collection('users').doc(uid).get();
  const leader = leaderSnap.data();

  if (!leader?.isLeader || !leader.organizationId) {
    return NextResponse.json(
      { error: 'Only an organization leader can view team insights.' },
      { status: 403 }
    );
  }

  const membersSnap = await admin.db
    .collection('users')
    .where('organizationId', '==', leader.organizationId)
    .get();

  // Strip to moods immediately: nothing identifying travels further.
  const memberMoods: MoodEntry[][] = membersSnap.docs.map(
    (d) => (d.data().moods as MoodEntry[]) ?? []
  );

  const memberCount = memberMoods.length;
  const activeCount = memberMoods.filter((m) => m.length > 0).length;

  const distribution = Object.fromEntries(
    MOODS.map((m) => [m, 0])
  ) as Record<string, number>;
  for (const moods of memberMoods) {
    for (const entry of moods) {
      if (entry.mood in distribution) distribution[entry.mood] += 1;
    }
  }

  // --- The privacy floor -------------------------------------------------
  if (activeCount < MIN_COHORT_FOR_INSIGHTS) {
    return NextResponse.json({
      suppressed: true,
      reason: 'cohort_too_small',
      memberCount,
      activeCount,
      minimum: MIN_COHORT_FOR_INSIGHTS,
      distribution: null,
      insights: null,
    });
  }

  let insights = null;
  try {
    insights = await generateOrganizationInsights({
      memberCount: activeCount,
      anonymizedMemberData: memberMoods
        .filter((m) => m.length > 0)
        .map((moods) => ({ moods })),
    });
  } catch (e) {
    console.error('[ventaya] org insights generation failed:', e);
  }

  return NextResponse.json({
    suppressed: false,
    memberCount,
    activeCount,
    minimum: MIN_COHORT_FOR_INSIGHTS,
    distribution,
    totalEntries: Object.values(distribution).reduce((a, b) => a + b, 0),
    insights,
  });
}
