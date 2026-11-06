/**
 * Facebook and Instagram DMs.
 *
 * - Who is acting (sender, assigner, the activity log's actor) is taken from
 *   the signed-in admin by the API; no body carries it.
 * - A conversation has `platform`, not `channel` — that name belongs to orders.
 */
export const CONVERSATION_STATUSES = ["open", "pending", "resolved", "archived"] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

export const CONVERSATION_STATUS_LABELS: Record<ConversationStatus, string> = {
  open: "Open",
  pending: "Pending",
  resolved: "Resolved",
  archived: "Archived",
};

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

export type ChatAttachment = { type: string; url: string; title?: string };

export type ChatMessage = {
  id: string;
  conversationId: string;
  direction: ChatMessageDirection;
  messageType?: ChatMessageType;
  status?: ChatMessageStatus;
  text?: string | null;
  attachments?: ChatAttachment[] | null;
  externalMessageId?: string | null;
  senderUserId?: string | null;
  senderDisplayName?: string | null;
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
  "tracking_link_sent",
] as const;
export type ConversationEventType = (typeof CONVERSATION_EVENT_TYPES)[number];

/** Oldest-first append-only log. Not paginated. */
export type ConversationEvent = {
  id: string;
  conversationId: string;
  type: ConversationEventType;
  actorUserId?: string | null;
  actorUserName?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
};

/** GET /history: messages and activity, merged oldest first. */
export type ConversationHistoryEntry = ({ kind: "message" } & ChatMessage) | ({ kind: "event" } & ConversationEvent);

/** Someone a conversation can be assigned to: the owner (id = tenant id) or staff allowed to reply. */
export type ChatAgent = { id: string; name: string; kind: "owner" | "staff" };

/** GET /admin/chat/agents. `meId` is the signed-in admin, in the same id space. */
export type ChatAgents = { agents: ChatAgent[]; meId: string };

/** GET /admin/chat/connect-url → where to send the owner for Meta OAuth. */
export type ChatConnectUrl = { url: string };

/** Fields are id / name / instagramUsername — not pageId / pageName. */
export type ChatPage = {
  id: string;
  name: string;
  instagramUsername?: string | null;
};

export type PendingPageSelection = { pages: ChatPage[] };

/** Inbox views, as `?view=` on /chat. */
export const INBOX_VIEWS = ["all", "mine", "unassigned", "unread", "resolved", "archived"] as const;
export type InboxView = (typeof INBOX_VIEWS)[number];

export const INBOX_VIEW_LABELS: Record<InboxView, string> = {
  all: "All",
  mine: "Mine",
  unassigned: "Unassigned",
  unread: "Unread",
  resolved: "Resolved",
  archived: "Archived",
};

export function conversationTitle(conversation: Pick<Conversation, "participantName">): string {
  return conversation.participantName || "Unknown contact";
}

/** Meta lets a business reply for 24 hours after the customer's last message. */
export const MESSAGING_WINDOW_MS = 24 * 60 * 60 * 1000;

export function messagingWindowOpen(conversation: Pick<Conversation, "lastInboundAt">, now = Date.now()) {
  if (!conversation.lastInboundAt) return false;
  return now - new Date(conversation.lastInboundAt).getTime() <= MESSAGING_WINDOW_MS;
}
