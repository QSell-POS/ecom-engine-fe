import { defineColumns } from "@/lib/data-grid";
import { DEFAULT_CURRENCY } from "@/lib/constants/money";
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
  { id: "ordersCount", header: "Orders", accessor: (customer) => customer.ordersCount ?? 0, type: "number", width: 90, align: "right" },
  { id: "totalSpent", header: "Spent", accessor: (customer) => customer.totalSpent ?? 0, type: "currency", currency: DEFAULT_CURRENCY, filter: { type: "range" }, width: 130, align: "right", mobile: { role: "trailing" } },
  { id: "lastOrderAt", header: "Last order", accessor: "lastOrderAt", type: "date", filter: { type: "date-range" }, width: 140 },
  { id: "createdAt", header: "Joined", accessor: "createdAt", type: "date", filter: { type: "date-range" }, width: 130, mobile: { role: "meta", label: "Joined" } },
]);
