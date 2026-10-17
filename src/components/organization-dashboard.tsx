
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/app-context';
import { useRouter } from 'next/navigation';
import { BarChart as BarChartIcon, BookHeart, Briefcase, CheckCircle, ClipboardCopy, Download, Filter, HeartPulse, Loader2, LogOut, Mail, Send, Users, User, Smile, Meh, Frown } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useToast } from '@/hooks/use-toast';
import type { OrganizationInsightsOutput } from '@/ai/flows/organization-insights-flow';
import { auth } from '@/lib/firebase';
import { MIN_COHORT_FOR_INSIGHTS } from '@/lib/plans';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from './ui/chart';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

/**
 * Aggregate-only view of the organization. Deliberately contains no member
 * identifiers: the server never sends them, so they cannot leak from here.
 */
interface OrgAggregate {
    suppressed: boolean;
    memberCount: number;
    activeCount: number;
    minimum: number;
    distribution: Record<string, number> | null;
    totalEntries?: number;
    insights: OrganizationInsightsOutput | null;
}

const EmptyState = ({ organizationCode, onInviteClick }: { organizationCode: string, onInviteClick: () => void }) => (
    <div className="text-center max-w-2xl mx-auto py-16">
        <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 border-4 border-primary/20 flex items-center justify-center mb-6 animate-pulse">
            <Users className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome to Your Wellness Dashboard!</h2>
        <p className="mt-4 text-lg text-muted-foreground">
            Once your team members start using the app, you’ll see powerful, anonymized insights here to help you boost productivity, morale, and well-being.
        </p>
        <Card className="mt-8 text-left bg-secondary/50 border-dashed">
            <CardHeader>
                <CardTitle className="text-lg">Your First Step: Invite Your Team</CardTitle>
                <CardDescription>Share this unique code with your members. They will be prompted to enter it during signup.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4 p-3 bg-background rounded-lg">
                    <p className="text-2xl font-mono flex-1">{organizationCode}</p>
                    <Button variant="ghost" size="icon" onClick={onInviteClick}>
                        <ClipboardCopy className="h-5 w-5" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
);

export default function OrganizationDashboard() {
    const { user, logout, loading: appLoading, organization } = useApp();
    const router = useRouter();
    const { toast } = useToast();
    const [aggregate, setAggregate] = useState<OrgAggregate | null>(null);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!appLoading && (!user || !user.isLeader)) {
          router.replace('/organization/login');
        }
      }, [user, appLoading, router]);

    // All aggregation happens server-side. The client never receives member
    // names, emails or individual mood histories: only counts.
    useEffect(() => {
        if (appLoading) return;
        if (!user?.isLeader || !user.organizationId) {
            setLoadingData(false);
            return;
        }

        let cancelled = false;
        (async () => {
            setLoadingData(true);
            try {
                const idToken = await auth.currentUser?.getIdToken();
                const res = await fetch('/api/org/insights', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Request failed');
                if (!cancelled) setAggregate(data as OrgAggregate);
            } catch (error) {
                console.error('Error loading organization insights:', error);
                if (!cancelled) {
                    toast({
                        variant: 'destructive',
                        title: 'Could not load insights',
                        description: error instanceof Error ? error.message : 'Please try again.',
                    });
                }
            } finally {
                if (!cancelled) setLoadingData(false);
            }
        })();

        return () => { cancelled = true; };
    }, [user?.organizationId, user?.isLeader, appLoading, toast]);

    const handleLogout = async () => {
        await logout();
        router.replace('/organization/login');
    };

    const copyInviteCode = () => {
        if(organization?.id){
            navigator.clipboard.writeText(organization.id);
            toast({ title: 'Code Copied!', description: 'Your organization code has been copied to the clipboard.' });
        }
    };
    
    const moodDistribution = useMemo(
        () => Object.entries(aggregate?.distribution ?? {}).map(([name, value]) => ({ name, value })),
        [aggregate]
    );

    const memberCount = aggregate?.memberCount ?? 0;
    const insights = aggregate?.suppressed ? null : aggregate?.insights ?? null;

    const chartConfig = {
      value: {
        label: "Count",
        color: "hsl(var(--primary))",
      },
    } satisfies ChartConfig;

    if (appLoading || loadingData || !user || !organization) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-secondary/30">
            <header className="bg-background shadow-sm">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-20 items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Briefcase className="h-7 w-7 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold font-headline">{organization.name}</h1>
                                <p className="text-sm text-muted-foreground">Organization Wellness Dashboard</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <Button variant="outline" onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" /> Log Out
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                {memberCount === 0 ? (
                    <EmptyState organizationCode={organization.id} onInviteClick={copyInviteCode} />
                ) : (
                    <div className="grid gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{memberCount}</div>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Overall Mood</CardTitle>
                                    <Smile className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{insights?.overallMood ?? 'Not yet'}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Key Theme</CardTitle>
                                    <BookHeart className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                     <div className="text-2xl font-bold">{insights?.keyTheme ?? 'Not yet'}</div>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{insights?.engagementLevel ?? 'Not yet'}</div>
                                </CardContent>
                            </Card>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                           <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>Mood Distribution</CardTitle>
                                    <CardDescription>Aggregate counts across the whole team. No entry can be traced to a person.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                                        <BarChart accessibilityLayer data={moodDistribution}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                                            <YAxis />
                                            <ChartTooltip
                                                cursor={{ fill: 'hsl(var(--secondary))' }}
                                                content={<ChartTooltipContent />}
                                            />
                                            <Bar dataKey="value" fill="hsl(var(--primary))" radius={4} />
                                        </BarChart>
                                    </ChartContainer>
                                </CardContent>
                           </Card>
                           <div className="space-y-6">
                            <Card className="bg-primary/5 flex flex-col">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <HeartPulse className="text-primary" />
                                            AI Wellness Insights
                                        </CardTitle>
                                        <CardDescription>Actionable recommendations based on the latest data.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        {aggregate?.suppressed ? (
                                            <div className="rounded-lg border border-oxblood/30 bg-oxblood/5 p-4">
                                                <p className="font-medium">Insights are hidden for now</p>
                                                <p className="mt-1.5 text-muted-foreground">
                                                    {aggregate.activeCount} of {aggregate.minimum} members needed are active.
                                                    Below {aggregate.minimum}, aggregate figures could identify individuals,
                                                    so we show nothing at all.
                                                </p>
                                            </div>
                                        ) : insights ? (
                                            <div className="space-y-4 text-sm">
                                                {insights.recommendations.map((rec, index) => (
                                                    <Alert key={index} variant="default" className="bg-background">
                                                        <AlertTitle className="font-semibold">{rec.title}</AlertTitle>
                                                        <AlertDescription>{rec.description}</AlertDescription>
                                                    </Alert>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground text-center">No insights generated yet.</p>
                                        )}
                                    </CardContent>
                                    <CardFooter>
                                        <p className="text-xs text-muted-foreground">
                                            Aggregated across {aggregate?.activeCount ?? 0} active members.
                                            Individual entries are never shown to anyone in your organization.
                                        </p>
                                    </CardFooter>
                            </Card>
                             <Card>
                                <CardHeader>
                                    <CardTitle>Invite Members</CardTitle>
                                    <CardDescription>Share this code with your team members to join.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4 p-3 bg-secondary rounded-lg">
                                        <p className="text-xl font-mono flex-1 truncate">{organization.id}</p>
                                        <Button variant="secondary" size="icon" onClick={copyInviteCode}>
                                            <ClipboardCopy className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                           </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
