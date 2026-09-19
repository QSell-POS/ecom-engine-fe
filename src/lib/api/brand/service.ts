import "server-only";
import { apiClient } from "@/lib/api/client";
import { Brand, ListResponse } from "@/types";
import { CreateBrandPayload, UpdateBrandPayload } from "./dto";

// ─────────────────────────────────────
// Public API
// ─────────────────────────────────────
export async function getBrands(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.search) searchParams.set("search", params.search);

  const query = searchParams.toString();

  return apiClient<ListResponse<Brand>>(`/brands${query ? `?${query}` : ""}`, {
    tags: ["brands"],
    revalidate: 60,
  });
}

export async function getBrandBySlug(slug: string) {
  return apiClient<Brand>(`/brands/slug/${slug}`, {
    tags: [`brand-${slug}`],
    revalidate: 60,
  });
}

export async function getBrandById(id: string) {
  return apiClient<Brand>(`/brands/${id}`, {
    tags: [`brand-${id}`],
    revalidate: 60,
  });
}

// ─────────────────────────────────────
// Admin API
// ─────────────────────────────────────
export async function getBrandsAdmin(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.search) searchParams.set("search", params.search);

  const query = searchParams.toString();

  return apiClient<ListResponse<Brand>>(
    `/admin/brands${query ? `?${query}` : ""}`,
    {
      tags: ["brands"],
      revalidate: 60,
    },
  );
}

export async function createBrand(data: CreateBrandPayload) {
  return apiClient<Brand>("/admin/brands", {
    method: "POST",
    body: data,
  });
}

export async function updateBrand(id: string, data: UpdateBrandPayload) {
  return apiClient<Brand>(`/admin/brands/${id}`, {
    method: "PUT",
    body: data,
  });
}

export async function deleteBrand(id: string) {
  return apiClient<null>(`/admin/brands/${id}`, {
    method: "DELETE",
  });
}
