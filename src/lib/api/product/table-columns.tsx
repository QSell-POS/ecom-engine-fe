import Link from "next/link";
import { Pencil } from "lucide-react";
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
import { SortableHeader } from "@/components/common/SortableHeader";
import { DeleteProductForm } from "@/components/product/DeleteProductForm";
import type { Product } from "./types";

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
      <span className="font-medium text-slate-900">
        {info.getValue<string>()}
      </span>
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
    id: "actions",
    header: "Actions",
    cell: (info) => (
      <div className="flex items-center gap-1">
        <Link
          title="Edit product"
          href={`/products/${info.row.original.id}/edit`}
          aria-label={`Edit ${info.row.original.name}`}
          className="rounded-md border p-1"
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
