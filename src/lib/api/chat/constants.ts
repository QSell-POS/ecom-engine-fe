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

/**
 * The admin chat socket: Socket.IO, namespace /admin/chat, websocket
 * transport. The owner token goes in the handshake auth payload (`auth.token`)
 * because a handshake has no headers for a guard to read; an invalid or
 * customer token is disconnected with no error frame, so treat an immediate
 * disconnect as an auth failure.
 */
export function chatSocketUrl(apiUrl: string): string {
  return `${apiUrl.replace(/\/$/, "")}/admin/chat`;
}

export const CHAT_SOCKET_EVENTS = {
  messageNew: "message:new",
  conversationUpdated: "conversation:updated",
  conversationStatusChanged: "conversation:statusChanged",
  joinConversation: "joinConversation",
  leaveConversation: "leaveConversation",
} as const;
