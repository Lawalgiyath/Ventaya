'use server';

/**
 * SafeReport Chat: Server Actions
 *
 * Fixes vs v1:
 * - supportJoined is now strictly boolean (never overwritten with a timestamp)
 * - Reporter sends increment supportUnread; support sends increment reporterUnread
 * - Rate limiting uses Firestore counter (survives serverless cold starts)
 */

import { z } from 'zod';
import { getAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { ChatMessage, ChatThread } from '@/lib/report-chat';
import type { Report } from '@/lib/report';
import { generateCrisisChatReply } from '@/ai/flows/crisis-chat-flow';

// ── In-memory rate limit fallback (dev only) ──────────────────────────────
const memLimit = new Map<string, { count: number; ts: number }>();

async function checkChatRate(caseId: string): Promise<boolean> {
  const admin = getAdmin();
  if (!admin) {
    const now = Date.now();
    const e = memLimit.get(caseId);
    if (!e || now - e.ts > 60_000) { memLimit.set(caseId, { count: 1, ts: now }); return true; }
    if (e.count >= 10) return false;
    e.count++;
    return true;
  }
  // Firestore-backed rate limit: 10 messages per minute per caseId
  const ref = admin.db.collection('_chat_rate_limits').doc(caseId);
  const now = Date.now();
  try {
    await admin.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.data() ?? { count: 0, windowStart: now };
      const windowStart = data.windowStart as number;
      if (now - windowStart > 60_000) {
        tx.set(ref, { count: 1, windowStart: now });
        return;
      }
      if ((data.count as number) >= 10) throw new Error('rate_limited');
      tx.update(ref, { count: FieldValue.increment(1) });
    });
    return true;
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'rate_limited') return false;
    return true; // fail open
  }
}

// ── Validation ────────────────────────────────────────────────────────────

const SendSchema = z.object({
  caseId: z.string().regex(/^VTY-[A-Z2-9]{6}$/),
  content: z.string().min(1).max(2000),
  sender: z.enum(['reporter', 'support']),
  senderLabel: z.string().max(100),
});

// ── Result types ──────────────────────────────────────────────────────────

export type SendMessageResult =
  | { ok: true; message: ChatMessage }
  | { ok: false; error: string };

export type GetMessagesResult =
  | { ok: true; messages: ChatMessage[]; thread: ChatThread | null }
  | { ok: false; error: string };

// ── Send a message ────────────────────────────────────────────────────────

