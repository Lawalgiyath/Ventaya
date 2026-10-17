'use client';

/**
 * SafeReport: Evidence Note Capture
 *
 * Allows reporters to record timestamped notes about their case after filing.
 * Notes are stored as chat messages with sender:'reporter' so they appear
 * in the existing chat thread, but are tagged with a special prefix so
 * support staff know they are evidence notes, not conversation messages.
 *
 * Design rationale:
 * - Memory fades: survivors should document details while fresh
 * - Notes are timestamped server-side (tamper-evident)
 * - Uses the existing chat infrastructure (no new Firestore collection)
 * - Prompts cover the key forensic-relevant categories researchers identified
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Plus, ChevronDown, ChevronUp, Loader2, Check } from 'lucide-react';
import { sendChatMessage } from '@/app/actions/report-chat';
import { cn } from '@/lib/utils';

interface Props {
  caseId: string;
}

const NOTE_PROMPTS = [
  { label: 'Physical description', hint: 'What did the person look like? Height, build, clothing, distinguishing marks...' },
  { label: 'Location details', hint: 'Describe the location. Street, landmarks, indoors/outdoors, lighting...' },
  { label: 'Witnesses', hint: 'Was anyone else present? Describe them or note where they might be found...' },
  { label: 'Timeline', hint: 'What happened in what order? Approximate times if known...' },
  { label: 'What was said', hint: 'Any words or phrases spoken that you remember...' },
  { label: 'Other details', hint: 'Anything else you want to record while it is fresh...' },
];

export function EvidenceNotes({ caseId }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmed = note.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    setError(null);

    const label = selectedPrompt ? `[Evidence note: ${selectedPrompt}]\n` : '[Evidence note]\n';

    const res = await sendChatMessage({
      caseId,
      content: label + trimmed,
      sender: 'reporter',
      senderLabel: 'Evidence note',
    });

    if (res.ok) {
      setSaved(true);
      setNote('');
      setSelectedPrompt(null);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError(res.error);
    }
    setSaving(false);
  };

  return (
    <Card className="mt-4">
      <CardHeader
        className="cursor-pointer select-none pb-3"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Add evidence note</CardTitle>
          </div>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
        {!open && (
          <p className="text-xs text-muted-foreground mt-1">
            Record details while they are fresh: descriptions, locations, witnesses, timeline.
          </p>
        )}
      </CardHeader>

      {open && (
        <CardContent className="space-y-4 pt-0">
          <p className="text-xs text-muted-foreground">
            Notes are timestamped and attached to your case. Write as much or as little as you are comfortable with.
          </p>

          {/* Prompt selector */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium">What would you like to record?</p>
            <div className="flex flex-wrap gap-2">
              {NOTE_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setSelectedPrompt(selectedPrompt === p.label ? null : p.label)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs transition-colors',
                    selectedPrompt === p.label
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border hover:border-primary/50',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              selectedPrompt
                ? (NOTE_PROMPTS.find((p) => p.label === selectedPrompt)?.hint ?? 'Write your note...')
                : 'Write your note here...'
            }
            className="min-h-[120px] resize-none text-sm"
            maxLength={3000}
          />

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          {saved && (
            <p className="flex items-center gap-1.5 text-xs text-primary font-medium">
              <Check className="h-3.5 w-3.5" />
              Note saved to your case
            </p>
          )}

          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">{3000 - note.length} chars remaining</p>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!note.trim() || saving}
              className="gap-1.5"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Save note
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
