'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, MessageSquare, Phone, ShieldAlert } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/app-context';
import {
  REGIONS,
  INTERNATIONAL,
  guessRegionCode,
  regionByCode,
  type Resource,
} from '@/lib/crisis-resources';

export default function ResourceDirectory() {
  const { addAchievement } = useApp();
  const [code, setCode] = useState('US');

  useEffect(() => {
    setCode(guessRegionCode());
  }, []);

  useEffect(() => {
    addAchievement('firstResource');
  }, [addAchievement]);

  const region = regionByCode(code) ?? REGIONS[0];

  return (
    <div className="space-y-6">
      {/* Emergency guidance sits above everything: it must never require a
          scroll to reach. */}
      <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium">If you are in immediate danger</p>
            <p className="text-sm text-muted-foreground">
              Call emergency services on{' '}
              <span className="font-semibold text-foreground">
                {region.emergency}
              </span>{' '}
              in {region.country}, or go to your nearest emergency department.
            </p>
          </div>
        </div>
        <Button asChild variant="destructive" className="shrink-0">
          <a href={`tel:${region.emergency}`}>Call {region.emergency}</a>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Support & crisis lines</CardTitle>
            <CardDescription>
              Free, confidential help from people trained to listen.
            </CardDescription>
          </div>
          <Select value={code} onValueChange={setCode}>
            <SelectTrigger className="w-[190px]" aria-label="Choose your country">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((r) => (
                <SelectItem key={r.code} value={r.code}>
                  {r.country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-2">
          {region.resources.map((r) => (
            <ResourceCard key={r.name} resource={r} />
          ))}
          <ResourceCard resource={INTERNATIONAL} />
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Ventaya is a wellbeing tool, not a medical service, and cannot provide
        emergency care or a diagnosis.
      </p>
    </div>
  );
}

function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <div className="flex flex-col rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium leading-snug">{resource.name}</h3>
        {resource.always && (
          <span className="shrink-0 rounded-full bg-oxblood/10 px-2 py-0.5 text-[11px] font-medium text-oxblood">
            24/7
          </span>
        )}
      </div>

      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {resource.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {resource.phone && (
          <Button asChild size="sm" variant="secondary">
            <a href={`tel:${resource.phone.replace(/\s/g, '')}`}>
              <Phone className="mr-1.5 h-3.5 w-3.5" />
              {resource.phone}
            </a>
          </Button>
        )}
        {resource.sms && (
          <Button asChild size="sm" variant="secondary">
            <a href={`sms:${resource.sms.replace(/\s/g, '')}`}>
              <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
              Text
            </a>
          </Button>
        )}
        <Button asChild size="sm" variant="ghost">
          <a href={resource.website} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Website
          </a>
        </Button>
      </div>
    </div>
  );
}
