import { defineColumns } from "@/lib/data-grid";
import { customerName, type Customer } from "./types";

export const customerStatuses = {
  active: { label: "Active", tone: "success" as const },
  inactive: { label: "Inactive", tone: "neutral" as const },
  banned: { label: "Banned", tone: "danger" as const },
};

export const customerColumns = defineColumns<Customer>([
  { id: "name", header: "Customer", accessor: customerName, width: 220, hideable: false, defaultPin: "left", mobile: { role: "title" } },
  { id: "email", header: "Email", accessor: "email", width: 240, mobile: { role: "subtitle" } },
  { id: "phone", header: "Phone", accessor: "phone", width: 150 },
  { id: "status", header: "Status", accessor: "status", type: "status", statuses: customerStatuses, filter: { type: "multiselect" }, width: 120, mobile: { role: "status" } },
  { id: "isEmailVerified", header: "Verified", accessor: "isEmailVerified", type: "boolean", filter: { type: "boolean" }, width: 110 },
  { id: "lastLoginAt", header: "Last seen", accessor: "lastLoginAt", type: "datetime", filter: { type: "date-range" }, width: 170, mobile: { role: "trailing" } },
  { id: "createdAt", header: "Joined", accessor: "createdAt", type: "date", filter: { type: "date-range" }, width: 130, mobile: { role: "meta", label: "Joined" } },
]);
