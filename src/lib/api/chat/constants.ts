export const CONVERSATIONS_TAG = "conversations";

export function conversationTag(id: string) {
  return `conversation-${id}`;
}

export function conversationMessagesTag(id: string) {
  return `conversation-${id}-messages`;
}

export const CHAT_ROUTES = {
  list: "/chat",
  /** Where the API sends the owner back after Meta OAuth. */
  integrations: "/integrations",
};

/** Socket.IO namespace. The owner token goes in the handshake's auth.token. */
export function chatSocketUrl(apiUrl: string): string {
  return `${apiUrl.replace(/\/$/, "")}/admin/chat`;
}

/**
 * Event names are kebab-case — a camelCase listener silently never fires.
 * Every event also reaches a tenant-wide room, so an inbox needs no
 * joinConversation; joining a thread as well delivers a second copy of
 * message:new and message:status-updated, which has to be de-duplicated.
 */
export const CHAT_SOCKET_EVENTS = {
  messageNew: "message:new",
  messageStatusUpdated: "message:status-updated",
  conversationUpdated: "conversation:updated",
  conversationStatusChanged: "conversation:status-changed",
  conversationAssigned: "conversation:assigned",
  conversationUnassigned: "conversation:unassigned",
  conversationOrderCreated: "conversation:order-created",
  joinConversation: "joinConversation",
  leaveConversation: "leaveConversation",
} as const;
