import "server-only";
import { cache } from "react";
import { ApiError, apiClient } from "@/lib/api/client";
import type { ListResponse } from "@/lib/api/shared/types";
import type { CreateRolePayload, CreateStaffPayload, UpdateRolePayload, UpdateStaffPayload } from "./validation";
import type { Me } from "./permissions";
import type { AuditEntry, Override, PermissionCatalog, Role, StaffMember } from "./types";
import { AUDIT_TAG, ROLES_TAG, STAFF_TAG } from "./constants";

/**
 * The signed-in admin, once per render. Never cached across requests: a revoked permission must
 * disappear from the UI on the next page load.
 *
 * Returns null when it cannot be known (API unreachable, session expired). Callers then hide
 * nothing; the API still refuses whatever the person may not do.
 */
export const getMe = cache(async (): Promise<Me | null> => {
  try {
    return await apiClient<Me>("/admin/me", { auth: "owner", revalidate: 0 });
  } catch (error) {
    // An API without staff support yet: only owners can sign in there.
    if (error instanceof ApiError && error.status === 404) {
      return { kind: "owner", name: "", email: "", role: null, permissions: [] };
    }
    return null;
  }
});

export async function getPermissionCatalog() {
  return apiClient<PermissionCatalog>("/admin/permissions", { auth: "owner", revalidate: 3600 });
}

// ---------------------------------------------------------------- roles

export async function getRoles() {
  return apiClient<Role[]>("/admin/roles", { auth: "owner", tags: [ROLES_TAG], revalidate: 0 });
}

export async function createRole(data: CreateRolePayload) {
  return apiClient<Role>("/admin/roles", { method: "POST", body: data, auth: "owner" });
}

export async function updateRole(id: string, data: UpdateRolePayload) {
  return apiClient<Role>(`/admin/roles/${id}`, { method: "PUT", body: data, auth: "owner" });
}

export async function deleteRole(id: string) {
  return apiClient<{ success: boolean }>(`/admin/roles/${id}`, { method: "DELETE", auth: "owner" });
}

// ---------------------------------------------------------------- staff

export async function getStaff() {
  return apiClient<StaffMember[]>("/admin/staff", { auth: "owner", tags: [STAFF_TAG], revalidate: 0 });
}

export async function getStaffMember(id: string) {
  return apiClient<StaffMember>(`/admin/staff/${id}`, { auth: "owner", revalidate: 0 });
}

export async function createStaff(data: CreateStaffPayload) {
  return apiClient<StaffMember>("/admin/staff", { method: "POST", body: data, auth: "owner" });
}

export async function updateStaff(id: string, data: UpdateStaffPayload) {
  return apiClient<StaffMember>(`/admin/staff/${id}`, { method: "PATCH", body: data, auth: "owner" });
}

export async function setStaffOverrides(id: string, overrides: Override[]) {
  return apiClient<StaffMember>(`/admin/staff/${id}/overrides`, { method: "PUT", body: { overrides }, auth: "owner" });
}

export async function deleteStaff(id: string) {
  return apiClient<{ success: boolean }>(`/admin/staff/${id}`, { method: "DELETE", auth: "owner" });
}

// ---------------------------------------------------------------- me / audit

export async function changeOwnPassword(data: { currentPassword: string; newPassword: string }) {
  return apiClient<{ success: boolean }>("/admin/me/password", { method: "PATCH", body: data, auth: "owner" });
}

/** The API answers `{ data, meta }` without the usual `success` envelope, so it is read as-is. */
export async function getAuditLog(page = 1, limit = 100): Promise<ListResponse<AuditEntry>> {
  return apiClient<ListResponse<AuditEntry>>(`/admin/audit-log?page=${page}&limit=${limit}`, { auth: "owner", tags: [AUDIT_TAG], revalidate: 0 });
}
