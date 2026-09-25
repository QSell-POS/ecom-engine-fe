import Link from "next/link";
import { Eye, Package, Pencil } from "lucide-react";
import {
  columnFilteringFeature,
  createCoreRowModel,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  type ColumnDef,
  type ReactTable,
} from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SortableHeader } from "@/components/common/SortableHeader";
import { DeleteProductForm } from "@/components/product/DeleteProductForm";
import type { Product } from "./types";

const PRODUCT_ICON_COLORS = [
  "bg-indigo-100 text-indigo-500",
  "bg-rose-100 text-rose-500",
  "bg-amber-100 text-amber-600",
  "bg-emerald-100 text-emerald-500",
  "bg-sky-100 text-sky-500",
  "bg-violet-100 text-violet-500",
];

function productIconColor(seed: string) {
  const index = seed
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);
  return PRODUCT_ICON_COLORS[index % PRODUCT_ICON_COLORS.length];
}

export const productTableFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  coreRowModel: createCoreRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: { includesString: filterFn_includesString },
});

export type ProductTable = ReactTable<typeof productTableFeatures, Product>;

export function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function exportProducts(products: Product[]) {
  const rows = products.map((product) => [
    product.sku,
    product.name,
    product.category?.name ?? "",
    product.brand?.name ?? "",
    product.sellingPrice,
    "Pc",
    String(product.inventory?.quantityOnHand ?? 0),
  ]);
  const csv = [
    "SKU,Product Name,Category,Brand,Price,Unit,Qty",
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "products.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export const productColumns: Array<
  ColumnDef<typeof productTableFeatures, Product>
> = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all products on this page"
        checked={
          table.getIsSomePageRowsSelected()
            ? "indeterminate"
            : table.getIsAllPageRowsSelected()
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={`Select ${row.original.name}`}
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    enableColumnFilter: false,
  },
  {
    accessorKey: "sku",
    header: ({ column }) => <SortableHeader column={column} label="SKU" />,
    cell: (info) => (
      <span className="font-medium text-slate-500">
        {info.getValue<string>()}
      </span>
    ),
    filterFn: "includesString",
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <SortableHeader column={column} label="Product Name" />
    ),
    cell: (info) => (
      <div className="flex items-center gap-2">
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-md ${productIconColor(
            info.row.original.sku,
          )}`}
        >
          <Package size={14} />
        </span>
        <span className="font-medium text-slate-900">
          {info.getValue<string>()}
        </span>
      </div>
    ),
    filterFn: "includesString",
  },
  {
    id: "category",
    header: ({ column }) => <SortableHeader column={column} label="Category" />,
    accessorFn: (product) => product.category?.name ?? "",
    cell: (info) => info.getValue<string>() || "-",
    filterFn: "includesString",
  },
  {
    id: "brand",
    header: ({ column }) => <SortableHeader column={column} label="Brand" />,
    accessorFn: (product) => product.brand?.name ?? "",
    cell: (info) => info.getValue<string>() || "-",
    filterFn: "includesString",
  },
  {
    accessorKey: "sellingPrice",
    header: ({ column }) => <SortableHeader column={column} label="Price" />,
    cell: (info) => {
      const price = Number(info.getValue<string>());
      return Number.isFinite(price) ? `$${price.toLocaleString()}` : "-";
    },
  },
  {
    id: "unit",
    header: "Unit",
    accessorFn: () => "Pc",
    enableSorting: false,
    enableColumnFilter: false,
  },
  {
    id: "quantity",
    header: ({ column }) => <SortableHeader column={column} label="Qty" />,
    accessorFn: (product) => product.inventory?.quantityOnHand ?? 0,
  },
  {
    id: "createdBy",
    header: "Created By",
    cell: () => (
      <div className="flex items-center gap-2">
        <Avatar size="sm">
          <AvatarFallback className="bg-slate-100 text-[0.65rem] font-medium text-slate-500">
            A
          </AvatarFallback>
        </Avatar>
        <span className="text-slate-700">Admin</span>
      </div>
    ),
    enableSorting: false,
    enableColumnFilter: false,
  },
  {
    id: "actions",
    header: "Actions",
    cell: (info) => (
      <div className="flex items-center gap-1 text-slate-400">
        <Link
          title="View product"
          href={`/products/${info.row.original.id}/edit`}
          aria-label={`View ${info.row.original.name}`}
          className="rounded-md p-1 hover:bg-slate-100 hover:text-slate-600"
        >
          <Eye size={14} />
        </Link>
        <Link
          title="Edit product"
          href={`/products/${info.row.original.id}/edit`}
          aria-label={`Edit ${info.row.original.name}`}
          className="rounded-md p-1 hover:bg-slate-100 hover:text-slate-600"
        >
          <Pencil size={14} />
        </Link>
        <DeleteProductForm product={info.row.original} />
      </div>
    ),
    enableSorting: false,
    enableColumnFilter: false,
  },
];
