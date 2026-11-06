export type Override = { permission: string; effect: "allow" | "deny" };

export type Role = {
  id: string;
  name: string;
  description: string | null;
  /** Stored grants: `"*"`, `"orders:*"` or single permissions. */
  permissions: string[];
  /** Built-in presets are read-only and offered to every store. */
  builtIn: boolean;
  staffCount: number;
  createdAt?: string;
};

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  role: { id: string; name: string; builtIn: boolean } | null;
  overrides: Override[];
  /** Effective permissions; only on the single-member endpoint. */
  permissions?: string[];
};

export type PermissionCatalog = {
  modules: { module: string; actions: string[] }[];
  permissions: string[];
};

export type AuditEntry = {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  targetId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
};
