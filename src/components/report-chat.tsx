'use client';

/**
 * SafeReport Chat Box
 *
 * Used in two places:
 * 1. On the confirmation screen after a report is submitted (reporter initiates)
 * 2. On the case lookup screen (reporter checks in later)
 *
 * The reporter is always labelled "You". Support staff are labelled by org name.
 * System messages (e.g. "Case received") are centred and dimmed.
 *
 * Polling: We poll every 8 seconds for new messages. This avoids requiring
 * a real-time Firestore listener on the client (which would need direct DB
 * access, breaking our privacy model).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, MessageCircle, RefreshCw, Bot, Sparkles, ShieldCheck } from 'lucide-react';
import { sendChatMessage, getChatMessages } from '@/app/actions/report-chat';
import type { ChatMessage } from '@/lib/report-chat';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/app-context';

interface Props {
  caseId: string;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ReportChatBox({ caseId }: Props) {
  const { user } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async () => {
    const res = await getChatMessages(caseId);
    if (res.ok) {
      setMessages(res.messages);
      if (!open) {
        // Count support messages the reporter hasn't seen
        setUnread(res.thread?.reporterUnread ?? 0);
      }
    }
    setLoading(false);
  }, [caseId, open]);

  // Initial load + polling
  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 8000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMessages]);

  // Scroll to bottom when messages change and chat is open
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, open]);

  // Reset unread when opened
  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError(null);
    setInput('');

    // Optimistic update
    const optimistic: ChatMessage = {
      id: `opt-${Date.now()}`,
      caseId,
      sender: 'reporter',
      senderLabel: 'You',
      content: trimmed,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setMessages((prev) => [...prev, optimistic]);

    const res = await sendChatMessage({
      caseId,
      content: trimmed,
      sender: 'reporter',
      senderLabel: user?.name ?? 'Reporter',
    });

    if (!res.ok) {
      setError(res.error);
      // Roll back optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(trimmed);
    } else {
      // Replace optimistic with real message
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? res.message : m))
      );
      // Trigger quick follow-up fetches to pick up Care AI response
      setTimeout(() => fetchMessages(), 1000);
      setTimeout(() => fetchMessages(), 3000);
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date for date dividers
  const grouped: { date: string; messages: ChatMessage[] }[] = [];
  for (const msg of messages) {
    const date = formatDate(msg.createdAt);
    const last = grouped[grouped.length - 1];
    if (last && last.date === date) {
      last.messages.push(msg);
    } else {
      grouped.push({ date, messages: [msg] });
    }
  }

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="relative gap-2 w-full mt-4 border-primary/30 hover:border-primary bg-primary/5 text-foreground hover:bg-primary/10 h-11"
      >
        <Bot className="h-4 w-4 text-primary" />
        <span className="font-medium">Open 24/7 Care AI Crisis Chat</span>
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
            {unread}
          </span>
        )}
      </Button>
    );
  }

  return (
    <div className="mt-4 rounded-xl border bg-card overflow-hidden flex flex-col shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-primary">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Ventaya Care Assistant</span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                24/7 AI ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">Encrypted under case {caseId}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchMessages} title="Refresh messages">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
            <span className="text-lg leading-none">×</span>
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="h-80 px-4 py-3">
        {loading && (
          <div className="flex h-full items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center p-4 py-8">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Bot className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold">
              You are speaking with the Ventaya Care AI.
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Ask about medical care within 72 hours, preserving forensic evidence, safe shelters, or emotional grounding. Your conversation is 100% private and encrypted.
            </p>
            <div className="mt-3 text-[11px] text-muted-foreground bg-muted/60 p-2.5 rounded-lg border max-w-sm text-center">
              For active physical emergencies, call <strong>112</strong> or NAPTIP on <strong>0800 200 2020</strong>.
            </div>
          </div>
        )}

        {!loading && grouped.map((group) => (
          <div key={group.date}>
            {/* Date divider */}
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">{group.date}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {group.messages.map((msg) => {
              if (msg.sender === 'system') {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {msg.content}
                    </span>
                  </div>
                );
              }

              const isReporter = msg.sender === 'reporter';
              const isCareAi = msg.senderLabel === 'Ventaya Care AI';

              return (
                <div
                  key={msg.id}
                  className={cn('flex mb-3', isReporter ? 'justify-end' : 'justify-start')}
                >
                  <div className={cn('max-w-[80%] space-y-1', isReporter ? 'items-end' : 'items-start')}>
                    {!isReporter && (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground ml-1">
                        {isCareAi ? (
                          <>
                            <Sparkles className="h-3 w-3 text-primary" />
                            <span className="text-primary font-semibold">Ventaya Care AI</span>
                          </>
                        ) : (
                          <span>{msg.senderLabel}</span>
                        )}
                      </div>
                    )}
                    <div
                      className={cn(
                        'rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                        isReporter
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : isCareAi
                          ? 'bg-primary/10 border border-primary/20 text-foreground rounded-bl-sm'
                          : 'bg-muted text-foreground rounded-bl-sm'
                      )}
                    >
                      {msg.content}
                    </div>
                    <p className={cn('text-[10px] text-muted-foreground', isReporter ? 'text-right mr-1' : 'ml-1')}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {sending && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground my-2 ml-1">
            <Bot className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span>Ventaya Care AI is reviewing and preparing response...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </ScrollArea>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="border-t bg-muted/20 p-3 flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send)"
          className="min-h-[40px] max-h-[120px] resize-none text-sm"
          rows={1}
          disabled={sending}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="shrink-0 h-9 w-9"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      <p className="px-4 pb-3 text-xs text-muted-foreground">
        For immediate emergencies, do not wait for a reply: call <strong>112</strong> or <strong>0800 200 2020</strong>.
      </p>
    </div>
  );
}