export async function sendChatMessage(input: {
  caseId: string;
  content: string;
  sender: 'reporter' | 'support';
  senderLabel: string;
}): Promise<SendMessageResult> {
  const parsed = SendSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid message data.' };

  const { caseId, content, sender, senderLabel } = parsed.data;

  const allowed = await checkChatRate(caseId);
  if (!allowed) return { ok: false, error: 'You are sending messages too quickly. Please wait a moment.' };

  const admin = getAdmin();

  // Dev mode: return a fake message so UI works without Admin SDK
  if (!admin) {
    return {
      ok: true,
      message: {
        id: `dev-${Date.now()}`,
        caseId,
        sender,
        senderLabel,
        content,
        createdAt: new Date().toISOString(),
        read: false,
      },
    };
  }

  // Verify report exists before allowing chat
  const reportSnap = await admin.db.collection('reports').doc(caseId).get();
  if (!reportSnap.exists) {
    return { ok: false, error: 'No report found with that case ID.' };
  }

  const now = new Date().toISOString();
  const messageRef = admin.db
    .collection('report-chats')
    .doc(caseId)
    .collection('messages')
    .doc();

  const message: ChatMessage = {
    id: messageRef.id,
    caseId,
    sender,
    senderLabel,
    content,
    createdAt: now,
    read: false,
  };

  const batch = admin.db.batch();

  // Write the message
  batch.set(messageRef, { ...message, createdAtTs: FieldValue.serverTimestamp() });

  // Update thread: FIX: never touch supportJoined from reporter sends
  const threadRef = admin.db.collection('report-chats').doc(caseId);

  if (sender === 'support') {
    // Support sent: increment reporter's unread, mark support as joined (boolean)
    batch.set(
      threadRef,
      {
        lastMessageAt: now,
        lastMessagePreview: content.slice(0, 80),
        reporterUnread: FieldValue.increment(1),
        supportJoined: true, // boolean, set once and never overwritten
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  } else {
    // Reporter sent: increment support's unread, do NOT touch supportJoined
    batch.set(
      threadRef,
      {
        lastMessageAt: now,
        lastMessagePreview: content.slice(0, 80),
        supportUnread: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  await batch.commit();

  // If message was sent by reporter, automatically generate trauma-informed Care AI response
  if (sender === 'reporter') {
    try {
      const reportData = reportSnap.data() as Partial<Report>;

      // Fetch last few messages for conversation context
      const recentSnaps = await admin.db
        .collection('report-chats')
        .doc(caseId)
        .collection('messages')
        .orderBy('createdAtTs', 'desc')
        .limit(6)
        .get();

      const history = recentSnaps.docs
        .map((d) => d.data() as ChatMessage)
        .reverse()
        .map((m) => ({
          sender: m.sender,
          content: m.content,
        }));

      const aiReply = await generateCrisisChatReply({
        caseId,
        userMessage: content,
        incidentType: reportData.incidentType,
        urgency: reportData.urgency,
        stateName: reportData.location?.stateName ?? undefined,
        isRecent: reportData.isRecent,
        history,
      });

      if (aiReply) {
        const aiMessageRef = admin.db
          .collection('report-chats')
          .doc(caseId)
          .collection('messages')
          .doc();

        const aiNow = new Date().toISOString();
        const aiMessage: ChatMessage = {
          id: aiMessageRef.id,
          caseId,
          sender: 'support',
          senderLabel: 'Ventaya Care AI',
          content: aiReply,
          createdAt: aiNow,
          read: false,
        };

        await aiMessageRef.set({
          ...aiMessage,
          createdAtTs: FieldValue.serverTimestamp(),
        });

        await threadRef.set(
          {
            lastMessageAt: aiNow,
            lastMessagePreview: aiReply.slice(0, 80),
            reporterUnread: FieldValue.increment(1),
            supportJoined: true,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (aiErr) {
      console.error('[SafeReport Chat] Care AI generation failed:', aiErr);
    }
  }

  return { ok: true, message };
}

// ── Get messages for a case ───────────────────────────────────────────────

export async function getChatMessages(caseId: string): Promise<GetMessagesResult> {
  if (!/^VTY-[A-Z2-9]{6}$/.test(caseId.trim().toUpperCase())) {
    return { ok: false, error: 'Invalid case ID format.' };
  }

  const admin = getAdmin();

  if (!admin) {
    return {
      ok: true,
      messages: [],
      thread: {
        caseId,
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        lastMessagePreview: '',
        reporterUnread: 0,
        supportUnread: 0,
        supportJoined: false,
      },
    };
  }

  try {
    const [messagesSnap, threadSnap] = await Promise.all([
      admin.db
        .collection('report-chats')
        .doc(caseId)
        .collection('messages')
        .orderBy('createdAtTs', 'asc')
        .limit(200)
        .get(),
      admin.db.collection('report-chats').doc(caseId).get(),
    ]);

    const messages: ChatMessage[] = messagesSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        caseId: data.caseId,
        sender: data.sender,
        senderLabel: data.senderLabel,
        content: data.content,
        createdAt: data.createdAt,
        read: data.read ?? false,
      };
    });

    const thread = threadSnap.exists ? (threadSnap.data() as ChatThread) : null;
    return { ok: true, messages, thread };
  } catch (err) {
    console.error('[SafeReport chat] getChatMessages failed:', err);
    return { ok: false, error: 'Could not load messages. Please try again.' };
  }
}

// ── Mark messages as read ─────────────────────────────────────────────────

export async function markReporterMessagesRead(caseId: string): Promise<void> {
  const admin = getAdmin();
  if (!admin) return;
  await admin.db
    .collection('report-chats')
    .doc(caseId)
    .set({ reporterUnread: 0 }, { merge: true });
}

export async function markSupportMessagesRead(caseId: string): Promise<void> {
  const admin = getAdmin();
  if (!admin) return;
  await admin.db
    .collection('report-chats')
    .doc(caseId)
    .set({ supportUnread: 0 }, { merge: true });
}
