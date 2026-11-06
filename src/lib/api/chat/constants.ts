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

/** Socket.IO namespace. A short-lived token from /admin/chat/socket-token goes in the handshake's auth.token. */
export function chatSocketUrl(apiUrl: string): string {
  return `${apiUrl.replace(/\/$/, "")}/admin/chat`;
}

/**
 * Event names are kebab-case — a camelCase listener silently never fires.
 * Every server event reaches the whole tenant, so the inbox list needs no
 * joins; joining a thread is what registers presence and allows typing.
 */
export const CHAT_SOCKET_EVENTS = {
  messageNew: "message:new",
  messageStatusUpdated: "message:status-updated",
  conversationUpdated: "conversation:updated",
  conversationStatusChanged: "conversation:status-changed",
  conversationAssigned: "conversation:assigned",
  conversationUnassigned: "conversation:unassigned",
  conversationOrderCreated: "conversation:order-created",
  /** The activity log changed; an open thread refetches it. */
  conversationActivity: "conversation:activity",
  /** `{ conversationId, viewers: { id, name }[] }` */
  conversationViewers: "conversation:viewers",
  /** Both directions: `{ conversationId, typing }` up, `{ conversationId, agent, typing }` down. */
  agentTyping: "agent:typing",
  joinConversation: "joinConversation",
  leaveConversation: "leaveConversation",
} as const;
