"use server";

import { updateTag } from "next/cache";
import { authActionClient } from "@/lib/safe-action";
import { CUSTOMERS_TAG } from "@/lib/api/customer/constants";
import { ORDERS_TAG } from "@/lib/api/order/constants";
import {
  assignConversation,
  createChatCustomer,
  createChatOrder,
  linkChatCustomer,
  selectChatPage,
  sendChatMessage,
  setConversationStatus,
  unassignConversation,
} from "./service";
import { CONVERSATIONS_TAG, conversationMessagesTag, conversationTag } from "./constants";
import {
  AssignConversationSchema,
  CreateChatOrderSchema,
  CreateCustomerFromChatSchema,
  LinkCustomerSchema,
  SelectPageSchema,
  SendMessageSchema,
  UnassignConversationSchema,
  UpdateConversationStatusSchema,
} from "./validation";

function revalidateConversation(id: string) {
  updateTag(CONVERSATIONS_TAG);
  updateTag(conversationTag(id));
  updateTag(conversationMessagesTag(id));
}

export const sendChatMessageAction = authActionClient.inputSchema(SendMessageSchema).action(async ({ parsedInput }) => {
  const message = await sendChatMessage(parsedInput.id, { text: parsedInput.text });
  revalidateConversation(parsedInput.id);
  return { message };
});

export const setConversationStatusAction = authActionClient.inputSchema(UpdateConversationStatusSchema).action(async ({ parsedInput }) => {
  const conversation = await setConversationStatus(parsedInput.id, parsedInput.status);
  revalidateConversation(parsedInput.id);
  return { conversation };
});

export const assignConversationAction = authActionClient.inputSchema(AssignConversationSchema).action(async ({ parsedInput }) => {
  const conversation = await assignConversation(parsedInput.id, { assigneeId: parsedInput.assigneeId });
  revalidateConversation(parsedInput.id);
  return { conversation };
});

export const unassignConversationAction = authActionClient.inputSchema(UnassignConversationSchema).action(async ({ parsedInput }) => {
  const conversation = await unassignConversation(parsedInput.id);
  revalidateConversation(parsedInput.id);
  return { conversation };
});

export const linkChatCustomerAction = authActionClient.inputSchema(LinkCustomerSchema).action(async ({ parsedInput }) => {
  const conversation = await linkChatCustomer(parsedInput.id, { customerId: parsedInput.customerId });
  revalidateConversation(parsedInput.id);
  return { conversation };
});

export const createChatCustomerAction = authActionClient.inputSchema(CreateCustomerFromChatSchema).action(async ({ parsedInput }) => {
  const { id, ...data } = parsedInput;
  const customer = await createChatCustomer(id, data);
  revalidateConversation(id);
  updateTag(CUSTOMERS_TAG);
  return { customer };
});

export const createChatOrderAction = authActionClient.inputSchema(CreateChatOrderSchema).action(async ({ parsedInput }) => {
  const { id, ...data } = parsedInput;
  const order = await createChatOrder(id, data);
  revalidateConversation(id);
  updateTag(ORDERS_TAG);
  return { order };
});

export const selectChatPageAction = authActionClient.inputSchema(SelectPageSchema).action(async ({ parsedInput }) => {
  const result = await selectChatPage(parsedInput);
  updateTag(CONVERSATIONS_TAG);
  return result;
});
