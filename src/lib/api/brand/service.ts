import "server-only";
import { apiClient, apiList } from "@/lib/api/client";
import { buildQuery, type ListParams, type ListResponse } from "@/lib/api/shared/types";
import type { Brand } from "./types";
import type { CreateBrandPayload, UpdateBrandPayload } from "./dto";
import { BRANDS_TAG, brandTag } from "./constants";

// Public catalog reads: API key only, so they stay cacheable.

export async function getBrands(params?: ListParams, storeHost?: string): Promise<ListResponse<Brand>> {
  return apiList<Brand>(`/brands${buildQuery(params)}`, { auth: "key", storeHost, tags: [BRANDS_TAG], revalidate: 60 });
}

export async function getBrandBySlug(slug: string, storeHost?: string) {
  return apiClient<Brand>(`/brands/slug/${slug}`, { auth: "key", storeHost, tags: [brandTag(slug)], revalidate: 60, allow404: true });
}

export async function getBrandById(id: string) {
  return apiClient<Brand>(`/brands/${id}`, { auth: "key", tags: [brandTag(id)], revalidate: 60, allow404: true });
}

// Admin: includes inactive brands.

export async function getBrandsAdmin(params?: ListParams): Promise<ListResponse<Brand>> {
  return apiList<Brand>(`/admin/brands${buildQuery(params)}`, { auth: "owner", tags: [BRANDS_TAG], revalidate: 60 });
}

export async function getBrandAdmin(id: string) {
  return apiClient<Brand>(`/admin/brands/${id}`, { auth: "owner", tags: [brandTag(id)], revalidate: 60 });
}

export async function createBrand(data: CreateBrandPayload) {
  return apiClient<Brand>("/admin/brands", { method: "POST", body: data, auth: "owner" });
}

export async function updateBrand(id: string, data: UpdateBrandPayload) {
  return apiClient<Brand>(`/admin/brands/${id}`, { method: "PUT", body: data, auth: "owner" });
}

export async function deleteBrand(id: string) {
  // 409 when products still reference the brand.
  return apiClient<null>(`/admin/brands/${id}`, { method: "DELETE", auth: "owner" });
}
