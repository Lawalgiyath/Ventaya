/**
 * SafeReport Chat: types for case-based messaging.
 *
 * Privacy model:
 * - Messages stored under /report-chats/{caseId}/messages/{messageId}
 * - Reporters identified only by caseId (anonymous) or uid (if logged in)
 * - Support staff identified by org name only: never personal names
 * - All reads/writes go through server actions (Admin SDK only)
 * - Clients cannot directly read or write to this collection
 *
 * Fix vs v1: supportJoined is strictly boolean. Reporter sends increment
 * supportUnread (separate counter), not overwrite supportJoined.
 */

export type MessageSender = 'reporter' | 'support' | 'system';

export interface ChatMessage {
  id: string;
  caseId: string;
  sender: MessageSender;
  /** Org short name for support staff. 'You' rendered client-side for reporter. */
  senderLabel: string;
  content: string;
  createdAt: string; // ISO timestamp
  read: boolean;
}

export interface ChatThread {
  caseId: string;
  createdAt: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  /** Unread messages waiting for the reporter (incremented when support sends) */
  reporterUnread: number;
  /** Unread messages waiting for support (incremented when reporter sends) */
  supportUnread: number;
  /** Set to true the first time a support staff member sends a message */
  supportJoined: boolean;
}
