'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  EmergencyPoint,
  ApparatusCategory,
  getEmergencyPoints,
  calculateDistanceKm,
} from '@/lib/emergency-apparatus';
import { NIGERIA_STATES } from '@/lib/report-orgs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Phone,
  MapPin,
  Navigation,
  ShieldAlert,
  Building2,
  Clock,
  Search,
  Scale,
  Crosshair,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  defaultStateCode?: string | null;
  className?: string;
  showTitle?: boolean;
}

const CATEGORY_TABS: { key: ApparatusCategory | 'all'; label: string; icon: typeof Building2 }[] = [
  { key: 'all', label: 'All apparatus', icon: Building2 },
  { key: 'sarc_medical', label: 'SARCs & medical care', icon: ShieldAlert },
  { key: 'police', label: 'Police gender desks', icon: ShieldAlert },
  { key: 'ministry', label: 'Ministries of Women Affairs', icon: Building2 },
  { key: 'legal_rights', label: 'Legal aid & rights desks', icon: Scale },
  { key: 'emergency_hotline', label: '24/7 hotlines', icon: Phone },
];

export function NearestHelpFinder({
  defaultStateCode,
  className,
  showTitle = true,
}: Props) {
  const [selectedState, setSelectedState] = useState<string>(defaultStateCode || 'ALL');
  const [selectedCategory, setSelectedCategory] = useState<ApparatusCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultStateCode) {
      setSelectedState(defaultStateCode);
    }
  }, [defaultStateCode]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation lookup declined or unavailable:', err);
        setLocationError('Could not retrieve precise GPS. Select your state manually below.');
        setLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const rawPoints = useMemo(() => {
    return getEmergencyPoints({
      stateCode: selectedState,
      category: selectedCategory,
      searchQuery,
    });
  }, [selectedState, selectedCategory, searchQuery]);

  // If user location is active, sort by distance
  const pointsWithDistance = useMemo(() => {
    if (!userLocation) {
      return rawPoints.map((p) => ({ ...p, distanceKm: undefined }));
    }

    return rawPoints
      .map((p) => {
        const distanceKm =
          p.lat && p.lng
            ? calculateDistanceKm(userLocation.lat, userLocation.lng, p.lat, p.lng)
            : undefined;
        return { ...p, distanceKm };
      })
      .sort((a, b) => {
        if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
          return a.distanceKm - b.distanceKm;
        }
        if (a.distanceKm !== undefined) return -1;
        if (b.distanceKm !== undefined) return 1;
        return 0;
      });
  }, [rawPoints, userLocation]);

  return (
    <div className={cn('space-y-6', className)}>
      {showTitle && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-primary font-semibold">
            <MapPin className="h-4 w-4" />
            <span>Emergency Assistance Directory</span>
          </div>
          <h2 className="text-2xl font-headline sm:text-3xl font-medium tracking-tight">
            Find nearest police desks, ministries & medical SARCs
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Locate accredited response centers across Nigeria with direct hotlines, 24/7 emergency rooms, free HIV PEP within 72 hours, and official state protection units.
          </p>
        </div>
      )}

      {/* Control Bar: Location Trigger & Search */}
      <div className="grid gap-3 sm:grid-cols-12 items-center">
        <div className="sm:col-span-5 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by city, hospital, or service..."
            className="pl-9 h-11 text-sm bg-background/80"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full h-11 px-3 py-2 text-sm bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">All states / Nationwide</option>
            {Object.entries(NIGERIA_STATES).map(([code, name]) => (
              <option key={code} value={code}>
                {name} State
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleGetLocation}
            disabled={locating}
            className="w-full h-11 gap-2 border-foreground/20 hover:bg-muted font-medium text-xs sm:text-sm"
          >
            <Crosshair className={cn('h-4 w-4 text-primary', locating && 'animate-spin')} />
            {locating ? 'Locating...' : 'Use My GPS'}
          </Button>
        </div>
      </div>

      {locationError && (
        <div className="flex items-center gap-2 p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{locationError}</span>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedCategory === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedCategory(tab.key)}
              className={cn(
                'whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5',
                isActive
                  ? 'bg-foreground text-background border-foreground font-semibold shadow-sm'
                  : 'bg-background/60 text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Results List */}
      <div className="grid gap-4 md:grid-cols-2">
        {pointsWithDistance.map((point) => {
          const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
            point.name + ', ' + point.address
          )}`;

          return (
            <Card key={point.id} className="border border-border/80 shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between">
              <CardHeader className="pb-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {point.stateName}
                      {point.lga ? ` : ${point.lga}` : ''}
                    </span>
                    <CardTitle className="text-base font-semibold mt-1.5 leading-snug">
                      {point.name}
                    </CardTitle>
                  </div>
                  {point.is24h ? (
                    <span className="shrink-0 text-[10px] font-mono font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      24/7 OPEN
                    </span>
                  ) : (
                    <span className="shrink-0 text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      Standard hours
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                  <span>{point.address}</span>
                </div>

                {point.distanceKm !== undefined && (
                  <div className="flex items-center gap-1 text-xs font-mono font-medium text-primary">
                    <Navigation className="h-3.5 w-3.5" />
                    <span>Approximately {point.distanceKm} km away from your location</span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="pt-0 space-y-3.5">
                {/* Services list */}
                <div className="space-y-1">
                  <p className="text-[11px] font-mono uppercase text-muted-foreground tracking-wider">
                    Services provided
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {point.services.map((srv) => (
                      <span
                        key={srv}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-secondary/80 text-secondary-foreground border border-border/60"
                      >
                        {srv}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="pt-2 border-t flex flex-wrap items-center gap-2">
                  <Button
                    asChild
                    size="sm"
                    className="h-9 px-4 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 flex-1 min-w-[130px]"
                  >
                    <a href={`tel:${point.phone.replace(/\s+/g, '')}`}>
                      <Phone className="h-3.5 w-3.5 mr-1.5" />
                      Call {point.phone}
                    </a>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 text-xs font-medium border-border/80 hover:bg-muted flex-1 min-w-[130px]"
                  >
                    <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Directions on Map
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {pointsWithDistance.length === 0 && (
          <div className="col-span-full py-12 text-center space-y-3 bg-muted/30 rounded-lg border border-dashed border-border p-6">
            <Building2 className="h-8 w-8 mx-auto text-muted-foreground/60" />
            <p className="text-sm font-medium">No emergency points found for the selected filter.</p>
            <p className="text-xs text-muted-foreground">
              Try switching state to "All states / Nationwide" or clear your search term.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedState('ALL');
                setSelectedCategory('all');
                setSearchQuery('');
              }}
            >
              Reset filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
