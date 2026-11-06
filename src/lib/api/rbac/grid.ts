import { defineColumns } from "@/lib/data-grid";
import type { AuditEntry, StaffMember } from "./types";

export const staffStatuses = {
  active: { label: "Active", tone: "success" as const },
  inactive: { label: "Deactivated", tone: "neutral" as const },
};

export const staffColumns = defineColumns<StaffMember>([
  { id: "name", header: "Name", accessor: "name", width: 220, hideable: false, defaultPin: "left", mobile: { role: "title" } },
  { id: "email", header: "Email", accessor: "email", width: 240, mobile: { role: "subtitle" } },
  { id: "role", header: "Role", accessor: (s) => s.role?.name ?? "No role", width: 170, filter: { type: "multiselect" } },
  {
    id: "status",
    header: "Status",
    accessor: (s) => (s.isActive ? "active" : "inactive"),
    type: "status",
    statuses: staffStatuses,
    filter: { type: "multiselect" },
    width: 130,
    mobile: { role: "status" },
  },
  { id: "overrides", header: "Custom permissions", accessor: (s) => s.overrides.length, type: "number", width: 160 },
  { id: "lastLoginAt", header: "Last sign-in", accessor: "lastLoginAt", type: "datetime", width: 170, mobile: { role: "meta", label: "Last sign-in" } },
  { id: "createdAt", header: "Added", accessor: "createdAt", type: "date", width: 130 },
]);

/** Plain-language names for the audit log's action codes. */
export const AUDIT_ACTIONS: Record<string, string> = {
  "staff.created": "Added a staff member",
  "staff.updated": "Changed a staff member",
  "staff.deleted": "Removed a staff member",
  "staff.overrides": "Changed custom permissions",
  "role.created": "Created a role",
  "role.updated": "Changed a role",
  "role.deleted": "Deleted a role",
  "password.changed": "Changed their password",
};

export const auditColumns = defineColumns<AuditEntry>([
  { id: "createdAt", header: "When", accessor: "createdAt", type: "datetime", width: 180, defaultPin: "left", mobile: { role: "meta", label: "When" } },
  { id: "actorEmail", header: "Who", accessor: (e) => (e.actorId === "owner" ? `${e.actorEmail} (owner)` : e.actorEmail), width: 260, mobile: { role: "subtitle" } },
  { id: "action", header: "What", accessor: (e) => AUDIT_ACTIONS[e.action] ?? e.action, width: 240, filter: { type: "multiselect" }, mobile: { role: "title" } },
  { id: "details", header: "Details", accessor: (e) => auditDetails(e), width: 420, sortable: false },
]);

export function auditDetails(entry: AuditEntry): string {
  const meta = entry.meta ?? {};
  const parts: string[] = [];
  if (typeof meta.email === "string") parts.push(meta.email);
  if (typeof meta.name === "string") parts.push(meta.name);
  if (typeof meta.role === "string") parts.push(`role: ${meta.role}`);
  if (typeof meta.isActive === "boolean") parts.push(meta.isActive ? "activated" : "deactivated");
  if (meta.passwordReset) parts.push("password reset");
  if (Array.isArray(meta.permissions)) parts.push(`${meta.permissions.length} permission grants`);
  if (Array.isArray(meta.overrides)) parts.push(meta.overrides.length ? (meta.overrides as string[]).join(", ") : "cleared");
  return parts.join(" · ");
}
