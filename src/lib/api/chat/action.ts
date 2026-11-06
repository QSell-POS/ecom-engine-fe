"use server";

import { updateTag } from "next/cache";
import { authActionClient } from "@/lib/safe-action";
import { CUSTOMERS_TAG } from "@/lib/api/customer/constants";
import { ORDERS_TAG } from "@/lib/api/order/constants";
import { getCustomers } from "@/lib/api/customer/service";
import { getProductsAdmin } from "@/lib/api/product/service";
import { toAmount } from "@/lib/api/shared/types";
import {
  assignConversation,
  createChatCustomer,
  createChatOrder,
  getConversationCustomer,
  getConversationHistory,
  issueChatSocketToken,
  linkChatCustomer,
  markConversationRead,
  quoteChatOrder,
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
  QuoteChatOrderSchema,
  SearchSchema,
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

/** The customer panel's data for one thread. */
export const conversationCustomerAction = authActionClient.inputSchema(ConversationOnlySchema).action(async ({ parsedInput }) => {
  return { summary: await getConversationCustomer(parsedInput.id) };
});

export const quoteChatOrderAction = authActionClient.inputSchema(QuoteChatOrderSchema).action(async ({ parsedInput }) => {
  const { id, ...body } = parsedInput;
  return { quote: await quoteChatOrder(id, body) };
});

/** Active products for the order drawer (needs products:view). */
export const searchChatProductsAction = authActionClient.inputSchema(SearchSchema).action(async ({ parsedInput }) => {
  const { data } = await getProductsAdmin({ search: parsedInput.search, limit: 10, isActive: true });
  return {
    products: data
      .filter((product) => product.isActive !== false)
      .map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku ?? "",
        price: toAmount(product.sellingPrice),
        available: product.inventory ? product.inventory.quantityOnHand - product.inventory.quantityReserved : null,
        image: product.media?.[0]?.media?.url ?? null,
      })),
  };
});

/** Existing customers to link a thread to (needs customers:view). */
export const searchChatCustomersAction = authActionClient.inputSchema(SearchSchema).action(async ({ parsedInput }) => {
  const { data } = await getCustomers({ search: parsedInput.search, limit: 8 });
  return {
    customers: data.map((customer) => ({
      id: customer.id,
      name: [customer.firstName, customer.lastName].filter(Boolean).join(" ") || null,
      email: customer.email ?? null,
      phone: customer.phone ?? null,
    })),
  };
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
