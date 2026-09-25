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
  type ColumnDef,
  type ReactTable,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { SortableHeader } from "@/components/common/SortableHeader";
import { UpdateCategoryForm } from "@/components/category/UpdateCategoryForm";
import { DeleteCategoryForm } from "@/components/category/DeleteCategoryForm";
import type { Category } from "./types";

export const categoryTableFeatures = tableFeatures({
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

export type CategoryTable = ReactTable<typeof categoryTableFeatures, Category>;

export const categoryColumns: Array<
  ColumnDef<typeof categoryTableFeatures, Category>
> = [
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
