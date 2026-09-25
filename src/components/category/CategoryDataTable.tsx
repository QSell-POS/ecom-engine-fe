"use client";

import { TbChevronLeft, TbChevronRight } from "react-icons/tb";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  categoryColumns,
  categoryTableFeatures,
  type CategoryTable,
} from "@/lib/api/category/table-columns";
import { CATEGORY_PAGE_SIZE_OPTIONS } from "@/lib/api/category/constants";
import type { Category } from "@/lib/api/category/types";

function Toolbar({ table }: { table: CategoryTable }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
      <Input
        value={String(table.state.globalFilter ?? "")}
        onChange={(event) => table.setGlobalFilter(event.target.value)}
        placeholder="Search categories"
        className="h-8 w-full max-w-72"
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
          <SelectTrigger className="h-7 w-auto" aria-label="Rows per page">
            <SelectValue placeholder="Rows per page" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_PAGE_SIZE_OPTIONS.map((value) => (
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
      features={categoryTableFeatures}
      columns={categoryColumns}
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
