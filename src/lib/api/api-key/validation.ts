import { z } from "zod";
import { makeIdSchema } from "@/lib/api/shared/validation";

export const ApiKeyIdSchema = makeIdSchema("Api key");

export const CreateApiKeySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  // A bare date from <input type="date"> becomes an ISO timestamp.
  expiresAt: z.preprocess((value) => (value === "" || value === undefined ? undefined : new Date(String(value)).toISOString()), z.string().optional()),
});

export const DeleteApiKeySchema = ApiKeyIdSchema;
