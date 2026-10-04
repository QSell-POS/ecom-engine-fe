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
  const { id, ...body } = parsedInput;
  const message = await sendChatMessage(id, body);
  revalidateConversation(id);
  return { message };
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

export const unassignConversationAction = authActionClient.inputSchema(UnassignConversationSchema).action(async ({ parsedInput }) => {
  const { id, ...body } = parsedInput;
  const conversation = await unassignConversation(id, body);
  revalidateConversation(id);
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

export const selectChatPageAction = authActionClient.inputSchema(SelectPageSchema).action(async ({ parsedInput }) => {
  const result = await selectChatPage(parsedInput);
  updateTag(CONVERSATIONS_TAG);
  return result;
});
