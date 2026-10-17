import 'server-only';

import { FieldValue } from 'firebase-admin/firestore';
import { getAdmin, isAdminConfigured } from './firebase-admin';
import {
  checkAccess,
  isMetered,
  usageWeekKey,
  type AccessResult,
  type BillingState,
  type OrgBillingState,
} from './entitlements';
import type { Entitlement } from './plans';

/**
 * Server-side entitlement enforcement.
 *
 * The client renders locks and meters for UX, but this is what actually
 * decides whether a model call happens. Every paid capability routes through
 * `requireEntitlement` before it can spend a token.
 *
 * Enforcement is active whenever the Admin SDK is configured. Without Admin
 * credentials no one can subscribe either (webhooks can't write entitlements),
 * so the whole billing system is inert and gating would only break local dev.
 */

export class EntitlementError extends Error {
  constructor(
    message: string,
    public readonly code: 'unauthenticated' | 'quota_exceeded' | 'not_in_plan',
    public readonly access?: AccessResult
  ) {
    super(message);
    this.name = 'EntitlementError';
  }
}

export function isEnforcementActive(): boolean {
  return isAdminConfigured();
}

interface GuardContext {
  uid: string;
  access: AccessResult | null;
}

/**
 * Verify the caller, load their billing state, and check the entitlement.
 * Throws `EntitlementError` when the call must not proceed.
 */
export async function requireEntitlement(
  idToken: string | undefined,
  entitlement: Entitlement
): Promise<GuardContext> {
  const admin = getAdmin();

  // Billing not wired up yet: nothing to protect.
  if (!admin) {
    return { uid: 'dev-unenforced', access: null };
  }

  if (!idToken) {
    throw new EntitlementError('You need to be signed in.', 'unauthenticated');
  }

  let uid: string;
  try {
    const decoded = await admin.auth.verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    throw new EntitlementError(
      'Your session expired. Please sign in again.',
      'unauthenticated'
    );
  }

  const userSnap = await admin.db.collection('users').doc(uid).get();
  const userData = userSnap.data() ?? {};

  const user: BillingState = {
    plan: userData.plan ?? 'free',
    subscriptionStatus: userData.subscriptionStatus ?? null,
    currentPeriodEnd: userData.currentPeriodEnd ?? null,
  };

  let org: OrgBillingState | null = null;
  if (userData.organizationId) {
    const orgSnap = await admin.db
      .collection('organizations')
      .doc(userData.organizationId)
      .get();
    if (orgSnap.exists) {
      const o = orgSnap.data()!;
      org = {
        plan: o.plan ?? null,
        subscriptionStatus: o.subscriptionStatus ?? null,
        seatsPurchased: o.seatsPurchased ?? 0,
        seatsUsed: o.seatsUsed ?? 0,
      };
    }
  }

  const used = isMetered(entitlement) ? await getWeeklyUsage(uid) : 0;
  const access = checkAccess(entitlement, used, user, org);

  if (!access.allowed) {
    throw new EntitlementError(
      access.reason === 'quota_exceeded'
        ? `You've used all ${access.limit} AI sessions on your free plan this week. Upgrade to Plus for unlimited.`
        : 'That feature is not included in your current plan.',
      access.reason ?? 'not_in_plan',
      access
    );
  }

  return { uid, access };
}

/** Current week's metered AI usage for a user. */
export async function getWeeklyUsage(uid: string): Promise<number> {
  const admin = getAdmin();
  if (!admin) return 0;

  const snap = await admin.db.collection('usage').doc(uid).get();
  if (!snap.exists) return 0;
  return (snap.data()?.[usageWeekKey()] as number | undefined) ?? 0;
}

/**
 * Record one metered action. Called only after the model call succeeds, so a
 * failed generation never burns a user's quota.
 */
export async function recordUsage(
  uid: string,
  entitlement: Entitlement
): Promise<void> {
  const admin = getAdmin();
  if (!admin || uid === 'dev-unenforced' || !isMetered(entitlement)) return;

  await admin.db
    .collection('usage')
    .doc(uid)
    .set(
      {
        [usageWeekKey()]: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}

/** Verify a token and return the uid, without any entitlement check. */
export async function requireUser(idToken: string | undefined): Promise<string> {
  const admin = getAdmin();
  if (!admin) return 'dev-unenforced';
  if (!idToken) {
    throw new EntitlementError('You need to be signed in.', 'unauthenticated');
  }
  try {
    const decoded = await admin.auth.verifyIdToken(idToken);
    return decoded.uid;
  } catch {
    throw new EntitlementError(
      'Your session expired. Please sign in again.',
      'unauthenticated'
    );
  }
}
