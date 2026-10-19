'use server';

/**
 * SafeReport: Server Actions
 *
 * All Firestore writes go through here via the Admin SDK so:
 * 1. Schema validation (Zod) runs before anything hits the DB.
 * 2. Firestore rules block direct client writes to /reports entirely.
 * 3. AI triage runs server-side: Gemini key never reaches the client.
 * 4. Sensitive fields (accused, consistencyScore) stripped before returning.
 *
 * Improvements vs v1:
 * - safetyRisk from triage forces urgency to 'immediate'
 * - consistencyScore < 40 auto-sets status to 'flagged' for human review
 * - keyNeeds stored in Firestore and returned to client for confirmation UI
 * - Firestore `create` used instead of `set` to catch caseId collisions
 * - Rate limiting moved to a Firestore counter (survives cold starts on Vercel)
 */

import { z } from 'zod';
import { getAdmin } from '@/lib/firebase-admin';
import { generateCaseId } from '@/lib/report';
import type { Report, ReportSubmission, PublicReport, ReferredOrg } from '@/lib/report';
import { matchOrgs } from '@/lib/report-orgs';
import { triageReport } from '@/ai/flows/report-triage-flow';
import type { IncidentType, UrgencyLevel } from '@/lib/report-orgs';
import { FieldValue } from 'firebase-admin/firestore';

// ── Zod validation schema ─────────────────────────────────────────────────

const SubmissionSchema = z.object({
  incidentType: z.enum([
    'rape', 'child_abuse', 'domestic_violence',
    'workplace_harassment', 'trafficking', 'online_abuse', 'other',
  ]),
  incidentDate: z.string().nullable(),
  isRecent: z.boolean(),
  stateCode: z.string().nullable(),
  stateName: z.string().nullable(),
  lga: z.string().nullable(),
  narrative: z.string().max(5000).nullable(),
  accusedFirstName: z.string().max(100).optional(),
  accusedLastName: z.string().max(100).optional(),
  accusedRelationship: z.string().max(200).optional(),
  accusedWorkplace: z.string().max(200).optional(),
  accusedDescription: z.string().max(500).optional(),
  isAnonymous: z.boolean(),
  reporterContact: z.string().max(200).nullable(),
  reporterUid: z.string().nullable(),
  consentToDataUse: z.boolean(),
  consentToSocialAmplification: z.boolean(),
});

// ── Result types ──────────────────────────────────────────────────────────

export type SubmitReportResult =
  | {
      ok: true;
      caseId: string;
      triageSummary: string;
      urgency: string;
      referredOrgs: ReferredOrg[];
      keyNeeds: string[];
      safetyRisk: boolean;
      stateCode?: string | null;
    }
  | { ok: false; error: string; code: 'validation' | 'rate_limit' | 'failed' };

export type LookupReportResult =
  | { ok: true; report: PublicReport }
  | { ok: false; error: string; code: 'not_found' | 'failed' };

// ── Rate limiting via Firestore (survives serverless cold starts) ─────────
// Falls back to in-memory on dev (no Admin SDK).

const memLimit = new Map<string, { count: number; ts: number }>();
const RATE_MAX = 3;
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

async function checkRateLimit(fingerprint: string): Promise<boolean> {
  const admin = getAdmin();
  if (!admin) {
    // Dev fallback: in-memory is fine locally
    const now = Date.now();
    const e = memLimit.get(fingerprint);
    if (!e || now - e.ts > RATE_WINDOW) { memLimit.set(fingerprint, { count: 1, ts: now }); return true; }
    if (e.count >= RATE_MAX) return false;
    e.count++;
    return true;
  }

  const ref = admin.db.collection('_rate_limits').doc(fingerprint);
  const now = Date.now();
  try {
    await admin.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.data() ?? { count: 0, windowStart: now };
      const windowStart = data.windowStart as number;
      const count = (data.count as number) ?? 0;

      if (now - windowStart > RATE_WINDOW) {
        tx.set(ref, { count: 1, windowStart: now, updatedAt: FieldValue.serverTimestamp() });
        return;
      }
      if (count >= RATE_MAX) throw new Error('rate_limited');
      tx.update(ref, { count: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() });
    });
    return true;
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'rate_limited') return false;
    // Transaction error: fail open (don't block a survivor)
    console.error('[SafeReport] Rate limit check failed:', e);
    return true;
  }
}

// ── Submit a new report ───────────────────────────────────────────────────

