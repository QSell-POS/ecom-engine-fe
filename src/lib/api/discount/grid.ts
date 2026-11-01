import { defineColumns } from "@/lib/data-grid";
import { formatMoney } from "@/lib/constants/money";
import { DISCOUNT_TYPE_LABELS, discountState, type Discount } from "./types";

export const discountStates = {
  active: { label: "Active", tone: "success" as const },
  scheduled: { label: "Scheduled", tone: "info" as const },
  expired: { label: "Expired", tone: "neutral" as const },
  exhausted: { label: "Used up", tone: "warning" as const },
  disabled: { label: "Disabled", tone: "neutral" as const },
};

export const discountColumns = defineColumns<Discount>([
  { id: "code", header: "Code", accessor: "code", width: 160, hideable: false, defaultPin: "left", mobile: { role: "title" } },
  { id: "name", header: "Offer", accessor: "name", width: 200, mobile: { role: "subtitle" } },
  { id: "type", header: "Type", accessor: (discount) => DISCOUNT_TYPE_LABELS[discount.type] ?? discount.type, filter: { type: "multiselect" }, width: 160 },
  {
    id: "discountValue",
    header: "Amount",
    accessor: "discountValue",
    format: (value, row) => (row.type === "percentage" ? `${Number(value)}%` : formatMoney(Number(value))),
    width: 120,
    align: "right",
    mobile: { role: "trailing" },
  },
  { id: "state", header: "Status", accessor: (discount) => discountState(discount), type: "status", statuses: discountStates, filter: { type: "multiselect" }, width: 120, mobile: { role: "status" } },
  { id: "uses", header: "Used", accessor: (discount) => (discount.maxTotalUses ? `${discount.timesUsed ?? 0} / ${discount.maxTotalUses}` : String(discount.timesUsed ?? 0)), width: 110, align: "right" },
  { id: "startsAt", header: "Starts", accessor: "startsAt", type: "date", filter: { type: "date-range" }, width: 130 },
  { id: "endsAt", header: "Ends", accessor: "endsAt", type: "date", filter: { type: "date-range" }, width: 130 },
  { id: "description", header: "Note", accessor: "description", width: 260, defaultHidden: true },
]);

