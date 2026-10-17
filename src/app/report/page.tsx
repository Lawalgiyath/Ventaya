import type { Metadata } from 'next';
import { Shield, Phone, BookOpen, BarChart2, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportForm } from '@/components/report-form';
import { CaseLookup } from '@/components/case-lookup';
import { ReportStats } from '@/components/report-stats';
import { SUPPORT_ORGS } from '@/lib/report-orgs';

export const metadata: Metadata = {
  title: 'SafeReport: Confidential Support & Incident Reporting',
  description:
    'Confidential, anonymous sexual and gender-based violence reporting. We connect you with the right support organisations in Nigeria.',
  robots: { index: false, follow: false }, // keep off search engines for safety
};

// Emergency contacts pulled from the single source of truth
const EMERGENCY_ORGS = SUPPORT_ORGS.filter((o) => o.emergency24h);

export default function ReportPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-4 py-10 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight font-display">SafeReport</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            A safe, confidential space to report sexual and gender-based violence.
            You can stay completely anonymous. We will connect you with the right support.
          </p>
        </div>
      </div>

      {/* Emergency strip */}
      <div className="border-b bg-destructive/5 border-destructive/20">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="flex items-start gap-2">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span className="text-sm font-semibold text-destructive">In immediate danger?</span>
              {EMERGENCY_ORGS.map((o) => (
                o.phone && (
                  <a key={o.id} href={`tel:${o.phone.replace(/\s/g, '')}`}
                    className="text-sm text-destructive hover:underline font-medium">
                    {o.shortName}: <span className="font-mono">{o.phone}</span>
                  </a>
                )
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Tabs defaultValue="report">
          <TabsList className="w-full mb-8 grid grid-cols-4">
            <TabsTrigger value="report" className="gap-1.5">
              <Shield className="h-4 w-4" /><span className="hidden sm:inline">Make a report</span><span className="sm:hidden">Report</span>
            </TabsTrigger>
            <TabsTrigger value="lookup" className="gap-1.5">
              <BookOpen className="h-4 w-4" /><span className="hidden sm:inline">Check status</span><span className="sm:hidden">Status</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="gap-1.5">
              <Phone className="h-4 w-4" /><span className="hidden sm:inline">Helplines</span><span className="sm:hidden">Help</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-1.5">
              <BarChart2 className="h-4 w-4" /><span className="hidden sm:inline">Statistics</span><span className="sm:hidden">Stats</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="report">
            <ReportForm />
          </TabsContent>

          <TabsContent value="lookup">
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Check your case status</h2>
                <p className="text-sm text-muted-foreground">
                  Enter the Case ID you received when you submitted your report.
                </p>
              </div>
              <CaseLookup />
            </div>
          </TabsContent>

          <TabsContent value="resources">
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Support organisations & helplines</h2>
                <p className="text-sm text-muted-foreground">
                  You can contact any of these organisations directly. All services are free and confidential.
                </p>
              </div>
              <div className="grid gap-4">
                {SUPPORT_ORGS.map((org) => (
                  <div key={org.id} className="rounded-lg border bg-card p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{org.name}</p>
                      {org.emergency24h && (
                        <span className="shrink-0 rounded-full bg-destructive/10 text-destructive text-xs font-medium px-2 py-0.5">
                          24/7
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{org.description}</p>
                    <div className="flex flex-wrap gap-3 pt-1">
                      {org.phone && (
                        <a href={`tel:${org.phone.replace(/\s/g, '')}`}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                          <Phone className="h-3.5 w-3.5" /> {org.phone}
                        </a>
                      )}
                      {org.altPhone && (
                        <a href={`tel:${org.altPhone.replace(/\s/g, '')}`}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                          <Phone className="h-3.5 w-3.5" /> {org.altPhone}
                        </a>
                      )}
                      {org.website && (
                        <a href={org.website} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                          <ExternalLink className="h-3.5 w-3.5" /> Website
                        </a>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {org.type.map((t) => (
                        <span key={t} className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground capitalize">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm space-y-1">
                <p className="font-medium">A note on privacy</p>
                <p className="text-muted-foreground">
                  This page is not indexed by search engines. Your browser history is the only record of your visit.
                  Consider using a private or incognito window if you share a device.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <ReportStats />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
