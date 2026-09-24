"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  columnFilteringFeature,
  createCoreRowModel,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  type Column,
  type ColumnDef,
  type ReactTable,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/DataTable";
import { UpdateBrandForm } from "@/components/brand/UpdateBrandForm";
import { DeleteBrandForm } from "@/components/brand/DeleteBrandForm";
import type { Brand } from "@/types";

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  coreRowModel: createCoreRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: { includesString: filterFn_includesString },
});
type BrandTable = ReactTable<typeof features, Brand>;

function SortableHeader({
  column,
  label,
}: {
  column: Column<typeof features, Brand>;
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

const columns: Array<ColumnDef<typeof features, Brand>> = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <SortableHeader column={column} label="Brand Name" />
    ),
    filterFn: "includesString",
  },
  {
    accessorKey: "slug",
    header: ({ column }) => <SortableHeader column={column} label="Slug" />,
    cell: (info) => info.getValue<string>() || "-",
    filterFn: "includesString",
  },
  {
    accessorKey: "website",
    header: "Website",
    cell: (info) => {
      const value = info.getValue<string>();
      return value ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 underline"
        >
          {value}
        </a>
      ) : (
        "-"
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: (info) => info.getValue<string>() || "-",
    filterFn: "includesString",
    enableSorting: false,
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: (info) => (
      <Badge variant={info.getValue<boolean>() ? "default" : "secondary"}>
        {info.getValue<boolean>() ? "Active" : "Inactive"}
      </Badge>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => <SortableHeader column={column} label="Updated" />,
    cell: (info) => {
      const value = info.getValue<string>();
      return value ? new Date(value).toLocaleDateString() : "-";
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: (info) => (
      <div className="flex items-center gap-2">
        <UpdateBrandForm brand={info.row.original} />
        <DeleteBrandForm brand={info.row.original} />
      </div>
    ),
    enableSorting: false,
    enableColumnFilter: false,
  },
];

function Toolbar({ table }: { table: BrandTable }) {
  return (
    <div className="border-b border-slate-200 px-4 py-3">
      <input
        value={String(table.state.globalFilter ?? "")}
        onChange={(event) => table.setGlobalFilter(event.target.value)}
        placeholder="Search brands"
        aria-label="Search brands"
        className="h-8 w-full max-w-72 rounded-md border border-slate-200 px-3 text-xs"
      />
    </div>
  );
}
function Footer({ table }: { table: BrandTable }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
      <div className="flex items-center gap-2">
        <span>Rows per page</span>
        <select
          value={table.state.pagination.pageSize}
          onChange={(event) => table.setPageSize(Number(event.target.value))}
          className="h-7 rounded-md border border-slate-200 bg-white px-2"
          aria-label="Rows per page"
        >
          {[5, 10, 20, 50].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-xs"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          ‹
        </Button>
        {table.getPageOptions().map((page) => (
          <Button
            key={page}
            variant={
              page === table.state.pagination.pageIndex ? "default" : "ghost"
            }
            size="icon-xs"
            onClick={() => table.setPageIndex(page)}
          >
            {page + 1}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="icon-xs"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          ›
        </Button>
      </div>
      <span>{table.getFilteredRowModel().rows.length} brands</span>
    </div>
  );
}

export function BrandDataTable({ brands }: { brands: Brand[] }) {
  return (
    <DataTable
      features={features}
      columns={columns}
      data={brands}
      initialState={{
        pagination: { pageIndex: 0, pageSize: 10 },
        globalFilter: "",
      }}
      globalFilterFn="includesString"
      renderToolbar={(table) => <Toolbar table={table} />}
      renderFooter={(table) => <Footer table={table} />}
    />
  );
}
