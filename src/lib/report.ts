/**
 * SafeReport: Firestore data types and storage logic.
 *
 * Privacy design:
 * - Every report is stored under a randomly generated caseId (UUID v4).
 *   No PII is required; the reporter never needs an account.
 * - The accused's name, if provided, is stored only in the report document
 *   and is NEVER exposed in any public-facing query or list.
 * - IP addresses are never stored.
 * - Reports are write-once from the client side (Firestore rules enforce this).
 *   Only Admin SDK (server-side) may update status fields.
 * - `reporterUid` is optional: set only when a logged-in user files a report
 *   and explicitly opts to link it to their account.
 * - False-report safeguard: every report carries a `verified: false` flag.
 *   Organisations see reports, not a public registry. Accused names never
 *   appear in any UI that is accessible without an org admin token.
 */

import type { IncidentType, UrgencyLevel } from './report-orgs';

export type ReportStatus =
  | 'received'       // just submitted, pending AI triage
  | 'triaged'        // AI has classified urgency and matched orgs
  | 'referred'       // orgs have been notified
  | 'in_support'     // a support org confirmed they are in contact
  | 'closed'         // resolved or reporter requested closure
  | 'flagged';       // flagged by org for potential false report review

export interface ReportLocation {
  stateCode: string | null;   // ISO 3166-2:NG e.g. 'NG-LA'
  stateName: string | null;
  lga: string | null;         // optional local government area
}

export interface ReportAccused {
  /**
   * All accused fields are OPTIONAL and NEVER shown publicly.
   * They exist solely to help support organisations investigate.
   */
  firstName?: string;
  lastName?: string;
  relationship?: string; // e.g. 'family member', 'colleague', 'stranger'
  workplace?: string;
  description?: string;
}

export interface ReferredOrg {
  orgId: string;
  orgName: string;
  referredAt: string; // ISO timestamp
  status: 'pending' | 'acknowledged' | 'in_contact';
}

export interface Report {
  /** Randomly generated unique case identifier: given to reporter as receipt */
  caseId: string;

  /** Firestore server timestamp as ISO string */
  createdAt: string;
  updatedAt: string;

  status: ReportStatus;

  /** Classification */
  incidentType: IncidentType;
  urgency: UrgencyLevel;

  /** When it happened: only date is collected, not time, to reduce specificity */
  incidentDate: string | null;  // 'YYYY-MM-DD' or null if reporter prefers not to say
  isRecent: boolean;            // within 72 hours: critical for forensic window

  /** Where it happened */
  location: ReportLocation;

  /**
   * Free-text narrative from the reporter.
   * Stored encrypted at rest in Firestore (handled via Firebase Security Rules +
   * server-side Admin SDK reads only).
   */
  narrative: string | null;

  /** Optional accused info: stored but never publicly surfaced */
  accused: ReportAccused | null;

  /** Whether the reporter wants to remain completely anonymous */
  isAnonymous: boolean;

  /**
   * Contact info: ONLY stored when reporter explicitly provides it and
   * isAnonymous is false. Never required.
   */
  reporterContact: string | null;  // phone or email, their choice

  /** Set when a logged-in user opts to link the report to their account */
  reporterUid: string | null;

  /** Which orgs were matched and referred */
  referredOrgs: ReferredOrg[];

  /** AI triage summary: plain language, shown to reporter */
  triageSummary: string | null;

  /**
   * Key needs identified by AI triage (e.g. ["Medical care", "Safe housing"]).
   * Shown on the confirmation screen to help the reporter understand their options.
   */
  keyNeeds: string[];

  /**
   * True if the AI triage determined the reporter may currently be in danger.
   * Forces urgency to 'immediate' and shows an emergency overlay.
   */
  safetyRisk: boolean;

  /**
   * Internal consistency score from AI (0–100).
   * Below 40 triggers a soft human-review flag: never auto-rejected.
   * Never shown to the reporter.
   */
  consistencyScore: number | null;

  /** True only after a support org manually verifies contact with the reporter */
  verified: boolean;

  /** Whether the reporter consented to anonymised data use for advocacy/statistics */
  consentToDataUse: boolean;

  /** Whether the reporter wants their case shared on social media (anonymised) */
  consentToSocialAmplification: boolean;
}

/**
 * Generate a human-friendly case ID using a CSPRNG.
 * Format: VTY-XXXXXX (6 uppercase alphanumeric chars)
 * Easy to read aloud, write down on paper, or remember.
 *
 * Uses crypto.getRandomValues (available in Node 18+, all browsers)
 * instead of Math.random so IDs cannot be predicted or enumerated.
 * With 32^6 ≈ 1.07B possible IDs, collision probability is negligible
 * for the expected volume, but the action uses Firestore `create` to
 * catch any collision deterministically.
 */
export function generateCaseId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous I/1/O/0
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let id = 'VTY-';
  for (let i = 0; i < 6; i++) {
    id += chars[bytes[i] % chars.length];
  }
  return id;
}

/**
 * Shape of the form data collected from the reporter.
 * Validated with Zod in the server action before storage.
 */
export interface ReportSubmission {
  incidentType: IncidentType;
  incidentDate: string | null;
  isRecent: boolean;
  stateCode: string | null;
  stateName: string | null;
  lga: string | null;
  narrative: string | null;
  accusedFirstName?: string;
  accusedLastName?: string;
  accusedRelationship?: string;
  accusedWorkplace?: string;
  accusedDescription?: string;
  isAnonymous: boolean;
  reporterContact: string | null;
  reporterUid: string | null;
  consentToDataUse: boolean;
  consentToSocialAmplification: boolean;
}

/** Public-safe view of a report: strips accused info, consistency score, and contact details */
export type PublicReport = Omit<Report, 'accused' | 'consistencyScore' | 'reporterContact' | 'reporterUid'>;
