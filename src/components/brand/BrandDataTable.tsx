"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/common/DataTable";
import { UpdateBrandForm } from "@/components/brand/UpdateBrandForm";
import { type Brand } from "@/types";
import { tableFeatures, type ColumnDef } from "@tanstack/react-table";
import { DeleteBrandForm } from "./DeleteBrandForm";

const features = tableFeatures({});

const columns: Array<ColumnDef<typeof features, Brand>> = [
  {
    accessorKey: "name",
    header: "Brand Name",
    cell: (info) => info.getValue<string>(),
  },
  {
    accessorKey: "slug",
    header: "Slug",
    cell: (info) => info.getValue<string>() || "-",
  },
  {
    accessorKey: "logo",
    header: "Logo",
    cell: (info) => {
      const logo = info.getValue<string>();
      return logo ? (
        <span className="inline-flex max-w-30 truncate rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
          {logo}
        </span>
      ) : (
        "-"
      );
    },
  },
  {
    accessorKey: "website",
    header: "Website",
    cell: (info) => {
      const website = info.getValue<string>();
      return website ? (
        <a
          href={website}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 underline decoration-blue-200 underline-offset-2 hover:text-blue-700"
        >
          {website}
        </a>
      ) : (
        "-"
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: (info) => info.getValue<string>() || "-",
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: (info) => {
      const isActive = info.getValue<boolean>();
      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Updated",
    cell: (info) => {
      const updatedAt = info.getValue<string>();
      return updatedAt ? new Date(updatedAt).toLocaleDateString() : "-";
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: (info) => {
      const brand = info.row.original;

      return (
        <div className="flex items-center gap-2">
          <UpdateBrandForm brand={brand} />
          <DeleteBrandForm brand={brand} />
        </div>
      );
    },
  },
];

export function BrandDataTable({ brands }: { brands: Brand[] }) {
  return <DataTable features={features} columns={columns} data={brands} />;
}
