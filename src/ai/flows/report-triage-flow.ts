/**
 * SafeReport: AI Triage Flow
 *
 * This flow does two things:
 * 1. Classifies urgency (immediate / urgent / standard) based on what the
 *    reporter described.
 * 2. Generates a trauma-informed, plain-language summary the reporter sees
 *    after submitting: validating their experience without making clinical
 *    judgements.
 * 3. Produces a soft consistency score (0–100) for internal use only.
 *    This is NOT used to reject reports: only to flag ones that may need
 *    a human-in-the-loop review before referral. Research shows 2–10% of
 *    reports are false; 90–98% are genuine. The system defaults to believing.
 *
 * The flow deliberately avoids:
 * - Naming the accused in its output
 * - Making legal determinations
 * - Victim-blaming language
 * - Asking for more details than necessary
 */

import { z } from 'zod';
import { ai } from '@/ai/genkit';
import type { IncidentType, UrgencyLevel } from '@/lib/report-orgs';

export const ReportTriageInputSchema = z.object({
  incidentType: z.string(),
  narrative: z.string().nullable(),
  isRecent: z.boolean(),
  stateCode: z.string().nullable(),
});

export const ReportTriageOutputSchema = z.object({
  urgency: z.enum(['immediate', 'urgent', 'standard']),
  triageSummary: z.string(),
  consistencyScore: z.number().min(0).max(100),
  keyNeeds: z.array(z.string()),
  safetyRisk: z.boolean(),
});

export type ReportTriageInput = z.infer<typeof ReportTriageInputSchema>;
export type ReportTriageOutput = z.infer<typeof ReportTriageOutputSchema>;

export const reportTriageFlow = ai.defineFlow(
  {
    name: 'reportTriageFlow',
    inputSchema: ReportTriageInputSchema,
    outputSchema: ReportTriageOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: 'googleai/gemini-3.8-flash',
      prompt: `You are a trauma-informed crisis triage specialist for a sexual and gender-based violence (SGBV) support platform in Nigeria. Your role is to analyse an incident report and produce a structured assessment.

CRITICAL INSTRUCTIONS:
- You are NOT a judge or investigator. Your role is to triage urgency and connect people with help.
- Default to believing the reporter. Research shows 90-98% of reports are genuine.
- Never use victim-blaming language.
- Do not reference the accused by any name.
- The triageSummary is shown directly to the reporter: it must be compassionate, validating, and action-oriented.
- The consistencyScore is internal only: it reflects narrative consistency, NOT credibility judgement. Score 50 as the default for reports with limited narrative. Only score below 30 for severe logical contradictions (e.g. dates that are impossible).

INCIDENT DETAILS:
Type: ${input.incidentType}
Recent (within 72 hours): ${input.isRecent}
State: ${input.stateCode ?? 'Not provided'}
Narrative: ${input.narrative ? `"${input.narrative}"` : 'Reporter chose not to provide details'}

URGENCY CLASSIFICATION RULES:
- immediate: active danger, assault within 72 hours (forensic window), ongoing threat, child at risk
- urgent: recent assault (within 2 weeks), ongoing situation, significant distress
- standard: historical report, seeking support/documentation, no immediate danger

Produce a JSON response with:
- urgency: "immediate" | "urgent" | "standard"
- triageSummary: 2-3 sentence compassionate message to the reporter. Acknowledge their courage. Tell them what happens next. Do NOT minimise what happened. Write in second person ("You..."). Do not mention the accused.
- consistencyScore: 0-100 (50 = neutral/insufficient info, 80+ = highly consistent narrative, below 30 = notable contradictions)
- keyNeeds: array of 2-4 short strings describing what this person likely needs most e.g. ["Medical care", "Safe housing", "Legal support", "Counselling"]
- safetyRisk: true if reporter may currently be in danger`,
      output: { schema: ReportTriageOutputSchema },
    });

    if (!output) {
      // Fail safe: default to urgent so the person gets help
      return {
        urgency: 'urgent' as UrgencyLevel,
        triageSummary:
          'Thank you for your courage in coming forward. Your report has been received and we are connecting you with support organisations in your area. You are not alone.',
        consistencyScore: 50,
        keyNeeds: ['Emotional support', 'Professional guidance'],
        safetyRisk: false,
      };
    }

    return output;
  }
);

export async function triageReport(input: ReportTriageInput): Promise<ReportTriageOutput> {
  // Retry logic: 2 attempts, fallback to safe defaults
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return await reportTriageFlow(input);
    } catch (err) {
      if (attempt === 2) {
        console.error('[SafeReport] Triage flow failed after 2 attempts:', err);
        return {
          urgency: 'urgent',
          triageSummary:
            'Thank you for your courage in coming forward. Your report has been received and we are connecting you with support organisations in your area. You are not alone.',
          consistencyScore: 50,
          keyNeeds: ['Emotional support', 'Professional guidance'],
          safetyRisk: false,
        };
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  // TypeScript requires a return here, unreachable
  throw new Error('unreachable');
}
