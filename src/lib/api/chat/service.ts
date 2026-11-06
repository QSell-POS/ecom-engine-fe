import "server-only";
import { apiClient, apiList } from "@/lib/api/client";
import { buildQuery, type ListParams, type ListResponse } from "@/lib/api/shared/types";
import type { Customer } from "@/lib/api/customer/types";
import type { Order } from "@/lib/api/order/types";
import type {
  ChatAgents,
  ChatConnectUrl,
  ChatMessage,
  Conversation,
  ConversationHistoryEntry,
  ConversationStatus,
  InboxView,
  PendingPageSelection,
} from "./types";
import { CONVERSATIONS_TAG, conversationMessagesTag } from "./constants";

export type ConversationFilters = ListParams & {
  status?: ConversationStatus;
  /** `me`, `unassigned`, or an admin id. */
  assignee?: string;
  unread?: boolean;
};

/** The API filters for an inbox view. "All" leaves archived threads out. */
export function viewFilters(view: InboxView): ConversationFilters {
  switch (view) {
    case "mine":
      return { assignee: "me" };
    case "unassigned":
      return { assignee: "unassigned" };
    case "unread":
      return { unread: true };
    case "resolved":
      return { status: "resolved" };
    case "archived":
      return { status: "archived" };
    default:
      return {};
  }
}

/** Page-paginated, newest activity first. Archived threads only appear when asked for by status. */
export async function getConversations(params?: ConversationFilters): Promise<ListResponse<Conversation>> {
  return apiList<Conversation>(`/admin/chat/conversations${buildQuery(params as ListParams)}`, {
    auth: "owner",
    tags: [CONVERSATIONS_TAG],
    revalidate: 0,
  });
}

/**
 * The one cursor-paginated route: `meta` is `{ nextCursor, hasMore }`. Pass
 * the previous page's `nextCursor` to go further back.
 */
export async function getConversationMessages(id: string, params?: { cursor?: string; limit?: number }) {
  return apiList<ChatMessage>(`/admin/chat/conversations/${id}/messages${buildQuery(params)}`, {
    auth: "owner",
    tags: [conversationMessagesTag(id)],
    revalidate: 0,
  });
}

/** Messages and activity (assignments, status changes, orders, tracking links), oldest first. */
export async function getConversationHistory(id: string) {
  return apiClient<ConversationHistoryEntry[]>(`/admin/chat/conversations/${id}/history`, {
    auth: "owner",
    tags: [conversationMessagesTag(id)],
    revalidate: 0,
  });
}

/** Who a conversation can be assigned to, and which of them is the signed-in admin. */
export async function getChatAgents() {
  return apiClient<ChatAgents>("/admin/chat/agents", { auth: "owner", revalidate: 0 });
}

/** A one-minute token for the inbox socket's handshake. */
export async function issueChatSocketToken() {
  return apiClient<{ token: string; expiresIn: number }>("/admin/chat/socket-token", { method: "POST", auth: "owner" });
}

/** Sent through the Meta Graph API; outside Meta's 24-hour window this fails. */
export async function sendChatMessage(id: string, body: { text: string }) {
  return apiClient<ChatMessage>(`/admin/chat/conversations/${id}/messages`, { method: "POST", body, auth: "owner" });
}

export async function markConversationRead(id: string) {
  return apiClient<{ id: string; unreadCount: number }>(`/admin/chat/conversations/${id}/read`, { method: "POST", auth: "owner" });
}

export async function setConversationStatus(id: string, body: { status: ConversationStatus }) {
  return apiClient<Conversation>(`/admin/chat/conversations/${id}/status`, { method: "PATCH", body, auth: "owner" });
}

export async function assignConversation(id: string, body: { assigneeId: string; note?: string }) {
  return apiClient<Conversation>(`/admin/chat/conversations/${id}/assign`, { method: "POST", body, auth: "owner" });
}

export async function unassignConversation(id: string) {
  return apiClient<Conversation>(`/admin/chat/conversations/${id}/unassign`, { method: "POST", auth: "owner" });
}

export async function linkChatCustomer(id: string, body: { customerId: string }) {
  return apiClient<Conversation>(`/admin/chat/conversations/${id}/link-customer`, { method: "POST", body, auth: "owner" });
}

/** For a chat shopper with no storefront account. */
export async function createChatCustomer(id: string, body: { email: string; firstName?: string; lastName?: string; phone?: string }) {
  return apiClient<Customer>(`/admin/chat/conversations/${id}/create-customer`, { method: "POST", body, auth: "owner" });
}

/**
 * Raise an order from the thread. The conversation must be linked to a
 * customer first; the order is tagged with the conversation's channel, and
 * its tracking link goes into the thread when the 24-hour window is open.
 */
export async function createChatOrder(id: string, body: Record<string, unknown>) {
  return apiClient<Order>(`/admin/chat/conversations/${id}/orders`, { method: "POST", body, auth: "owner" });
}

/** A card with a "Track order" button on Messenger, a link on Instagram. */
export async function sendTrackingLink(id: string, orderId: string) {
  return apiClient<ChatMessage>(`/admin/chat/conversations/${id}/orders/${orderId}/tracking-link`, { method: "POST", auth: "owner" });
}

export async function getChatConnectUrl() {
  return apiClient<ChatConnectUrl>("/admin/chat/connect-url", { auth: "owner", revalidate: false });
}

/** Candidate pages for a `selectionId` returned by OAuth. Selections expire. */
export async function getPendingPageSelection(selectionId: string) {
  return apiClient<PendingPageSelection>(`/admin/chat/pending-selection/${selectionId}`, { auth: "owner", revalidate: false, allow404: true });
}

export async function selectChatPage(body: { selectionId: string; pageId: string }) {
  return apiClient<{ success?: boolean }>("/admin/chat/select-page", { method: "POST", body, auth: "owner" });
}