export async function submitReport(
  submission: ReportSubmission,
  sessionFingerprint: string,
): Promise<SubmitReportResult> {
  // 1. Rate limit
  const allowed = await checkRateLimit(sessionFingerprint);
  if (!allowed) {
    return {
      ok: false,
      error: 'Too many reports submitted in the last hour. Please wait, or call NAPTIP on 0800 200 2020 directly.',
      code: 'rate_limit',
    };
  }

  // 2. Validate
  const parsed = SubmissionSchema.safeParse(submission);
  if (!parsed.success) {
    return { ok: false, error: 'Some information provided was invalid. Please review and try again.', code: 'validation' };
  }
  const data = parsed.data;

  try {
    // 3. AI triage (always runs: never blocks filing even if AI fails)
    const triage = await triageReport({
      incidentType: data.incidentType,
      narrative: data.narrative,
      isRecent: data.isRecent,
      stateCode: data.stateCode,
    });

    // 4. safetyRisk overrides urgency to 'immediate'
    const urgency: UrgencyLevel = triage.safetyRisk ? 'immediate' : triage.urgency;

    // 5. Match organisations based on final urgency
    const matchedOrgs = matchOrgs(data.stateCode, data.incidentType as IncidentType, urgency);
    const referredOrgs: ReferredOrg[] = matchedOrgs.map((org) => ({
      orgId: org.id,
      orgName: org.shortName,
      referredAt: new Date().toISOString(),
      status: 'pending' as const,
    }));

    // 6. Determine status: auto-flag low consistency scores for human review
    const status: Report['status'] =
      typeof triage.consistencyScore === 'number' && triage.consistencyScore < 40
        ? 'flagged'
        : 'triaged';

    // 7. Generate collision-safe case ID (retries once on collision)
    let caseId = generateCaseId();
    const now = new Date().toISOString();

    // 8. Build complete report document
    const report: Report = {
      caseId,
      createdAt: now,
      updatedAt: now,
      status,
      incidentType: data.incidentType as IncidentType,
      urgency,
      incidentDate: data.incidentDate,
      isRecent: data.isRecent,
      location: { stateCode: data.stateCode, stateName: data.stateName, lga: data.lga },
      narrative: data.narrative,
      accused: (data.accusedFirstName || data.accusedLastName || data.accusedDescription)
        ? {
            firstName: data.accusedFirstName,
            lastName: data.accusedLastName,
            relationship: data.accusedRelationship,
            workplace: data.accusedWorkplace,
            description: data.accusedDescription,
          }
        : null,
      isAnonymous: data.isAnonymous,
      reporterContact: data.isAnonymous ? null : (data.reporterContact ?? null),
      reporterUid: data.reporterUid ?? null,
      referredOrgs,
      triageSummary: triage.triageSummary,
      keyNeeds: triage.keyNeeds,
      safetyRisk: triage.safetyRisk,
      consistencyScore: triage.consistencyScore,
      verified: false,
      consentToDataUse: data.consentToDataUse,
      consentToSocialAmplification: data.consentToSocialAmplification,
    };

    // 9. Persist to Firestore
    const admin = getAdmin();
    if (admin) {
      const docRef = admin.db.collection('reports').doc(caseId);
      try {
        await docRef.create({
          ...report,
          createdAtTs: FieldValue.serverTimestamp(),
          updatedAtTs: FieldValue.serverTimestamp(),
        });
      } catch (createErr: unknown) {
        // If collision (document already exists), regenerate once and retry
        if ((createErr as { code?: number }).code === 6) {
          caseId = generateCaseId();
          report.caseId = caseId;
          await admin.db.collection('reports').doc(caseId).create({
            ...report,
            createdAtTs: FieldValue.serverTimestamp(),
            updatedAtTs: FieldValue.serverTimestamp(),
          });
        } else {
          throw createErr;
        }
      }

      // Also send a system welcome message to open the chat thread
      await admin.db
        .collection('report-chats')
        .doc(caseId)
        .collection('messages')
        .add({
          caseId,
          sender: 'system',
          senderLabel: 'SafeReport',
          content: `Your report (${caseId}) has been received. A support team member will respond here as soon as possible. You can also call NAPTIP on 0800 200 2020 at any time.`,
          createdAt: now,
          createdAtTs: FieldValue.serverTimestamp(),
          read: false,
        });

      // Initialise the chat thread document
      await admin.db
        .collection('report-chats')
        .doc(caseId)
        .set({
          caseId,
          createdAt: now,
          lastMessageAt: now,
          lastMessagePreview: 'Your report has been received.',
          reporterUnread: 0,
          supportUnread: 0,
          supportJoined: false,
        });

      // If logged-in non-anonymous reporter: link caseId to their profile
      if (data.reporterUid && !data.isAnonymous) {
        await admin.db
          .collection('users')
          .doc(data.reporterUid)
          .set({ reportCaseIds: FieldValue.arrayUnion(caseId) }, { merge: true });
      }
    } else {
      console.warn('[SafeReport] Admin SDK not configured: report not persisted:', caseId);
    }

    return {
      ok: true,
      caseId,
      triageSummary: triage.triageSummary,
      urgency,
      referredOrgs,
      keyNeeds: triage.keyNeeds,
      safetyRisk: triage.safetyRisk,
      stateCode: data.stateCode ?? null,
    };
  } catch (err) {
    console.error('[SafeReport] submitReport failed:', err);
    return {
      ok: false,
      error: 'We could not process your report right now. Please call NAPTIP on 0800 200 2020 immediately.',
      code: 'failed',
    };
  }
}

