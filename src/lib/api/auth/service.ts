import "server-only";
import { apiClient } from "@/lib/api/client";
import type { LoginPayload, RegisterPayload } from "./dto";
import type { LoginResponse, RegisterResponse, Tenant, TenantSession } from "./types";
import { TENANT_TAG } from "./constants";

/**
 * Neither auth route uses the `{ success, data }` envelope, and they disagree
 * on shape: register returns the tenant with `accessToken` on it, login nests
 * the tenant. Both are normalised to TenantSession here.
 */
export async function loginTenant(data: LoginPayload): Promise<TenantSession> {
  const response = await apiClient<LoginResponse>("/tenant/login", { method: "POST", body: data, auth: "public" });
  return { tenant: response.tenant, accessToken: response.accessToken };
}

export async function registerTenant(data: RegisterPayload): Promise<TenantSession> {
  const { accessToken, ...tenant } = await apiClient<RegisterResponse>("/tenant/register", { method: "POST", body: data, auth: "public" });
  return { tenant, accessToken };
}

/** The signed-in tenant. Throws ApiError 401 when the token is missing or stale. */
export async function getCurrentTenant() {
  return apiClient<Tenant>("/tenant/me", { auth: "owner", tags: [TENANT_TAG], revalidate: 60 });
}

export async function checkApiHealth() {
  return apiClient<{ status?: string }>("/health", { auth: "public" });
}
