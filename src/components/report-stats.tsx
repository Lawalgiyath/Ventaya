'use client';

/**
 * SafeReport: Anonymous Statistics Dashboard
 *
 * Only shows data from reports where consentToDataUse === true.
 * No PII. No case IDs. Only aggregated counts by type, state, urgency.
 */

import { useEffect, useState } from 'react';
import { getAnonymousStats, type ReportStats } from '@/app/actions/report';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChart2, MapPin, AlertTriangle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_LABELS: Record<string, string> = {
  rape: 'Sexual assault / rape',
  child_abuse: 'Child sexual abuse',
  domestic_violence: 'Domestic violence',
  workplace_harassment: 'Workplace harassment',
  trafficking: 'Trafficking',
  online_abuse: 'Online abuse',
  other: 'Other',
};

const URGENCY_COLORS: Record<string, string> = {
  immediate: 'bg-destructive',
  urgent: 'bg-yellow-500',
  standard: 'bg-primary',
};

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono w-6 text-right text-muted-foreground">{value}</span>
    </div>
  );
}

export function ReportStats() {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAnonymousStats().then((res) => {
      if (res.ok) setStats(res.stats);
      else setError(res.error);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {error ?? 'Could not load statistics.'}
      </div>
    );
  }

  const maxType = Math.max(...Object.values(stats.byType), 1);
  const maxState = Math.max(...Object.values(stats.byState), 1);
  const topStates = Object.entries(stats.byState)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">SafeReport: Impact Statistics</h2>
        <p className="text-sm text-muted-foreground">
          Anonymised data from reporters who consented to contribute to advocacy research.
          No names, locations, or identifying details are included.
        </p>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: BarChart2, label: 'Total reports', value: stats.total, color: 'text-primary' },
          { icon: TrendingUp, label: 'Last 30 days', value: stats.recentCount, color: 'text-primary' },
          { icon: AlertTriangle, label: 'Immediate urgency', value: stats.byUrgency.immediate ?? 0, color: 'text-destructive' },
          { icon: MapPin, label: 'States represented', value: Object.keys(stats.byState).length, color: 'text-primary' },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-4 space-y-1">
              <Icon className={cn('h-5 w-5', color)} />
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* By incident type */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Reports by type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
              <div key={type} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{TYPE_LABELS[type] ?? type}</span>
                </div>
                <Bar value={count} max={maxType} color="bg-primary" />
              </div>
            ))}
            {Object.keys(stats.byType).length === 0 && (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            )}
          </CardContent>
        </Card>

        {/* By urgency + top states */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Reports by urgency</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {['immediate', 'urgent', 'standard'].map((level) => (
                <div key={level} className="space-y-1">
                  <span className="text-xs text-muted-foreground capitalize">{level}</span>
                  <Bar
                    value={stats.byUrgency[level] ?? 0}
                    max={Math.max(...Object.values(stats.byUrgency), 1)}
                    color={URGENCY_COLORS[level] ?? 'bg-primary'}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Top states</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topStates.map(([state, count]) => (
                <div key={state} className="space-y-1">
                  <span className="text-xs text-muted-foreground">{state}</span>
                  <Bar value={count} max={maxState} color="bg-primary" />
                </div>
              ))}
              {topStates.length === 0 && (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Data updated in real-time. Only includes reports with explicit consent for anonymised data use.
      </p>
    </div>
  );
}
