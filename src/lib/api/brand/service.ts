import "server-only";
import { apiClient } from "@/lib/api/client";
import { PaginationParams, ListResponse } from "@/lib/api/shared/types";
import { Brand } from "./types";
import { CreateBrandPayload, UpdateBrandPayload } from "./dto";
import { BRANDS_TAG, brandTag } from "./constants";

export async function getBrands(params?: PaginationParams) {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.search) searchParams.set("search", params.search);

  const query = searchParams.toString();

  return apiClient<ListResponse<Brand>>(`/brands${query ? `?${query}` : ""}`, {
    tags: [BRANDS_TAG],
    revalidate: 60,
  });
}

export async function getBrandBySlug(slug: string) {
  return apiClient<Brand>(`/brands/slug/${slug}`, {
    tags: [brandTag(slug)],
    revalidate: 60,
  });
}

export async function getBrandById(id: string) {
  return apiClient<Brand>(`/brands/${id}`, {
    tags: [brandTag(id)],
    revalidate: 60,
  });
}

export async function getBrandsAdmin(params?: PaginationParams) {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.search) searchParams.set("search", params.search);

  const query = searchParams.toString();

  return apiClient<ListResponse<Brand>>(
    `/admin/brands${query ? `?${query}` : ""}`,
    {
      tags: [BRANDS_TAG],
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
