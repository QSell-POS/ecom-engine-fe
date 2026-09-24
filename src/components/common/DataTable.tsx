"use client";

import {
  useTable,
  type ReactTable,
  type RowData,
  type TableFeatures,
  type TableOptions,
} from "@tanstack/react-table";
import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DataTableProps<
  TFeatures extends TableFeatures,
  TData extends RowData,
> = Omit<TableOptions<TFeatures, TData>, "columns" | "data"> & {
  columns?: TableOptions<TFeatures, TData>["columns"];
  data?: TData[];
  renderHeader?: (table: ReactTable<TFeatures, TData>) => ReactNode;
  renderToolbar?: (table: ReactTable<TFeatures, TData>) => ReactNode;
  renderFooter?: (table: ReactTable<TFeatures, TData>) => ReactNode;
};

export function DataTable<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(props: DataTableProps<TFeatures, TData>) {
  const { renderHeader, renderToolbar, renderFooter, ...tableProps } = props;
  const table = useTable({
    ...tableProps,
    columns: tableProps.columns ?? [],
    data: tableProps.data ?? [],
  } as unknown as TableOptions<TFeatures, TData>);

  return (
    <>
      {renderHeader?.(table)}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {renderToolbar?.(table)}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {renderFooter?.(table)}
      </div>
    </>
  );
}
