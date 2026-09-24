"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  FileText,
  Pencil,
  RefreshCw,
  Upload,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/common/DataTable";
import { DeleteProductForm } from "@/components/product/DeleteProductForm";
import type { Product } from "@/types";

const features = tableFeatures({
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

type ProductTable = ReactTable<typeof features, Product>;

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function SortableHeader({
  column,
  label,
}: {
  column: ProductTable["getHeaderGroups"] extends () => infer T
    ? T extends Array<infer G>
      ? G extends { headers: Array<infer H> }
        ? H extends { column: infer C }
          ? C
          : never
        : never
      : never
    : never;
  label: string;
}) {
  const sorted = column.getIsSorted();
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 font-medium"
      onClick={() => column.toggleSorting()}
    >
      {label}
      {sorted === "asc" ? (
        <ArrowUp className="size-3" />
      ) : sorted === "desc" ? (
        <ArrowDown className="size-3" />
      ) : (
        <ArrowUpDown className="size-3 text-slate-400" />
      )}
    </button>
  );
}

const columns: Array<ColumnDef<typeof features, Product>> = [
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

function exportProducts(products: Product[]) {
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

function TableToolbar({
  table,
  products,
}: {
  table: ProductTable;
  products: Product[];
}) {
  const categories = useMemo(
    () => [
      ...new Set(
        products.map((product) => product.category?.name).filter(Boolean),
      ),
    ],
    [products],
  );
  const brands = useMemo(
    () => [
      ...new Set(
        products.map((product) => product.brand?.name).filter(Boolean),
      ),
    ],
    [products],
  );
  const category = String(
    table.getColumn("category")?.getFilterValue() ?? "all",
  );
  const brand = String(table.getColumn("brand")?.getFilterValue() ?? "all");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
      <input
        value={String(table.state.globalFilter ?? "")}
        onChange={(event) => table.setGlobalFilter(event.target.value)}
        placeholder="Search"
        aria-label="Search products"
        className="h-8 w-full max-w-72 rounded-md border border-slate-200 px-3 text-xs outline-none placeholder:text-slate-400 focus:border-slate-400"
      />
      <div className="flex items-center gap-2">
        <select
          value={category}
          onChange={(event) =>
            table
              .getColumn("category")
              ?.setFilterValue(
                event.target.value === "all" ? undefined : event.target.value,
              )
          }
          className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600"
          aria-label="Filter by category"
        >
          <option value="all">Category</option>
          {categories.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          value={brand}
          onChange={(event) =>
            table
              .getColumn("brand")
              ?.setFilterValue(
                event.target.value === "all" ? undefined : event.target.value,
              )
          }
          className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600"
          aria-label="Filter by brand"
        >
          <option value="all">Brand</option>
          {brands.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function TableFooter({ table }: { table: ProductTable }) {
  const pageCount = table.getPageCount();
  const currentPage = table.state.pagination.pageIndex;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
      <div className="flex items-center gap-2">
        <span>Row Per Page</span>
        <select
          value={table.state.pagination.pageSize}
          onChange={(event) => table.setPageSize(Number(event.target.value))}
          className="h-7 rounded-md border border-slate-200 bg-white px-2 text-xs"
          aria-label="Rows per page"
        >
          {[5, 10, 20, 50].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <span>Entries</span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Previous page"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          ‹
        </Button>
        {table.getPageOptions().map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "ghost"}
            size="icon-xs"
            aria-label={`Page ${page + 1}`}
            onClick={() => table.setPageIndex(page)}
          >
            {page + 1}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Next page"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          ›
        </Button>
        <span className="ml-2">
          {table.getSelectedRowModel().rows.length} selected
        </span>
      </div>
      <span>{table.getFilteredRowModel().rows.length} products</span>
      <span className="sr-only">
        Page {currentPage + 1} of {pageCount}
      </span>
    </div>
  );
}

export function ProductDataTable({ products }: { products: Product[] }) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="space-y-5">
      <DataTable
        features={features}
        columns={columns}
        data={products}
        initialState={{
          pagination: { pageIndex: 0, pageSize: 10 },
          globalFilter: "",
        }}
        globalFilterFn="includesString"
        renderHeader={() => (
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Products
              </h1>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <Link href="/dashboard">Dashboard</Link>
                <span>/</span>
                <span>Products</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Export PDF"
                title="Export PDF"
              >
                <FileText />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Export Excel"
                title="Export Excel"
                onClick={() => exportProducts(products)}
              >
                <FileSpreadsheet />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Refresh products"
                title="Refresh products"
                onClick={() => router.refresh()}
              >
                <RefreshCw />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label={isCollapsed ? "Expand table" : "Collapse table"}
                title={isCollapsed ? "Expand table" : "Collapse table"}
                onClick={() => setIsCollapsed((value) => !value)}
              >
                {isCollapsed ? <ChevronDown /> : <ChevronUp />}
              </Button>
              <Button variant="outline" size="sm" disabled>
                <Upload />
                Import Product
              </Button>
              <Button asChild size="sm">
                <Link href="/products/create">Add Product</Link>
              </Button>
            </div>
          </div>
        )}
        renderToolbar={(table) =>
          isCollapsed ? null : (
            <TableToolbar table={table} products={products} />
          )
        }
        renderFooter={(table) =>
          isCollapsed ? null : <TableFooter table={table} />
        }
      />
    </div>
  );
}
