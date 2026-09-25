"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/common/DataTable";
import {
  brandColumns,
  brandTableFeatures,
  type BrandTable,
} from "@/lib/api/brand/table-columns";
import { BRAND_PAGE_SIZE_OPTIONS } from "@/lib/api/brand/constants";
import type { Brand } from "@/lib/api/brand/types";

function Toolbar({ table }: { table: BrandTable }) {
  return (
    <div className="border-b border-slate-200 px-4 py-3">
      <Input
        value={String(table.state.globalFilter ?? "")}
        onChange={(event) => table.setGlobalFilter(event.target.value)}
        placeholder="Search brands"
        aria-label="Search brands"
        className="h-8 w-full max-w-72"
      />
    </div>
  );
}

function Footer({ table }: { table: BrandTable }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
      <div className="flex items-center gap-2">
        <span>Rows per page</span>
        <Select
          value={String(table.state.pagination.pageSize)}
          onValueChange={(value) => table.setPageSize(Number(value))}
        >
          <SelectTrigger size="sm" className="h-7 w-16" aria-label="Rows per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BRAND_PAGE_SIZE_OPTIONS.map((value) => (
              <SelectItem key={value} value={String(value)}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
      features={brandTableFeatures}
      columns={brandColumns}
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
