/**
 * Facebook and Instagram DMs. Two things to know before touching it:
 *
 * - **Every mutating route needs `actingUserId` + `actingUserName`** in the
 *   body (send, which uses `userId`/`userName`, and select-page are the
 *   exceptions). They are required and unknown fields are rejected, so a body
 *   without them is a 400. They are what the event log records as the actor.
 * - A conversation has `platform`, not `channel` — that name belongs to orders.
 */
export const CONVERSATION_STATUSES = ["open", "pending", "resolved"] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

export const CHAT_PLATFORMS = ["facebook", "instagram"] as const;
export type ChatPlatform = (typeof CHAT_PLATFORMS)[number];

export type AssignmentStatus = "unassigned" | "assigned" | "pending_reply";

export type Conversation = {
  id: string;
  pageId: string;
  platform: ChatPlatform;
  pageName?: string | null;
  participantId: string;
  participantName?: string | null;
  participantAvatarUrl?: string | null;
  lastMessagePreview?: string | null;
  lastMessageAt?: string | null;
  lastInboundAt?: string | null;
  unreadCount?: number;
  status: ConversationStatus;
  assignedToUserId?: string | null;
  assignedToUserName?: string | null;
  assignmentStatus?: AssignmentStatus;
  assignedByUserId?: string | null;
  assignedAt?: string | null;
  assignmentNote?: string | null;
  customerId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ChatMessageDirection = "inbound" | "outbound";
export type ChatMessageType = "text" | "image" | "attachment" | "quick_reply" | "postback";
export type ChatMessageStatus = "sent" | "delivered" | "read" | "failed";

export type ChatMessage = {
  id: string;
  conversationId: string;
  direction: ChatMessageDirection;
  messageType?: ChatMessageType;
  status?: ChatMessageStatus;
  text?: string | null;
  externalMessageId?: string | null;
  senderUserId?: string | null;
  createdAt?: string;
};

export const CONVERSATION_EVENT_TYPES = [
  "assigned",
  "reassigned",
  "unassigned",
  "status_changed",
  "customer_linked",
  "customer_created",
  "order_created",
] as const;
export type ConversationEventType = (typeof CONVERSATION_EVENT_TYPES)[number];

/** Oldest-first append-only log. Not paginated. */
export type ConversationEvent = {
  id: string;
  conversationId: string;
  type: ConversationEventType;
  actorUserId?: string | null;
  actorUserName?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
};

/** GET /admin/chat/connect-url → where to send the owner for Meta OAuth. */
export type ChatConnectUrl = { url: string };

/** Fields are id / name / instagramUsername — not pageId / pageName. */
export type ChatPage = {
  id: string;
  name: string;
  instagramUsername?: string | null;
};

export type PendingPageSelection = { pages: ChatPage[] };

export function conversationTitle(conversation: Conversation): string {
  return conversation.participantName || "Unknown contact";
}
