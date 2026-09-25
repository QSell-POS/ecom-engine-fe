import "server-only";
import { apiClient } from "@/lib/api/client";
import { PaginationParams, ListResponse } from "@/lib/api/shared/types";
import { ApiKey } from "./types";
import { CreateApiKeyPayload, UpdateApiKeyPayload } from "./dto";
import { API_KEYS_TAG, apiKeyTag } from "./constants";

export async function getApiKeysAdmin(params?: PaginationParams) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.search) searchParams.set("search", params.search);
  const query = searchParams.toString();

  return apiClient<ListResponse<ApiKey>>(
    `/admin/api-keys${query ? `?${query}` : ""}`,
    { tags: [API_KEYS_TAG], revalidate: 60 },
  );
}

export async function getApiKeyAdmin(id: string) {
  return apiClient<ApiKey>(`/admin/api-keys/${id}`, {
    tags: [apiKeyTag(id)],
    revalidate: 60,
  });
}

export async function createApiKey(data: CreateApiKeyPayload) {
  return apiClient<ApiKey>("/admin/api-keys", {
    method: "POST",
    body: data,
  });
}

export async function updateApiKey(id: string, data: UpdateApiKeyPayload) {
  return apiClient<ApiKey>(`/admin/api-keys/${id}`, {
    method: "PUT",
    body: data,
  });
}

export async function deleteApiKey(id: string) {
  return apiClient<null>(`/admin/api-keys/${id}`, {
    method: "DELETE",
  });
}
