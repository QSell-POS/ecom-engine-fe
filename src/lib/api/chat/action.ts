"use server";

import { updateTag } from "next/cache";
import { authActionClient } from "@/lib/safe-action";
import { CUSTOMERS_TAG } from "@/lib/api/customer/constants";
import { ORDERS_TAG } from "@/lib/api/order/constants";
import {
  assignConversation,
  createChatCustomer,
  createChatOrder,
  getConversationHistory,
  issueChatSocketToken,
  linkChatCustomer,
  markConversationRead,
  selectChatPage,
  sendChatMessage,
  sendTrackingLink,
  setConversationStatus,
  unassignConversation,
} from "./service";
import { CONVERSATIONS_TAG, chatSocketUrl, conversationMessagesTag, conversationTag } from "./constants";
import {
  AssignConversationSchema,
  ConversationOnlySchema,
  CreateChatOrderSchema,
  CreateCustomerFromChatSchema,
  LinkCustomerSchema,
  SelectPageSchema,
  SendMessageSchema,
  SendTrackingLinkSchema,
  UpdateConversationStatusSchema,
} from "./validation";

function revalidateConversation(id: string) {
  updateTag(CONVERSATIONS_TAG);
  updateTag(conversationTag(id));
  updateTag(conversationMessagesTag(id));
}

/**
 * The inbox socket's handshake credential, plus where to connect. The URL comes
 * from the server's API_URL so the browser needs no public env var.
 */
export const chatSocketTokenAction = authActionClient.action(async () => {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) throw new Error("API_URL is not configured on the server.");
  const { token } = await issueChatSocketToken();
  return { token, url: chatSocketUrl(apiUrl) };
});

/** Re-reads one thread's messages and activity, for a live inbox that missed events. */
export const conversationHistoryAction = authActionClient.inputSchema(ConversationOnlySchema).action(async ({ parsedInput }) => {
  return { history: await getConversationHistory(parsedInput.id) };
});

export const sendChatMessageAction = authActionClient.inputSchema(SendMessageSchema).action(async ({ parsedInput }) => {
  const { id, ...body } = parsedInput;
  const message = await sendChatMessage(id, body);
  revalidateConversation(id);
  return { message };
});

export const markConversationReadAction = authActionClient.inputSchema(ConversationOnlySchema).action(async ({ parsedInput }) => {
  const result = await markConversationRead(parsedInput.id);
  updateTag(CONVERSATIONS_TAG);
  return result;
});

export const setConversationStatusAction = authActionClient.inputSchema(UpdateConversationStatusSchema).action(async ({ parsedInput }) => {
  const { id, ...body } = parsedInput;
  const conversation = await setConversationStatus(id, body);
  revalidateConversation(id);
  return { conversation };
});

export const assignConversationAction = authActionClient.inputSchema(AssignConversationSchema).action(async ({ parsedInput }) => {
  const { id, ...body } = parsedInput;
  const conversation = await assignConversation(id, body);
  revalidateConversation(id);
  return { conversation };
});

export const unassignConversationAction = authActionClient.inputSchema(ConversationOnlySchema).action(async ({ parsedInput }) => {
  const conversation = await unassignConversation(parsedInput.id);
  revalidateConversation(parsedInput.id);
  return { conversation };
});

export const linkChatCustomerAction = authActionClient.inputSchema(LinkCustomerSchema).action(async ({ parsedInput }) => {
  const { id, ...body } = parsedInput;
  const conversation = await linkChatCustomer(id, body);
  revalidateConversation(id);
  return { conversation };
});

export const createChatCustomerAction = authActionClient.inputSchema(CreateCustomerFromChatSchema).action(async ({ parsedInput }) => {
  const { id, ...body } = parsedInput;
  const customer = await createChatCustomer(id, body);
  revalidateConversation(id);
  updateTag(CUSTOMERS_TAG);
  return { customer };
});

export const createChatOrderAction = authActionClient.inputSchema(CreateChatOrderSchema).action(async ({ parsedInput }) => {
  const { id, ...body } = parsedInput;
  const order = await createChatOrder(id, body);
  revalidateConversation(id);
  updateTag(ORDERS_TAG);
  return { order };
});

export const sendTrackingLinkAction = authActionClient.inputSchema(SendTrackingLinkSchema).action(async ({ parsedInput }) => {
  const message = await sendTrackingLink(parsedInput.id, parsedInput.orderId);
  revalidateConversation(parsedInput.id);
  return { message };
});

export const selectChatPageAction = authActionClient.inputSchema(SelectPageSchema).action(async ({ parsedInput }) => {
  const result = await selectChatPage(parsedInput);
  updateTag(CONVERSATIONS_TAG);
  return result;
});
