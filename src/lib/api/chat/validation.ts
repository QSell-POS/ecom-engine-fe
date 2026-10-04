import { z } from "zod";
import { optionalText } from "@/lib/api/shared/validation";
import { CHECKOUT_PAYMENT_METHODS } from "@/lib/api/order/types";

const ConversationIdSchema = z.object({ id: z.string().min(1, "Conversation is required") });

export const ConversationStatusValues = ["open", "pending", "resolved", "closed"] as const;

export const SendMessageSchema = ConversationIdSchema.extend({
  text: z.string().min(1, "Write a message"),
});

export const UpdateConversationStatusSchema = ConversationIdSchema.extend({
  status: z.enum(ConversationStatusValues),
});

export const AssignConversationSchema = ConversationIdSchema.extend({
  assigneeId: z.string().min(1, "Pick who should take this"),
});

export const UnassignConversationSchema = ConversationIdSchema;

export const LinkCustomerSchema = ConversationIdSchema.extend({
  customerId: z.uuid("Pick a customer"),
});

export const CreateCustomerFromChatSchema = ConversationIdSchema.extend({
  firstName: z.string().min(1, "First name is required"),
  lastName: optionalText,
  email: z.preprocess((value) => (value === "" ? undefined : value), z.email("Enter a valid email address").optional()),
  phone: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().regex(/^\+?\d{7,15}$/, "Enter 7 to 15 digits, optionally starting with +").optional(),
  ),
});

export const CreateChatOrderSchema = ConversationIdSchema.extend({
  items: z.array(z.object({ productId: z.uuid(), quantity: z.coerce.number().int().positive() })).min(1, "Add at least one product"),
  addressId: z.uuid("Choose a delivery address"),
  paymentMethod: z.enum(CHECKOUT_PAYMENT_METHODS),
});

export const SelectPageSchema = z.object({
  selectionId: z.string().min(1, "Selection is required"),
  pageId: z.string().min(1, "Pick a page"),
});
