"use server";

import { updateTag } from "next/cache";
import { authActionClient } from "@/lib/safe-action";
import { createApiKey, deleteApiKey } from "./service";
import { API_KEYS_TAG, apiKeyTag } from "./constants";
import { CreateApiKeySchema, DeleteApiKeySchema } from "./validation";

export const createApiKeyAction = authActionClient.inputSchema(CreateApiKeySchema).action(async ({ parsedInput }) => {
  const apiKey = await createApiKey(parsedInput);
  updateTag(API_KEYS_TAG);
  return { apiKey };
});

export const deleteApiKeyAction = authActionClient.inputSchema(DeleteApiKeySchema).action(async ({ parsedInput }) => {
  await deleteApiKey(parsedInput.id);

  updateTag(API_KEYS_TAG);
  updateTag(apiKeyTag(parsedInput.id));

  return { success: true };
});

export async function deleteApiKeyFromForm(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") throw new Error("An api key id is required.");
  await deleteApiKeyAction({ id });
}
