'use client';

import React, { useEffect } from 'react';
import { LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  redirectUrl?: string;
}

export function QuickExit({ redirectUrl = 'https://www.google.com' }: Props) {
  const triggerExit = () => {
    try {
      // Clear sensitive session / local caches if safe
      sessionStorage.clear();
    } catch (e) {}

    // Use replace to prevent the user from hitting "Back" in the browser
    window.location.replace(redirectUrl);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Double tap or single ESC key
      if (e.key === 'Escape') {
        triggerExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="fixed top-3 right-3 z-[9999] pointer-events-auto">
      <Button
        type="button"
        onClick={triggerExit}
        variant="destructive"
        size="sm"
        title="Instantly leave this site (Press ESC)"
        className="h-9 px-3.5 shadow-lg border border-white/20 font-mono text-xs font-semibold gap-2 transition-transform hover:scale-105 active:scale-95 bg-rose-700 hover:bg-rose-800 text-white rounded-full"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span>Quick Exit [ESC]</span>
      </Button>
    </div>
  );
}
