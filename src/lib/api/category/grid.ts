import { activeStatuses } from "@/lib/api/brand/grid";
import { defineColumns } from "@/lib/data-grid";
import type { Category } from "./types";

export type CategoryNode = Category & { children: CategoryNode[] };

/** Flat API list → tree (orphans whose parent isn't loaded become roots). */
export function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const nodes = new Map(categories.map((c) => [c.id, { ...c, children: [] as CategoryNode[] }]));
  const roots: CategoryNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent && parent !== node) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

export const categoryColumns = defineColumns<CategoryNode>([
  { id: "name", header: "Name", accessor: "name", width: 280, minWidth: 180, hideable: false, defaultPin: "left", mobile: { role: "title" } },
  { id: "slug", header: "URL handle", accessor: (c) => `/${c.slug}`, width: 180, mobile: { role: "subtitle" } },
  {
    id: "status",
    header: "Status",
    accessor: (c) => (c.isActive === false ? "inactive" : "active"),
    type: "status",
    statuses: activeStatuses,
    filter: { type: "multiselect" },
    width: 120,
    mobile: { role: "status" },
  },
  {
    id: "subcategories",
    header: "Subcategories",
    accessor: (c) => c.children.length,
    type: "number",
    format: (value) => (value ? String(value) : ""),
    searchable: false,
    width: 130,
    mobile: { role: "meta", label: "Subcategories" },
  },
  { id: "description", header: "Description", accessor: "description", width: 300 },
  { id: "updatedAt", header: "Updated", accessor: "updatedAt", type: "date", filter: { type: "date-range" }, width: 130 },
]);
