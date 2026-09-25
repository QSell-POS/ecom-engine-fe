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
import { UpdateBrandForm } from "@/components/brand/UpdateBrandForm";
import { DeleteBrandForm } from "@/components/brand/DeleteBrandForm";
import type { Brand } from "./types";

export const brandTableFeatures = tableFeatures({
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

export type BrandTable = ReactTable<typeof brandTableFeatures, Brand>;

export const brandColumns: Array<ColumnDef<typeof brandTableFeatures, Brand>> = [
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
