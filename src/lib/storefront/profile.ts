import { z } from "zod";
import { isSafeImageUrl, isSafeLinkUrl, MAX_IMAGE_URL_LENGTH } from "@/lib/theme-engine/document";
import type { StoreProfile } from "./types";

// Validation for the merchant's store profile (simple customizer). Shared by
// the server action and the form; the backend must apply the same rules.

export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "INR", "NPR"] as const;

const link = z.string().trim().max(2000).refine(isSafeLinkUrl, "Use a web address (https://…) or a page on your store (/…).");
const image = z.string().trim().max(MAX_IMAGE_URL_LENGTH, "That image is too large. Use one under 1 MB.").refine(isSafeImageUrl, "Use a PNG, JPG, WebP or GIF image.");
const social = z.string().trim().max(300).refine((value) => value === "" || /^https:\/\//i.test(value), "Paste the full link, starting with https://");
const money = z.coerce.number().min(0).max(100_000);

export const StoreProfileSchema = z.object({
  name: z.string().trim().min(1, "Your store needs a name.").max(60),
  tagline: z.string().trim().max(140),
  logo: image,
  favicon: image,
  currency: z.enum(CURRENCIES),
  contact: z.object({
    email: z.union([z.literal(""), z.string().trim().email("Enter a valid email address.")]),
    phone: z.string().trim().max(40),
    address: z.string().trim().max(200),
  }),
  social: z.object({ instagram: social, facebook: social, x: social, tiktok: social, youtube: social, pinterest: social }),
  announcement: z.object({ enabled: z.boolean(), text: z.string().trim().max(140), link }),
  navigation: z.array(z.object({ label: z.string().trim().min(1).max(30), href: link })).max(8),
  checkout: z.object({
    freeShippingThreshold: money,
    standardRate: money,
    expressRate: money,
    taxRate: z.coerce.number().min(0).max(0.5),
  }),
});

export function sanitizeStoreProfile(input: unknown): StoreProfile {
  return StoreProfileSchema.parse(input);
}
