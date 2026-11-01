import { defineColumns } from "@/lib/data-grid";
import type { Review } from "./types";

export const visibilityStatuses = {
  visible: { label: "Visible", tone: "success" as const },
  hidden: { label: "Hidden", tone: "neutral" as const },
};

export const reviewColumns = defineColumns<Review>([
  // No product is joined, so the id is all there is until it is resolved.
  { id: "productId", header: "Product", accessor: "productId", width: 300, hideable: false, defaultPin: "left", mobile: { role: "title" } },
  {
    id: "rating",
    header: "Rating",
    accessor: "rating",
    type: "number",
    format: (value) => "★".repeat(Number(value) || 0),
    filter: { type: "multiselect", options: [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} star` })) },
    width: 110,
    mobile: { role: "status" },
  },
  { id: "customerId", header: "Customer", accessor: "customerId", width: 300, defaultHidden: true },
  { id: "comment", header: "Review", accessor: "comment", width: 360, mobile: { role: "subtitle" } },
  { id: "visibility", header: "Visibility", accessor: (review) => (review.isVisible === false ? "hidden" : "visible"), type: "status", statuses: visibilityStatuses, filter: { type: "multiselect" }, width: 120 },
  { id: "isVerifiedBuyer", header: "Verified buyer", accessor: "isVerifiedBuyer", type: "boolean", filter: { type: "boolean" }, width: 130 },
  { id: "createdAt", header: "Posted", accessor: "createdAt", type: "datetime", filter: { type: "date-range" }, width: 160, mobile: { role: "meta", label: "" } },
]);
