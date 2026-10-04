import type { OrderChannel } from "@/lib/api/order/types";

/**
 * Facebook and Instagram DMs, with orders raised straight from a thread.
 * Messages are the API's only cursor-paginated route.
 */
export type ConversationStatus = "open" | "pending" | "resolved" | "closed";

export type ChatChannel = Extract<OrderChannel, "facebook" | "instagram" | "whatsapp">;

export type Conversation = {
  id: string;
  channel: ChatChannel;
  status: ConversationStatus;
  contactName?: string | null;
  contactAvatar?: string | null;
  /** Meta's page-scoped id for the contact, not a customer id. */
  externalId?: string | null;
  customerId?: string | null;
  customer?: { id: string; firstName?: string; lastName?: string; phone?: string | null } | null;
  assigneeId?: string | null;
  assigneeName?: string | null;
  unreadCount?: number;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ChatMessageDirection = "inbound" | "outbound";

export type ChatMessage = {
  id: string;
  conversationId: string;
  direction: ChatMessageDirection;
  text?: string | null;
  attachments?: { type: string; url: string; name?: string }[];
  createdAt?: string;
};

/** GET /admin/chat/connect-url → where to send the owner for Meta OAuth. */
export type ChatConnectUrl = { url: string };

/**
 * When the owner manages several pages, OAuth returns a `selectionId` instead
 * of connecting, and they pick one.
 */
export type ChatPage = {
  pageId: string;
  pageName: string;
  channel: ChatChannel;
  instagramBusinessAccountId?: string | null;
};

export type PendingPageSelection = { pages: ChatPage[] };

export function conversationTitle(conversation: Conversation): string {
  const customer = conversation.customer;
  const name = [customer?.firstName, customer?.lastName].filter(Boolean).join(" ");
  return name || conversation.contactName || "Unknown contact";
}
