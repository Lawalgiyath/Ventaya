'use client';

/**
 * SafeReport: Multi-step trauma-informed report form.
 *
 * Steps (8 total, indices 0–7):
 *  0  Safety check
 *  1  Incident type         ← only required field
 *  2  When & where
 *  3  What happened         (optional narrative)
 *  4  About the accused     (all optional)
 *  5  Privacy preferences
 *  6  Review & submit
 *  7  Confirmation          ← case ID + orgs + chat box
 *
 * Bugs fixed vs v1:
 *  - TOTAL_STEPS was 7 but confirmation was also step 6 → case ID never showed.
 *    Now TOTAL_STEPS = 8 and confirmation is step 7, distinct from review.
 *  - Exit quickly now uses window.location.replace('https://bbc.com/news') so
 *    the back button cannot return to this page.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertTriangle, ArrowLeft, ArrowRight, Check, Copy,
  ExternalLink, Loader2, Phone, Shield, LogOut,
} from 'lucide-react';
import { submitReport, type SubmitReportResult } from '@/app/actions/report';
import { NIGERIA_STATES, SUPPORT_ORGS, type IncidentType } from '@/lib/report-orgs';
import type { ReportSubmission, ReferredOrg } from '@/lib/report';
import { useApp } from '@/context/app-context';
import { cn } from '@/lib/utils';
import { ReportChatBox } from '@/components/report-chat';
import { EvidenceNotes } from '@/components/evidence-notes';
import { SafetyPlan } from '@/components/safety-plan';
import { WellbeingCheckIn } from '@/components/report-wellbeing';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 8; // 0=safety, 1=type, 2=when/where, 3=narrative, 4=accused, 5=privacy, 6=review, 7=confirm

const INCIDENT_OPTIONS: { value: IncidentType; label: string; description: string }[] = [
  { value: 'rape',                label: 'Sexual assault or rape',                description: 'Any non-consensual sexual act' },
  { value: 'child_abuse',         label: 'Child sexual abuse',                    description: 'A minor under 18 was harmed' },
  { value: 'domestic_violence',   label: 'Domestic or intimate partner violence', description: 'Abuse by a partner or family member' },
  { value: 'workplace_harassment',label: 'Workplace sexual harassment',           description: 'Harassment by a colleague or employer' },
  { value: 'trafficking',         label: 'Trafficking or sexual exploitation',    description: 'Being forced or coerced into sexual acts' },
  { value: 'online_abuse',        label: 'Online sexual abuse',                  description: 'Non-consensual sharing of images or cyber harassment' },
  { value: 'other',               label: 'Something else',                       description: 'Any other form of sexual or gender-based violence' },
];

const RELATIONSHIP_OPTIONS = [
  'Partner / spouse', 'Ex-partner', 'Family member', 'Friend',
  'Colleague', 'Employer / manager', 'Teacher / lecturer',
  'Religious leader', 'Neighbour', 'Stranger', 'Other',
];

const STEP_TITLES = [
  'Before you begin',
  'What happened',
  'When & where',
  'Your experience',
  'About the person responsible',
  'Your privacy',
  'Review & submit',
  'Report submitted',
];

// ---------------------------------------------------------------------------
// Exit quickly: replaces history entry so back button cannot return here
// ---------------------------------------------------------------------------
function exitQuickly() {
  // Replace current history entry so back button skips this page entirely
  window.location.replace('https://www.bbc.com/news');
}

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

interface FormState {
  incidentType: IncidentType | '';
  incidentDate: string;
  isRecent: boolean;
  stateCode: string;
  stateName: string;
  lga: string;
  narrative: string;
  accusedFirstName: string;
  accusedLastName: string;
  accusedRelationship: string;
  accusedWorkplace: string;
  accusedDescription: string;
  isAnonymous: boolean;
  reporterContact: string;
  consentToDataUse: boolean;
  consentToSocialAmplification: boolean;
}

const EMPTY_FORM: FormState = {
  incidentType: '', incidentDate: '', isRecent: false,
  stateCode: '', stateName: '', lga: '',
  narrative: '', accusedFirstName: '', accusedLastName: '',
  accusedRelationship: '', accusedWorkplace: '', accusedDescription: '',
  isAnonymous: true, reporterContact: '',
  consentToDataUse: false, consentToSocialAmplification: false,
};

function generateFingerprint(): string {
  try {
    return btoa(`${navigator.userAgent.slice(0, 50)}-${Math.floor(Date.now() / 3600000)}`);
  } catch {
    return `fp-${Date.now()}`;
  }
}

// ---------------------------------------------------------------------------
// Step sub-components
// ---------------------------------------------------------------------------

function StepSafetyCheck({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="space-y-1">
            <p className="font-semibold text-destructive">If you are in immediate danger</p>
            <p className="text-sm text-muted-foreground">Call <strong>112</strong> (Emergency) or <strong>0800 200 2020</strong> (NAPTIP, toll-free) right now.</p>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="font-semibold">Before you continue</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            'You are in control of every step. Nothing is sent until you choose to submit.',
            'You can remain completely anonymous: no account needed.',
            'Every detail you share is optional. Only share what you feel comfortable with.',
            'The "Exit quickly" button instantly takes you away from this page with no back button.',
            'Your report is never shown publicly and never used to name anyone publicly.',
          ].map((t, i) => (
            <li key={i} className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {t}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-sm font-medium">Are you currently safe?</p>
      <div className="flex gap-3">
        <Button className="flex-1" onClick={onContinue}>Yes, I am safe (continue)</Button>
        <Button variant="outline" className="flex-1" asChild>
          <a href="tel:112">No, call 112 now</a>
        </Button>
      </div>
    </div>
  );
}

function StepIncidentType({ value, onChange }: { value: IncidentType | ''; onChange: (v: IncidentType) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">What best describes what happened? Choose the option that feels closest.</p>
      <div className="grid gap-2">
        {INCIDENT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'w-full rounded-lg border p-4 text-left transition-colors hover:border-primary',
              value === opt.value ? 'border-primary bg-primary/5' : 'border-border bg-card'
            )}
          >
            <p className="font-medium">{opt.label}</p>
            <p className="text-sm text-muted-foreground">{opt.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepWhenWhere({ form, setForm }: { form: FormState; setForm: (f: Partial<FormState>) => void }) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">This helps us connect you with local support. All fields are optional.</p>
      <div className="space-y-2">
        <Label>Did this happen recently?</Label>
        <p className="text-xs text-muted-foreground">Within the last 72 hours, forensic medical care may still be available.</p>
        <div className="flex items-center gap-3">
          <Switch checked={form.isRecent} onCheckedChange={(v) => setForm({ isRecent: v })} id="isRecent" />
          <Label htmlFor="isRecent">{form.isRecent ? 'Yes, within the last 72 hours' : 'No, it was earlier'}</Label>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="incidentDate">Approximate date <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Input id="incidentDate" type="date" max={new Date().toISOString().split('T')[0]} value={form.incidentDate} onChange={(e) => setForm({ incidentDate: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="state">State <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Select value={form.stateCode} onValueChange={(v) => setForm({ stateCode: v, stateName: NIGERIA_STATES[v] ?? '' })}>
          <SelectTrigger id="state"><SelectValue placeholder="Select your state" /></SelectTrigger>
          <SelectContent>
            {Object.entries(NIGERIA_STATES).map(([code, name]) => (
              <SelectItem key={code} value={code}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="lga">Local Government Area <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Input id="lga" placeholder="e.g. Ikeja, Surulere..." value={form.lga} onChange={(e) => setForm({ lga: e.target.value })} />
      </div>
    </div>
  );
}

function StepNarrative({ form, setForm }: { form: FormState; setForm: (f: Partial<FormState>) => void }) {
  const remaining = 5000 - form.narrative.length;
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
        This section is completely optional. Share only what you feel comfortable with. Your words will only be seen by trained support staff at the organisations we refer you to.
      </div>
      <div className="space-y-2">
        <Label htmlFor="narrative">In your own words, what happened? <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <Textarea id="narrative" placeholder="Share as much or as little as you feel comfortable with..." className="min-h-[160px] resize-none" value={form.narrative} onChange={(e) => setForm({ narrative: e.target.value })} maxLength={5000} />
        <p className="text-right text-xs text-muted-foreground">{remaining} characters remaining</p>
      </div>
    </div>
  );
}

function StepAccused({ form, setForm }: { form: FormState; setForm: (f: Partial<FormState>) => void }) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">All fields here are optional and confidential.</p>
        <p>This information is passed only to trained case workers and is <strong>never shown publicly</strong>.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>First name <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Input placeholder="First name" value={form.accusedFirstName} onChange={(e) => setForm({ accusedFirstName: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Last name <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Input placeholder="Last name" value={form.accusedLastName} onChange={(e) => setForm({ accusedLastName: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Their relationship to you <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <Select value={form.accusedRelationship} onValueChange={(v) => setForm({ accusedRelationship: v })}>
          <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
          <SelectContent>
            {RELATIONSHIP_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Their workplace / institution <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <Input placeholder="e.g. company name, school, church..." value={form.accusedWorkplace} onChange={(e) => setForm({ accusedWorkplace: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Physical description or identifying details <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <Textarea placeholder="Any detail that could help identify them..." className="min-h-[80px] resize-none" value={form.accusedDescription} onChange={(e) => setForm({ accusedDescription: e.target.value })} />
      </div>
    </div>
  );
}

function StepPrivacy({ form, setForm }: { form: FormState; setForm: (f: Partial<FormState>) => void }) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium">Stay completely anonymous</p>
            <p className="text-sm text-muted-foreground">No name, email, or phone number will be attached to your report.</p>
          </div>
          <Switch checked={form.isAnonymous} onCheckedChange={(v) => setForm({ isAnonymous: v })} id="anonymous" />
        </div>
        <AnimatePresence>
          {!form.isAnonymous && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="space-y-2 pt-2">
                <Label htmlFor="contact">Phone number or email <span className="font-normal text-muted-foreground">(optional even here)</span></Label>
                <Input id="contact" placeholder="+234... or your@email.com" value={form.reporterContact} onChange={(e) => setForm({ reporterContact: e.target.value })} />
                <p className="text-xs text-muted-foreground">Used only by the support org to follow up. Never shared with anyone else.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="space-y-3 border-t pt-4">
        <p className="text-sm font-medium">Optional consents</p>
        <label className="flex cursor-pointer items-start gap-3">
          <Checkbox id="dataConsent" checked={form.consentToDataUse} onCheckedChange={(v) => setForm({ consentToDataUse: Boolean(v) })} className="mt-0.5" />
          <div>
            <p className="text-sm font-medium">Anonymised data use for advocacy</p>
            <p className="text-xs text-muted-foreground">Contribute to anonymised statistics and policy advocacy. No identifying information is ever used.</p>
          </div>
        </label>
        <label className="flex cursor-pointer items-start gap-3">
          <Checkbox id="socialConsent" checked={form.consentToSocialAmplification} onCheckedChange={(v) => setForm({ consentToSocialAmplification: Boolean(v) })} className="mt-0.5" />
          <div>
            <p className="text-sm font-medium">Anonymous social media awareness</p>
            <p className="text-xs text-muted-foreground">Allow an anonymised version of your case to raise awareness. No names, locations, or identifying details ever included.</p>
          </div>
        </label>
      </div>
    </div>
  );
}

function StepReview({ form }: { form: FormState }) {
  const incidentLabel = INCIDENT_OPTIONS.find((o) => o.value === form.incidentType)?.label ?? '';
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Please review before submitting. You can go back to change anything.</p>
      <div className="divide-y rounded-lg border">
        {[
          ['Incident type', incidentLabel],
          ['Location', form.stateName ? `${form.stateName}${form.lga ? `, ${form.lga}` : ''}` : 'Not provided'],
          ['Within 72h', form.isRecent ? 'Yes' : 'No'],
          ['Details', form.narrative ? `${form.narrative.slice(0, 60)}${form.narrative.length > 60 ? '...' : ''}` : 'Not provided'],
          ['Person named', form.accusedFirstName || form.accusedLastName ? `${form.accusedFirstName} ${form.accusedLastName}`.trim() : 'Not provided'],
          ['Anonymous', form.isAnonymous ? 'Yes' : 'No'],
          ['Data consent', form.consentToDataUse ? 'Yes' : 'No'],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
            <span className="text-muted-foreground shrink-0">{label}</span>
            <span className="text-right font-medium">{value}</span>
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm">
        <p className="font-medium">What happens next</p>
        <ol className="mt-1 list-decimal list-inside space-y-0.5 text-muted-foreground text-xs">
          <li>AI reviews your report and assesses urgency</li>
          <li>You are matched with the right support organisations</li>
          <li>You receive a unique Case ID to track progress and chat with support</li>
        </ol>
      </div>
    </div>
  );
}

function StepConfirmation({ caseId, triageSummary, urgency, referredOrgs, keyNeeds, safetyRisk }: {
  caseId: string; triageSummary: string; urgency: string; referredOrgs: ReferredOrg[];
  keyNeeds: string[]; safetyRisk: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(caseId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const urgencyColor =
    urgency === 'immediate' ? 'bg-destructive/10 text-destructive border-destructive/30' :
    urgency === 'urgent'    ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30' :
                              'bg-primary/10 text-primary border-primary/30';

  return (
    <div className="space-y-6">
      {/* Safety Risk Emergency Overlay: shown prominently when AI flags active danger */}
      {safetyRisk && (
        <div className="rounded-xl border-2 border-destructive bg-destructive/10 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
            <p className="font-bold text-destructive">You may currently be in danger</p>
          </div>
          <p className="text-sm text-destructive/90">
            Based on what you described, please contact emergency services immediately.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <a href="tel:112" className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-4 py-2 text-sm font-bold text-destructive-foreground hover:bg-destructive/90">
              <Phone className="h-4 w-4" /> Call 112 now
            </a>
            <a href="tel:08002002020" className="inline-flex items-center gap-1.5 rounded-lg border border-destructive px-4 py-2 text-sm font-bold text-destructive hover:bg-destructive/10">
              <Phone className="h-4 w-4" /> NAPTIP: 0800 200 2020
            </a>
          </div>
        </div>
      )}

      <div className="text-center space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Shield className="h-7 w-7 text-primary" />
        </div>
        <h3 className="text-xl font-semibold">Your report has been received</h3>
        <p className="text-sm text-muted-foreground">Thank you for your courage. You are not alone.</p>
      </div>

      {/* Case ID: the most important element on this screen */}
      <div className="rounded-xl border-2 border-primary bg-primary/5 p-5 text-center space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Your Case ID (save this now)
        </p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl font-mono font-extrabold tracking-widest text-primary">
            {caseId}
          </span>
          <Button variant="outline" size="icon" onClick={copy} className="shrink-0">
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Use this ID to check your case status, chat with support, and track progress at any time, even without an account.
        </p>
      </div>

      {/* Triage summary */}
      <div className={cn('rounded-lg border p-4 text-sm', urgencyColor)}>
        <p className="font-semibold mb-1 capitalize">{urgency} response recommended</p>
        <p>{triageSummary}</p>
      </div>

      {/* Key needs identified by AI */}
      {keyNeeds.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">What you may need right now</p>
          <div className="flex flex-wrap gap-2">
            {keyNeeds.map((need) => (
              <span key={need} className="rounded-full border bg-muted px-3 py-1 text-xs font-medium">
                {need}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Referred orgs */}
      {referredOrgs.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Support organisations matched to your report</p>
          <div className="space-y-2">
            {referredOrgs.map((r) => {
              const org = SUPPORT_ORGS.find((o) => o.id === r.orgId);
              if (!org) return null;
              return (
                <Card key={r.orgId}>
                  <CardContent className="p-3 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{org.name}</p>
                      {org.emergency24h && <Badge variant="destructive" className="text-xs shrink-0">24/7</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{org.description}</p>
                    <div className="flex flex-wrap gap-3 pt-1">
                      {org.phone && (
                        <a href={`tel:${org.phone.replace(/\s/g, '')}`} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                          <Phone className="h-3 w-3" /> {org.phone}
                        </a>
                      )}
                      {org.website && (
                        <a href={org.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                          <ExternalLink className="h-3 w-3" /> Website
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Chat box */}
      <ReportChatBox caseId={caseId} />

      {/* Wellbeing check-in */}
      <WellbeingCheckIn />

      {/* Evidence notes */}
      <EvidenceNotes caseId={caseId} />

      {/* Safety plan */}
      <SafetyPlan caseId={caseId} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ReportForm component
// ---------------------------------------------------------------------------

export function ReportForm() {
  const { user } = useApp();
  const [step, setStep] = useState(0);
  const [form, setFormState] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setForm = useCallback((partial: Partial<FormState>) => {
    setFormState((prev) => ({ ...prev, ...partial }));
  }, []);

  const canAdvance = () => step !== 1 || form.incidentType !== '';

  const next = () => { if (canAdvance()) setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1)); };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    const submission: ReportSubmission = {
      incidentType: form.incidentType as IncidentType,
      incidentDate: form.incidentDate || null,
      isRecent: form.isRecent,
      stateCode: form.stateCode || null,
      stateName: form.stateName || null,
      lga: form.lga || null,
      narrative: form.narrative || null,
      accusedFirstName: form.accusedFirstName || undefined,
      accusedLastName: form.accusedLastName || undefined,
      accusedRelationship: form.accusedRelationship || undefined,
      accusedWorkplace: form.accusedWorkplace || undefined,
      accusedDescription: form.accusedDescription || undefined,
      isAnonymous: form.isAnonymous,
      reporterContact: form.isAnonymous ? null : (form.reporterContact || null),
      reporterUid: user?.uid ?? null,
      consentToDataUse: form.consentToDataUse,
      consentToSocialAmplification: form.consentToSocialAmplification,
    };

    const res = await submitReport(submission, generateFingerprint());
    setResult(res);

    if (res.ok) {
      setStep(7); // explicitly go to confirmation step
    } else {
      setError(res.error);
    }
    setSubmitting(false);
  };

  // Step 6 = review (not yet submitted) → show 83%, step 7 = confirmed → 100%
  const progressPct = step >= 7 ? 100 : Math.round((step / 7) * 100);
  const isConfirmation = step === 7;
  const isNavStep = step > 0 && step < 7; // steps that show back/next

  return (
    <div className="mx-auto max-w-xl w-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h2 className="text-lg font-semibold">{STEP_TITLES[step]}</h2>
          {step > 0 && step < 7 && (
            <p className="text-xs text-muted-foreground">Step {step} of 6</p>
          )}
        </div>
        {/* Exit quickly button: always visible */}
        <Button
          variant="outline"
          size="sm"
          onClick={exitQuickly}
          className="shrink-0 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <LogOut className="h-3.5 w-3.5" /> Exit quickly
        </Button>
      </div>

      {/* Progress bar */}
      {step > 0 && step < 7 && (
        <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {step === 0 && <StepSafetyCheck onContinue={next} />}
          {step === 1 && <StepIncidentType value={form.incidentType} onChange={(v) => setForm({ incidentType: v })} />}
          {step === 2 && <StepWhenWhere form={form} setForm={setForm} />}
          {step === 3 && <StepNarrative form={form} setForm={setForm} />}
          {step === 4 && <StepAccused form={form} setForm={setForm} />}
          {step === 5 && <StepPrivacy form={form} setForm={setForm} />}
          {step === 6 && <StepReview form={form} />}
          {step === 7 && result?.ok && (
            <StepConfirmation
              caseId={result.caseId}
              triageSummary={result.triageSummary}
              urgency={result.urgency}
              referredOrgs={result.referredOrgs}
              keyNeeds={result.keyNeeds}
              safetyRisk={result.safetyRisk}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons: shown on steps 1–6 only */}
      {isNavStep && (
        <div className="mt-8 flex gap-3">
          <Button variant="outline" onClick={back} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {step < 6 ? (
            <Button onClick={next} disabled={!canAdvance()} className="flex-1 gap-2">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting} className="flex-1 gap-2">
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
              ) : (
                <><Shield className="h-4 w-4" /> Submit report</>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
