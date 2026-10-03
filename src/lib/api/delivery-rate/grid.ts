import { defineColumns } from "@/lib/data-grid";
import { DEFAULT_CURRENCY } from "@/lib/constants/money";
import { deliveryZone, type DeliveryRate } from "./types";

export const rateStatuses = {
  active: { label: "Active", tone: "success" as const },
  inactive: { label: "Inactive", tone: "neutral" as const },
};

export const deliveryRateColumns = defineColumns<DeliveryRate>([
  { id: "region", header: "Region", accessor: "region", width: 180, hideable: false, defaultPin: "left", mobile: { role: "title" } },
  { id: "city", header: "City", accessor: (rate) => rate.city ?? "All cities", width: 180, mobile: { role: "subtitle" } },
  { id: "zone", header: "Applies to", accessor: deliveryZone, width: 240, defaultHidden: true },
  { id: "shippingCost", header: "Shipping", accessor: "shippingCost", type: "currency", currency: DEFAULT_CURRENCY, filter: { type: "range" }, width: 130, align: "right", mobile: { role: "trailing" } },
  { id: "status", header: "Status", accessor: (rate) => (rate.isActive === false ? "inactive" : "active"), type: "status", statuses: rateStatuses, filter: { type: "multiselect" }, width: 120, mobile: { role: "status" } },
  { id: "updatedAt", header: "Updated", accessor: "updatedAt", type: "date", width: 130, defaultHidden: true },
]);