// ── Look up a report by case ID ───────────────────────────────────────────

export async function lookupReport(caseId: string): Promise<LookupReportResult> {
  const normalized = caseId.trim().toUpperCase();
  if (!/^VTY-[A-Z2-9]{6}$/.test(normalized)) {
    return { ok: false, error: 'Invalid case ID format. It should look like VTY-XXXXXX.', code: 'not_found' };
  }

  const admin = getAdmin();
  if (!admin) {
    return {
      ok: false,
      error: 'Case lookup requires the database to be configured. Contact support if you need help.',
      code: 'failed',
    };
  }

  try {
    const snap = await admin.db.collection('reports').doc(normalized).get();
    if (!snap.exists) {
      return { ok: false, error: 'No report found with that case ID. Please check and try again.', code: 'not_found' };
    }

    const d = snap.data() as Report;

    // Strip all sensitive fields before returning
    const pub: PublicReport = {
      caseId: d.caseId,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      status: d.status,
      incidentType: d.incidentType,
      urgency: d.urgency,
      incidentDate: d.incidentDate,
      isRecent: d.isRecent,
      location: d.location,
      narrative: d.narrative,
      isAnonymous: d.isAnonymous,
      referredOrgs: d.referredOrgs,
      triageSummary: d.triageSummary,
      keyNeeds: d.keyNeeds ?? [],
      safetyRisk: d.safetyRisk ?? false,
      verified: d.verified,
      consentToDataUse: d.consentToDataUse,
      consentToSocialAmplification: d.consentToSocialAmplification,
    };

    return { ok: true, report: pub };
  } catch (err) {
    console.error('[SafeReport] lookupReport failed:', err);
    return { ok: false, error: 'Could not retrieve report. Please try again.', code: 'failed' };
  }
}

// ── Anonymous statistics (public, safe to expose) ────────────────────────

export type StatsResult =
  | { ok: true; stats: ReportStats }
  | { ok: false; error: string };

export interface ReportStats {
  total: number;
  byType: Record<string, number>;
  byState: Record<string, number>;
  byUrgency: Record<string, number>;
  recentCount: number; // last 30 days
}

export async function getAnonymousStats(): Promise<StatsResult> {
  const admin = getAdmin();
  if (!admin) {
    // Return placeholder stats for dev mode
    return {
      ok: true,
      stats: {
        total: 0,
        byType: {},
        byState: {},
        byUrgency: {},
        recentCount: 0,
      },
    };
  }

  try {
    const snap = await admin.db
      .collection('reports')
      .where('consentToDataUse', '==', true)
      .get();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString();

    const stats: ReportStats = { total: 0, byType: {}, byState: {}, byUrgency: {}, recentCount: 0 };

    snap.docs.forEach((d) => {
      const r = d.data() as Partial<Report>;
      stats.total++;

      // Only count reports from the last 30 days in recentCount
      if (r.createdAt && r.createdAt > cutoff) stats.recentCount++;

      if (r.incidentType) {
        stats.byType[r.incidentType] = (stats.byType[r.incidentType] ?? 0) + 1;
      }
      if (r.location?.stateName) {
        stats.byState[r.location.stateName] = (stats.byState[r.location.stateName] ?? 0) + 1;
      }
      if (r.urgency) {
        stats.byUrgency[r.urgency] = (stats.byUrgency[r.urgency] ?? 0) + 1;
      }
    });

    return { ok: true, stats };
  } catch (err) {
    console.error('[SafeReport] getAnonymousStats failed:', err);
    return { ok: false, error: 'Could not load statistics.' };
  }
}
