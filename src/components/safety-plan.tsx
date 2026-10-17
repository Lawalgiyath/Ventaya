'use client';

/**
 * SafeReport: Safety Plan Checklist
 *
 * A trauma-informed, personalised safety planning tool shown on the
 * confirmation screen and case lookup. Based on evidence-based safety
 * planning frameworks (SafeAid, NNEDV guidelines).
 *
 * Key principles:
 * - No "right" answers: every item is optional
 * - Empowers the reporter to think about their own safety proactively
 * - Progress is stored in localStorage only (no server): ephemeral and private
 * - Never tells the reporter what they "must" do
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanItem {
  id: string;
  category: string;
  text: string;
}

const PLAN_ITEMS: PlanItem[] = [
  // Immediate safety
  { id: 'safe-location', category: 'Immediate safety', text: 'I know at least one place I can go if I need to leave quickly (friend, family, shelter)' },
  { id: 'emergency-numbers', category: 'Immediate safety', text: 'I have the NAPTIP number saved: 0800 200 2020' },
  { id: 'trusted-person', category: 'Immediate safety', text: 'There is at least one person I trust who knows what happened' },
  { id: 'block-contact', category: 'Immediate safety', text: 'I have considered blocking the perpetrator on my phone and social media' },

  // Medical
  { id: 'medical-check', category: 'Medical care', text: 'I know I can get a free forensic examination at Mirabel Centre (Lagos) within 72 hours' },
  { id: 'pep', category: 'Medical care', text: 'I have considered getting HIV PEP (post-exposure prophylaxis) if the assault was recent' },
  { id: 'mental-health', category: 'Medical care', text: 'I am aware that free counselling is available from STER (08188883795)' },

  // Legal & documentation
  { id: 'document-evidence', category: 'Documentation', text: 'I have kept or photographed any physical evidence (clothing, messages, photos)' },
  { id: 'write-down', category: 'Documentation', text: 'I have written down what happened with as much detail as I can remember' },
  { id: 'legal-aid', category: 'Legal support', text: 'I know I can get free legal help from FIDA Nigeria: 08006472428' },

  // Ongoing safety
  { id: 'tell-someone', category: 'Support network', text: 'I have told or plan to tell someone I trust about my situation' },
  { id: 'self-care', category: 'Wellbeing', text: 'I am being gentle with myself: what happened was not my fault' },
];

const CATEGORIES = [...new Set(PLAN_ITEMS.map((i) => i.category))];

interface Props {
  caseId: string;
}

export function SafetyPlan({ caseId }: Props) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const storageKey = `safereport-plan-${caseId}`;

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setChecked(new Set(JSON.parse(saved)));
    } catch { /* ignore */ }
  }, [storageKey]);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try { localStorage.setItem(storageKey, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  };

  const total = PLAN_ITEMS.length;
  const done = checked.size;
  const pct = Math.round((done / total) * 100);

  return (
    <Card className="mt-4">
      <CardHeader
        className="cursor-pointer select-none pb-3"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Safety plan</CardTitle>
            {done > 0 && (
              <span className="text-xs font-mono text-muted-foreground">{done}/{total}</span>
            )}
          </div>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
        {!open && (
          <p className="text-xs text-muted-foreground mt-1">
            Optional checklist to help you think about your safety. Work through at your own pace.
          </p>
        )}
      </CardHeader>

      {open && (
        <CardContent className="space-y-5 pt-0">
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Your progress</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              These are suggestions only; there are no wrong answers. Check off items as they feel right for you.
            </p>
          </div>

          {CATEGORIES.map((cat) => (
            <div key={cat} className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{cat}</p>
              {PLAN_ITEMS.filter((i) => i.category === cat).map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                >
                  <Checkbox
                    id={item.id}
                    checked={checked.has(item.id)}
                    onCheckedChange={() => toggle(item.id)}
                    className="mt-0.5 shrink-0"
                  />
                  <span className={cn(
                    'text-sm leading-snug',
                    checked.has(item.id) ? 'text-muted-foreground line-through' : 'text-foreground',
                  )}>
                    {item.text}
                  </span>
                </label>
              ))}
            </div>
          ))}

          <p className="text-xs text-muted-foreground">
            Your progress is saved in this browser only and is never sent to any server.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
