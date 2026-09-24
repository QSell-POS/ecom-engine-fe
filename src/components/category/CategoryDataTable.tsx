"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { TbChevronLeft, TbChevronRight } from "react-icons/tb";
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
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UpdateCategoryForm } from "@/components/category/UpdateCategoryForm";
import { DeleteCategoryForm } from "@/components/category/DeleteCategoryForm";
import type { Category } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

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
type CategoryTable = ReactTable<typeof features, Category>;

function SortableHeader({
  column,
  label,
}: {
  column: Column<typeof features, Category>;
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

const columns: Array<ColumnDef<typeof features, Category>> = [
  {
    accessorKey: "name",
    header: ({ column }) => <SortableHeader column={column} label="Name" />,
    filterFn: "includesString",
  },
  {
    accessorKey: "slug",
    header: ({ column }) => <SortableHeader column={column} label="Slug" />,
    cell: (info) => info.getValue<string>() || "-",
    filterFn: "includesString",
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: (info) => info.getValue<string>() || "-",
    filterFn: "includesString",
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: (info) => {
      const active = Boolean(info.getValue());
      return (
        <Badge variant={active ? "default" : "secondary"}>
          {active ? "Active" : "Inactive"}
        </Badge>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => <SortableHeader column={column} label="Updated" />,
    cell: (info) => {
      const value = String(info.getValue() ?? "");
      return value ? new Date(value).toLocaleDateString() : "-";
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: (info) => (
      <div className="flex items-center gap-2">
        <UpdateCategoryForm category={info.row.original} />
        <DeleteCategoryForm category={info.row.original} />
      </div>
    ),
    enableSorting: false,
    enableColumnFilter: false,
  },
];

function Toolbar({ table }: { table: CategoryTable }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
      <input
        value={String(table.state.globalFilter ?? "")}
        onChange={(event) => table.setGlobalFilter(event.target.value)}
        placeholder="Search categories"
        className="h-8 w-full max-w-72 rounded-md border border-slate-200 px-3 text-xs"
        aria-label="Search categories"
      />
    </div>
  );
}

function Footer({ table }: { table: CategoryTable }) {
  return (
    <div className="grid grid-cols-3 items-center border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
      <div className="flex items-center gap-2">
        <span>Rows per page</span>
        <Select
          value={String(table.state.pagination.pageSize)}
          onValueChange={(value) => table.setPageSize(Number(value))}
        >
          <SelectTrigger
            className="h-7 w-auto rounded-md border border-slate-200 bg-white px-2"
            aria-label="Rows per page"
          >
            <SelectValue placeholder="Rows per page" />
          </SelectTrigger>
          <SelectContent>
            {[5, 25, 50, 100].map((value) => (
              <SelectItem key={value} value={String(value)}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <span className="justify-self-center">
        {table.getFilteredRowModel().rows.length} categories
      </span>
      <div className="flex items-center justify-self-end gap-1">
        <Button
          variant="ghost"
          size="icon-xs"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
          aria-label="Previous page"
          title="Previous page"
        >
          <TbChevronLeft />
        </Button>
        {table.getPageOptions().map((page) => (
          <Button
            key={page}
            variant={
              page === table.state.pagination.pageIndex ? "default" : "outline"
            }
            size="icon-xs"
            className="rounded-full"
            onClick={() => table.setPageIndex(page)}
          >
            {page + 1}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="icon-xs"
          className="rounded-full"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
          aria-label="Next page"
          title="Next page"
        >
          <TbChevronRight />
        </Button>
      </div>
    </div>
  );
}

export function CategoryDataTable({ categories }: { categories: Category[] }) {
  return (
    <DataTable
      features={features}
      columns={columns}
      data={categories}
      initialState={{
        pagination: { pageIndex: 0, pageSize: 25 },
        globalFilter: "",
      }}
      globalFilterFn="includesString"
      renderToolbar={(table) => <Toolbar table={table} />}
      renderFooter={(table) => <Footer table={table} />}
    />
  );
}
