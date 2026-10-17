'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Phone, ExternalLink, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { lookupReport } from '@/app/actions/report';
import { SUPPORT_ORGS } from '@/lib/report-orgs';
import type { PublicReport } from '@/lib/report';
import { cn } from '@/lib/utils';
import { ReportChatBox } from '@/components/report-chat';
import { EvidenceNotes } from '@/components/evidence-notes';
import { SafetyPlan } from '@/components/safety-plan';

const STATUS_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  received:   { label: 'Received',     color: 'bg-muted text-muted-foreground',         icon: Clock },
  triaged:    { label: 'Being assessed', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400', icon: Clock },
  referred:   { label: 'Referred to support', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400', icon: CheckCircle2 },
  in_support: { label: 'Support in progress', color: 'bg-primary/10 text-primary',      icon: CheckCircle2 },
  closed:     { label: 'Closed',       color: 'bg-muted text-muted-foreground',         icon: CheckCircle2 },
  flagged:    { label: 'Under review', color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400', icon: AlertCircle },
};

const URGENCY_META: Record<string, { label: string; color: string }> = {
  immediate: { label: 'Immediate response', color: 'bg-destructive/10 text-destructive border-destructive/30' },
  urgent:    { label: 'Urgent',             color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30' },
  standard:  { label: 'Standard',           color: 'bg-primary/10 text-primary border-primary/30' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function CaseLookup() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<PublicReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    const normalized = input.trim().toUpperCase();
    if (!normalized) return;

    setLoading(true);
    setError(null);
    setReport(null);

    const res = await lookupReport(normalized);

    if (res.ok) {
      setReport(res.report);
    } else {
      setError(res.error);
    }
    setLoading(false);
  };

  const statusMeta = report ? (STATUS_META[report.status] ?? STATUS_META.received) : null;
  const urgencyMeta = report ? (URGENCY_META[report.urgency] ?? URGENCY_META.standard) : null;
  const StatusIcon = statusMeta?.icon ?? Clock;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Enter the Case ID you received when you submitted your report (format: VTY-XXXXXX).
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="VTY-XXXXXX"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            className="font-mono uppercase"
            maxLength={10}
          />
          <Button onClick={handleLookup} disabled={loading || !input.trim()} className="gap-2 shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Look up
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {report && statusMeta && urgencyMeta && (
        <div className="space-y-4">
          {/* Status card */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono font-bold text-lg text-primary">{report.caseId}</p>
                <Badge className={cn('gap-1.5', statusMeta.color)}>
                  <StatusIcon className="h-3 w-3" />
                  {statusMeta.label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span className="text-muted-foreground">Submitted</span>
                <span className="font-medium">{formatDate(report.createdAt)}</span>
                <span className="text-muted-foreground">Last updated</span>
                <span className="font-medium">{formatDate(report.updatedAt)}</span>
                <span className="text-muted-foreground">Urgency</span>
                <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium border w-fit', urgencyMeta.color)}>
                  {urgencyMeta.label}
                </span>
              </div>

              {report.triageSummary && (
                <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground border-l-2 border-primary">
                  {report.triageSummary}
                </div>
              )}

              {report.keyNeeds && report.keyNeeds.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Identified needs</p>
                  <div className="flex flex-wrap gap-1.5">
                    {report.keyNeeds.map((need) => (
                      <span key={need} className="rounded-full border bg-muted px-2.5 py-0.5 text-xs font-medium">
                        {need}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Referred orgs */}
          {report.referredOrgs.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Organisations supporting your case</p>
              {report.referredOrgs.map((r) => {
                const org = SUPPORT_ORGS.find((o) => o.id === r.orgId);
                return (
                  <Card key={r.orgId} className="overflow-hidden">
                    <CardContent className="p-3 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">{org?.name ?? r.orgName}</p>
                        <Badge
                          variant="outline"
                          className={cn('text-xs shrink-0', {
                            'text-primary border-primary': r.status === 'in_contact',
                            'text-yellow-600 border-yellow-400': r.status === 'acknowledged',
                          })}
                        >
                          {r.status === 'in_contact' ? 'In contact' : r.status === 'acknowledged' ? 'Acknowledged' : 'Notified'}
                        </Badge>
                      </div>
                      {org && <p className="text-xs text-muted-foreground">{org.description}</p>}
                      <div className="flex flex-wrap gap-3">
                        {(org?.phone ?? null) && (
                          <a href={`tel:${org!.phone!.replace(/\s/g, '')}`} className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                            <Phone className="h-3 w-3" /> {org!.phone}
                          </a>
                        )}
                        {(org?.website ?? null) && (
                          <a href={org!.website!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                            <ExternalLink className="h-3 w-3" /> Website
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Chat box: always shown when a valid report is loaded */}
          <ReportChatBox caseId={report.caseId} />

          {/* Evidence notes */}
          <EvidenceNotes caseId={report.caseId} />

          {/* Safety plan */}
          <SafetyPlan caseId={report.caseId} />
        </div>
      )}
    </div>
  );
}
