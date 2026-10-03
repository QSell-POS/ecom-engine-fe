import { defineColumns } from "@/lib/data-grid";
import type { ApiKey } from "./types";

export const apiKeyStatuses = {
  active: { label: "Active", tone: "success" as const },
  expired: { label: "Expired", tone: "warning" as const },
  revoked: { label: "Revoked", tone: "neutral" as const },
};

function keyState(key: ApiKey) {
  if (key.isActive === false) return "revoked";
  if (key.expiresAt && new Date(key.expiresAt).getTime() < Date.now()) return "expired";
  return "active";
}

export const apiKeyColumns = defineColumns<ApiKey>([
  { id: "name", header: "Name", accessor: "name", width: 220, hideable: false, defaultPin: "left", mobile: { role: "title" } },
  { id: "keyPrefix", header: "Key", accessor: (key) => `${key.keyPrefix}…`, width: 220, mobile: { role: "subtitle" } },
  { id: "status", header: "Status", accessor: keyState, type: "status", statuses: apiKeyStatuses, filter: { type: "multiselect" }, width: 120, mobile: { role: "status" } },
  { id: "scopes", header: "Scopes", accessor: (key) => key.scopes ?? [], type: "tags", width: 140 },
  { id: "lastUsedAt", header: "Last used", accessor: "lastUsedAt", type: "datetime", width: 170 },
  { id: "expiresAt", header: "Expires", accessor: "expiresAt", type: "date", width: 130 },
  { id: "createdAt", header: "Created", accessor: "createdAt", type: "date", width: 130, mobile: { role: "meta", label: "Created" } },
]);
