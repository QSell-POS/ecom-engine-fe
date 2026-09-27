import { defineColumns } from "@/lib/data-grid";
import type { Brand } from "./types";

export const activeStatuses = {
  active: { label: "Active", tone: "success" as const },
  inactive: { label: "Inactive", tone: "neutral" as const },
};

export const brandColumns = defineColumns<Brand>([
  { id: "name", header: "Name", accessor: "name", width: 240, minWidth: 160, hideable: false, defaultPin: "left", mobile: { role: "title" } },
  { id: "slug", header: "URL handle", accessor: (b) => `/${b.slug}`, width: 180, mobile: { role: "subtitle" } },
  {
    id: "status",
    header: "Status",
    accessor: (b) => (b.isActive === false ? "inactive" : "active"),
    type: "status",
    statuses: activeStatuses,
    filter: { type: "multiselect" },
    width: 120,
    mobile: { role: "status" },
  },
  {
    id: "website",
    header: "Website",
    accessor: "website",
    format: (value) => (value ? String(value).replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") : ""),
    width: 200,
    mobile: { role: "meta", label: "" },
  },
  { id: "description", header: "Description", accessor: "description", width: 280, defaultHidden: true },
  { id: "updatedAt", header: "Updated", accessor: "updatedAt", type: "date", filter: { type: "date-range" }, width: 130 },
  { id: "createdAt", header: "Created", accessor: "createdAt", type: "date", defaultHidden: true, width: 130 },
]);
