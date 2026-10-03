import { defineColumns } from "@/lib/data-grid";
import type { Product } from "./types";

// Shared product grid definition: used by the /api/admin/products route
// (server-side query), the server-rendered first page, the web DataGrid and
// any native client. Pure data: no JSX, no DOM.

export const productStatuses = {
  active: { label: "Active", tone: "success" as const },
  draft: { label: "Draft", tone: "neutral" as const },
};

export const stockStatuses = {
  in: { label: "In stock", tone: "success" as const },
  low: { label: "Low stock", tone: "warning" as const },
  out: { label: "Out of stock", tone: "danger" as const },
};

export function stockLevel(product: Product): keyof typeof stockStatuses {
  const quantity = product.inventory?.available ?? 0;
  if (quantity <= 0) return "out";
  if ((product.stockAlert ?? 0) > 0 && quantity <= (product.stockAlert ?? 0))
    return "low";
  return "in";
}

export const productColumns = defineColumns<Product>([
  {
    id: "name",
    header: "Product",
    accessor: "name",
    width: 240,
    minWidth: 180,
    hideable: false,
    defaultPin: "left",
    mobile: { role: "title" },
  },
  {
    id: "sku",
    header: "SKU",
    accessor: "sku",
    width: 110,
    mobile: { role: "subtitle" },
  },
  {
    id: "status",
    header: "Status",
    accessor: (p) => (p.isActive === false ? "draft" : "active"),
    type: "status",
    statuses: productStatuses,
    filter: { type: "multiselect" },
    width: 100,
    mobile: { role: "status" },
  },
  {
    id: "stock",
    header: "Inventory",
    description: "Quantity on hand. Low stock uses each product's alert level.",
    accessor: (p) => p.inventory?.available ?? 0,
    type: "number",
    format: (value) =>
      Number(value) > 0 ? `${value} in stock` : "Out of stock",
    filter: { type: "range", min: 0 },
    width: 120,
    align: "left",
    mobile: { role: "meta", label: "", order: 1 },
  },
  {
    id: "stockLevel",
    header: "Stock level",
    accessor: stockLevel,
    type: "status",
    statuses: stockStatuses,
    filter: { type: "multiselect" },
    sortable: false,
    defaultHidden: true,
    width: 130,
  },
  {
    id: "category",
    header: "Category",
    accessor: (p) => p.category?.name ?? "",
    filter: { type: "multiselect" },
    width: 120,
    mobile: { role: "meta", order: 2, label: "" },
  },
  {
    id: "brand",
    header: "Brand",
    accessor: (p) => p.brand?.name ?? "",
    filter: { type: "multiselect" },
    width: 110,
  },
  {
    id: "price",
    header: "Price",
    accessor: (p) => Number(p.sellingPrice),
    type: "currency",
    filter: { type: "range", min: 0 },
    width: 110,
    mobile: { role: "trailing" },
  },
  {
    id: "compareAtPrice",
    header: "Compare at",
    accessor: (p) => (p.compareAtPrice ? Number(p.compareAtPrice) : null),
    type: "currency",
    defaultHidden: true,
    width: 130,
  },
  {
    id: "barcode",
    header: "Barcode",
    accessor: "barcode",
    defaultHidden: true,
    width: 150,
  },
  {
    id: "updatedAt",
    header: "Updated",
    accessor: "updatedAt",
    type: "date",
    filter: { type: "date-range" },
    width: 120,
  },
  {
    id: "createdAt",
    header: "Created",
    accessor: "createdAt",
    type: "date",
    defaultHidden: true,
    width: 130,
  },
]);
