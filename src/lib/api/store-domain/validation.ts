import { z } from "zod";

/**
 * Loose client-side shape check only — the API is the real authority on
 * reserved words, punycode and taken addresses (see `checkSubdomainAvailability`).
 */
export const SubdomainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "At least 3 characters")
  .max(63, "At most 63 characters")
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "Lowercase letters, numbers and hyphens, and cannot start or end with a hyphen");

export const UpdateStoreDomainSchema = z.object({ subdomain: SubdomainSchema });

export const CheckSubdomainSchema = z.object({ subdomain: z.string().trim().toLowerCase() });
