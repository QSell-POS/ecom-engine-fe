import "server-only";
import { apiClient, apiList, apiUpload } from "@/lib/api/client";
import { buildQuery, type ListParams, type ListResponse } from "@/lib/api/shared/types";
import type { MediaAsset, MediaFolder } from "./types";
import { MEDIA_TAG, mediaTag } from "./constants";

/** Filters: search, folder. */
export async function getMedia(params?: ListParams): Promise<ListResponse<MediaAsset>> {
  return apiList<MediaAsset>(`/admin/media${buildQuery(params)}`, { auth: "owner", tags: [MEDIA_TAG], revalidate: 60 });
}

export async function getMediaAsset(id: string) {
  return apiClient<MediaAsset>(`/admin/media/${id}`, { auth: "owner", tags: [mediaTag(id)], revalidate: 60 });
}

/**
 * Upload one or more images. The field name is `files` (plural) and the
 * response is an array. No Content-Type header is set anywhere in this path —
 * fetch must add its own multipart boundary.
 */
export async function uploadMedia(files: File[], fields: { folder?: MediaFolder; alt?: string } = {}) {
  const form = new FormData();
  for (const file of files) form.append("files", file);
  if (fields.folder) form.append("folder", fields.folder);
  if (fields.alt) form.append("alt", fields.alt);

  const uploaded = await apiUpload<MediaAsset[] | MediaAsset>("/admin/media", form, { auth: "owner" });
  return Array.isArray(uploaded) ? uploaded : [uploaded];
}

/** Metadata only — the file itself is immutable. */
export async function updateMediaAsset(id: string, data: { alt?: string; title?: string }) {
  return apiClient<MediaAsset>(`/admin/media/${id}`, { method: "PUT", body: data, auth: "owner" });
}

export async function deleteMediaAsset(id: string) {
  // Removes the R2 object; products referencing it lose that image.
  return apiClient<null>(`/admin/media/${id}`, { method: "DELETE", auth: "owner" });
}
