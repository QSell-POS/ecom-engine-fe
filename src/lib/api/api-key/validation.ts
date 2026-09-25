import { z } from "zod";
import { makeIdSchema, optionalText } from "@/lib/api/shared/validation";

export const ApiKeyIdSchema = makeIdSchema("Api key");

export const CreateApiKeySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  expiresAt: optionalText,
});

export const UpdateApiKeySchema = ApiKeyIdSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  expiresAt: optionalText,
  isActive: z.boolean().optional(),
});

export const DeleteApiKeySchema = ApiKeyIdSchema;
