import "server-only";
import { apiClient } from "@/lib/api/client";
import type { StoreDomain, SubdomainAvailability } from "./types";
import { STORE_DOMAIN_TAG } from "./constants";

export async function getStoreDomain(): Promise<StoreDomain> {
  return apiClient<StoreDomain>("/admin/store/domain", { auth: "owner", tags: [STORE_DOMAIN_TAG], revalidate: 60 });
}

export async function checkSubdomainAvailability(subdomain: string): Promise<SubdomainAvailability> {
  return apiClient<SubdomainAvailability>(`/admin/store/domain/availability?subdomain=${encodeURIComponent(subdomain)}`, {
    auth: "owner",
  });
}

/** No tenant exists yet during sign-up, so this is the one unauthenticated check. */
export async function checkSignupSubdomainAvailability(subdomain: string): Promise<SubdomainAvailability> {
  return apiClient<SubdomainAvailability>(`/tenant/subdomain/availability?subdomain=${encodeURIComponent(subdomain)}`, {
    auth: "public",
  });
}

export async function updateStoreDomain(subdomain: string): Promise<StoreDomain> {
  return apiClient<StoreDomain>("/admin/store/domain", { method: "PATCH", body: { subdomain }, auth: "owner" });
}
