import "server-only";
import { apiClient, apiList } from "@/lib/api/client";
import { type ListParams, type ListResponse, buildQuery } from "@/lib/api/shared/types";
import type { CreateApiKeyPayload } from "./dto";
import type { ApiKey } from "./types";
import { API_KEYS_TAG } from "./constants";

// Owner-authenticated, and NOT under /admin: the routes are /api-keys[/:id].
// Create, list and revoke only — a key is replaced, never edited, because the
// API stores just a SHA-256 hash of it.

export async function getApiKeys(params?: ListParams): Promise<ListResponse<ApiKey>> {
  return apiList<ApiKey>(`/api-keys${buildQuery(params)}`, { auth: "owner", tags: [API_KEYS_TAG], revalidate: 60 });
}

/** The full key comes back once, here. Show it, then it is unrecoverable. */
export async function createApiKey(data: CreateApiKeyPayload) {
  return apiClient<ApiKey>("/api-keys", { method: "POST", body: data, auth: "owner" });
}

export async function deleteApiKey(id: string) {
  return apiClient<null>(`/api-keys/${id}`, { method: "DELETE", auth: "owner" });
}
