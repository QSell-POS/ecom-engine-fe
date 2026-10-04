import { z } from "zod";
import { optionalText } from "@/lib/api/shared/validation";
import { PAYMENT_METHODS } from "@/lib/api/order/types";
import { CONVERSATION_STATUSES } from "./types";

const ConversationIdSchema = z.object({ id: z.string().min(1, "Conversation is required") });

/**
 * Who is doing this. Required on assign, unassign, status, link-customer,
 * create-customer and orders — the event log records them as the actor, and a
 * body without them is a 400.
 */
const ActingUser = {
  actingUserId: z.uuid("Acting user is required"),
  actingUserName: z.string().min(1, "Acting user name is required"),
};

/** Replies use this optional pair instead of actingUser*. */
export const SendMessageSchema = ConversationIdSchema.extend({
  text: z.string().trim().min(1, "Write a message").max(2000, "Keep it under 2000 characters"),
  userId: z.preprocess((value) => (value === "" ? undefined : value), z.uuid().optional()),
  userName: optionalText,
});

export const UpdateConversationStatusSchema = ConversationIdSchema.extend({
  status: z.enum(CONVERSATION_STATUSES),
  ...ActingUser,
});

export const AssignConversationSchema = ConversationIdSchema.extend({
  // Both the assignee and the actor are id + display name; nothing is looked
  // up server-side.
  assigneeUserId: z.uuid("Pick who should take this"),
  assigneeUserName: z.string().min(1, "Assignee name is required"),
  note: z.preprocess((value) => (value === "" ? undefined : value), z.string().max(500).optional()),
  ...ActingUser,
});

export const UnassignConversationSchema = ConversationIdSchema.extend({ ...ActingUser });

export const LinkCustomerSchema = ConversationIdSchema.extend({
  customerId: z.uuid("Pick a customer"),
  ...ActingUser,
});

export const CreateCustomerFromChatSchema = ConversationIdSchema.extend({
  email: z.email("Enter a valid email address"),
  firstName: optionalText,
  lastName: optionalText,
  phone: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().regex(/^\+?\d{7,15}$/, "Enter 7 to 15 digits, optionally starting with +").optional(),
  ),
  ...ActingUser,
});

/**
 * Either an addressId or all three inline fields — both, or neither, is a 400.
 * Unlike storefront checkout this takes the full payment method enum, and the
 * order carries no delivery charge or discount.
 */
export const CreateChatOrderSchema = ConversationIdSchema.extend({
  items: z.array(z.object({ productId: z.uuid(), quantity: z.coerce.number().int().positive() })).min(1, "Add at least one product"),
  paymentMethod: z.enum(PAYMENT_METHODS),
  addressId: z.preprocess((value) => (value === "" ? undefined : value), z.uuid().optional()),
  shippingAddress: optionalText,
  shippingCity: optionalText,
  shippingRegion: optionalText,
  ...ActingUser,
}).refine(
  (data) => {
    const inline = Boolean(data.shippingAddress && data.shippingCity && data.shippingRegion);
    return Boolean(data.addressId) !== inline;
  },
  { path: ["addressId"], message: "Give either a saved address or all three address fields, not both" },
);

export const SelectPageSchema = z.object({
  selectionId: z.uuid("Selection is required"),
  pageId: z.string().min(1, "Pick a page"),
});
