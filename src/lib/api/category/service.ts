import "server-only";
import { apiClient } from "@/lib/api/client";
import { Category, ListResponse } from "@/types";
import { CreateCategoryPayload, UpdateCategoryPayload } from "./dto";

// ─────────────────────────────────────
// Public API
// ─────────────────────────────────────
export async function getCategories(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.search) searchParams.set("search", params.search);

  const query = searchParams.toString();

  return apiClient<ListResponse<Category>>(
    `/categories${query ? `?${query}` : ""}`,
    {
      tags: ["categories"],
      revalidate: 60,
    },
  );
}

export async function getCategoriesBySlug(slug: string) {
  return apiClient<Category>(`/category/slug/${slug}`, {
    tags: [`categories-${slug}`],
    revalidate: 60,
  });
}

export async function getCategoriesById(id: string) {
  return apiClient<Category>(`/category/${id}`, {
    tags: [`categories-${id}`],
    revalidate: 60,
  });
}

// ─────────────────────────────────────
// Admin API
// ─────────────────────────────────────
export async function getCategoriesAdmin(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.search) searchParams.set("search", params.search);

  const query = searchParams.toString();

  return apiClient<ListResponse<Category>>(
    `/admin/categories${query ? `?${query}` : ""}`,
    {
      tags: ["categories"],
      revalidate: 60,
    },
  );
}

export async function createCategory(data: CreateCategoryPayload) {
  return apiClient<Category>("/admin/categories", {
    method: "POST",
    body: data,
  });
}

export async function updateCategory(id: string, data: UpdateCategoryPayload) {
  return apiClient<Category>(`/admin/categories/${id}`, {
    method: "PUT",
    body: data,
  });
}

export async function deleteCategory(id: string) {
  return apiClient<null>(`/admin/categories/${id}`, {
    method: "DELETE",
  });
}
