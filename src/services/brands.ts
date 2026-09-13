import { apiFetch } from "@/lib/api";

export type Brand = {
  id: string;
  name: string;
  slug?: string;
  logo?: string;
  website?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateBrandPayload = {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  isActive?: boolean;
};

export async function getBrandsAdmin(): Promise<{ data: Brand[] }> {
  return apiFetch<{ data: Brand[] }>({
    endpoint: "/admin/brands",
  });
}

export async function createBrand(data: CreateBrandPayload) {
  return apiFetch<{ data: Brand }>({
    endpoint: "/admin/brands",
    options: {
      method: "POST",
      body: JSON.stringify(data),
    },
  });
}
