import "server-only";
import { apiClient, apiList } from "@/lib/api/client";
import { buildQuery, type ListParams, type ListResponse } from "@/lib/api/shared/types";
import type { Customer } from "@/lib/api/customer/types";
import type { Order } from "@/lib/api/order/types";
import type { ChatConnectUrl, ChatMessage, Conversation, ConversationStatus, PendingPageSelection } from "./types";
import { CONVERSATIONS_TAG, conversationMessagesTag } from "./constants";

/** Page-paginated. Filters: search, status. */
export async function getConversations(params?: ListParams): Promise<ListResponse<Conversation>> {
  return apiList<Conversation>(`/admin/chat/conversations${buildQuery(params)}`, {
    auth: "owner",
    tags: [CONVERSATIONS_TAG],
    revalidate: 10,
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
    revalidate: 5,
  });
}

/** Assignments, status changes and order events, in order. */
export async function getConversationHistory(id: string, params?: ListParams) {
  return apiList<Record<string, unknown>>(`/admin/chat/conversations/${id}/history${buildQuery(params)}`, {
    auth: "owner",
    tags: [conversationMessagesTag(id)],
    revalidate: 60,
  });
}

/** Sent through the Meta Graph API; outside Meta's 24-hour window this fails. */
export async function sendChatMessage(id: string, body: { text: string }) {
  return apiClient<ChatMessage>(`/admin/chat/conversations/${id}/messages`, { method: "POST", body, auth: "owner" });
}

export async function setConversationStatus(id: string, status: ConversationStatus) {
  return apiClient<Conversation>(`/admin/chat/conversations/${id}/status`, { method: "PATCH", body: { status }, auth: "owner" });
}

export async function assignConversation(id: string, body: { assigneeId: string }) {
  return apiClient<Conversation>(`/admin/chat/conversations/${id}/assign`, { method: "POST", body, auth: "owner" });
}

export async function unassignConversation(id: string) {
  return apiClient<Conversation>(`/admin/chat/conversations/${id}/unassign`, { method: "POST", auth: "owner" });
}

export async function linkChatCustomer(id: string, body: { customerId: string }) {
  return apiClient<Conversation>(`/admin/chat/conversations/${id}/link-customer`, { method: "POST", body, auth: "owner" });
}

/** For a chat shopper with no storefront account. */
export async function createChatCustomer(id: string, body: { firstName: string; lastName?: string; phone?: string; email?: string }) {
  return apiClient<Customer>(`/admin/chat/conversations/${id}/create-customer`, { method: "POST", body, auth: "owner" });
}

/**
 * Raise an order from the thread. The conversation must be linked to a
 * customer first; the order is tagged with the conversation's channel.
 */
export async function createChatOrder(
  id: string,
  body: { items: { productId: string; quantity: number }[]; addressId: string; paymentMethod: "cod" | "esewa" | "khalti" },
) {
  return apiClient<Order>(`/admin/chat/conversations/${id}/orders`, { method: "POST", body, auth: "owner" });
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
