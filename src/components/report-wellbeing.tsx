'use client';

/**
 * SafeReport: Post-Report Wellbeing Check-in
 *
 * A brief, compassionate check-in shown on the confirmation screen.
 * Research (NNEDV 2025, CDT Traumatic Disclosures) shows that acknowledging
 * a survivor's emotional state after disclosure reduces re-traumatisation
 * and increases engagement with support services.
 *
 * This is NOT a clinical assessment: it is a simple human acknowledgment.
 * No data is collected from this component.
 */

import { useState } from 'react';
import {
  Heart,
  CloudRain,
  AlertCircle,
  Flame,
  SunMedium,
  EyeOff,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeelingItem {
  icon: LucideIcon;
  label: string;
}

const FEELINGS: FeelingItem[] = [
  { icon: CloudRain, label: 'Sad' },
  { icon: AlertCircle, label: 'Scared' },
  { icon: Flame, label: 'Angry' },
  { icon: SunMedium, label: 'Relieved' },
  { icon: EyeOff, label: 'Numb' },
  { icon: HelpCircle, label: 'Unsure' },
];

const RESPONSES: Record<string, string> = {
  Sad: "It makes complete sense to feel sad right now. What you experienced was real and it matters. Please know that support is available whenever you are ready.",
  Scared: "Feeling scared is a completely natural response. Your safety matters. If you feel you are in immediate danger, please call 112. The organisations we matched you with are here to help.",
  Angry: "Anger is a valid and understandable response to what you have experienced. Your feelings are justified. Support is here when you are ready.",
  Relieved: "It can feel like a weight has been lifted after sharing what happened. That is okay. Taking this step took courage.",
  Numb: "Feeling numb or disconnected is a common response to trauma. You do not have to feel anything in particular right now. Support is available at your own pace.",
  Unsure: "It is okay not to know how you feel right now. Healing is not linear and there is no 'right' way to respond. We are here whenever you need us.",
};

export function WellbeingCheckIn() {
  const [selected, setSelected] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const currentFeeling = FEELINGS.find((f) => f.label === selected);
  const SelectedIcon = currentFeeling?.icon;

  return (
    <div className="rounded-xl border bg-muted/20 p-4 space-y-4 mt-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">How are you feeling right now?</p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Skip
        </button>
      </div>

      {!selected ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {FEELINGS.map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setSelected(label)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors hover:border-primary hover:bg-primary/5',
              )}
            >
              <Icon className="h-6 w-6 text-primary/80" />
              <span className="text-xs text-muted-foreground">{label}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {SelectedIcon && <SelectedIcon className="h-5 w-5 text-primary" />}
            <p className="text-sm font-medium">{selected}</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {RESPONSES[selected]}
          </p>
          <button
            onClick={() => setSelected(null)}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Choose a different feeling
          </button>
        </div>
      )}
    </div>
  );
}

