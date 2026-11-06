import { z } from "zod";
import { optionalText } from "@/lib/api/shared/validation";
import { PAYMENT_METHODS } from "@/lib/api/order/types";
import { CONVERSATION_STATUSES } from "./types";

const ConversationIdSchema = z.object({ id: z.uuid("Conversation is required") });

export const ConversationOnlySchema = ConversationIdSchema;

export const SendMessageSchema = ConversationIdSchema.extend({
  text: z.string().trim().min(1, "Write a message").max(2000, "Keep it under 2000 characters"),
});

export const UpdateConversationStatusSchema = ConversationIdSchema.extend({
  status: z.enum(CONVERSATION_STATUSES),
});

/** The owner (their tenant id) or a staff member; the API looks up the name and checks access. */
export const AssignConversationSchema = ConversationIdSchema.extend({
  assigneeId: z.uuid("Pick who should take this"),
  note: z.preprocess((value) => (value === "" ? undefined : value), z.string().max(500).optional()),
});

export const LinkCustomerSchema = ConversationIdSchema.extend({
  customerId: z.uuid("Pick a customer"),
});

const blank = (value: unknown) => (value === "" ? undefined : value);

/** Chat shoppers rarely give an email, so nothing here is required. */
export const CreateCustomerFromChatSchema = ConversationIdSchema.extend({
  email: z.preprocess(blank, z.email("Enter a valid email address").optional()),
  firstName: optionalText,
  lastName: optionalText,
  phone: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().regex(/^\+?\d{7,15}$/, "Enter 7 to 15 digits, optionally starting with +").optional(),
  ),
});

/**
 * Either an addressId or all three inline fields — both, or neither, is a 400.
 * Unlike storefront checkout this takes the full payment method enum.
 */
export const CreateChatOrderSchema = ConversationIdSchema.extend({
  items: z.array(z.object({ productId: z.uuid(), quantity: z.coerce.number().int().positive() })).min(1, "Add at least one product"),
  paymentMethod: z.enum(PAYMENT_METHODS),
  addressId: z.preprocess((value) => (value === "" ? undefined : value), z.uuid().optional()),
  shippingAddress: optionalText,
  shippingCity: optionalText,
  shippingRegion: optionalText,
  discountCode: z.preprocess(blank, z.string().trim().max(50).optional()),
  /** A price agreed in the chat; leave empty to use the store's rate for the address. */
  deliveryCharge: z.preprocess(blank, z.coerce.number().min(0, "Delivery can't be negative").max(1_000_000).optional()),
  customerNotes: z.preprocess(blank, z.string().max(1000).optional()),
  /** Defaults to true on the API: the link goes out if Meta's 24-hour window is open. */
  sendTrackingLink: z.boolean().optional(),
}).refine(
  (data) => {
    const inline = Boolean(data.shippingAddress && data.shippingCity && data.shippingRegion);
    return Boolean(data.addressId) !== inline;
  },
  { path: ["addressId"], message: "Give either a saved address or all three address fields, not both" },
);

/** Like an order, but anything may still be missing: the drawer quotes as staff fill it in. */
export const QuoteChatOrderSchema = ConversationIdSchema.extend({
  items: z.array(z.object({ productId: z.uuid(), quantity: z.number().int().positive() })).max(50),
  addressId: z.preprocess(blank, z.uuid().optional()),
  shippingCity: z.preprocess(blank, z.string().optional()),
  shippingRegion: z.preprocess(blank, z.string().optional()),
  discountCode: z.preprocess(blank, z.string().trim().max(50).optional()),
  deliveryCharge: z.preprocess(blank, z.coerce.number().min(0).max(1_000_000).optional()),
});

export const SearchSchema = z.object({ search: z.string().trim().max(100) });

export const SendTrackingLinkSchema = ConversationIdSchema.extend({
  orderId: z.uuid("Pick an order"),
});

export const SelectPageSchema = z.object({
  selectionId: z.uuid("Selection is required"),
  pageId: z.string().min(1, "Pick a page"),
});
