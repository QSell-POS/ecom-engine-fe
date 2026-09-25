"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Upload,
} from "lucide-react";
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
  exportProducts,
  productColumns,
  productTableFeatures,
  type ProductTable,
} from "@/lib/api/product/table-columns";
import { PRODUCT_PAGE_SIZE_OPTIONS } from "@/lib/api/product/constants";
import type { Product } from "@/lib/api/product/types";

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
      <Input
        value={String(table.state.globalFilter ?? "")}
        onChange={(event) => table.setGlobalFilter(event.target.value)}
        placeholder="Search"
        aria-label="Search products"
        className="h-8 w-full max-w-72"
      />
      <div className="flex items-center gap-2">
        <Select
          value={category}
          onValueChange={(value) =>
            table
              .getColumn("category")
              ?.setFilterValue(value === "all" ? undefined : value)
          }
        >
          <SelectTrigger className="h-8 w-auto" aria-label="Filter by category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Category</SelectItem>
            {categories.map((value) => (
              <SelectItem key={value} value={value as string}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={brand}
          onValueChange={(value) =>
            table
              .getColumn("brand")
              ?.setFilterValue(value === "all" ? undefined : value)
          }
        >
          <SelectTrigger className="h-8 w-auto" aria-label="Filter by brand">
            <SelectValue placeholder="Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Brand</SelectItem>
            {brands.map((value) => (
              <SelectItem key={value} value={value as string}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <Select
          value={String(table.state.pagination.pageSize)}
          onValueChange={(value) => table.setPageSize(Number(value))}
        >
          <SelectTrigger className="h-7 w-16" aria-label="Rows per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRODUCT_PAGE_SIZE_OPTIONS.map((value) => (
              <SelectItem key={value} value={String(value)}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        features={productTableFeatures}
        columns={productColumns}
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
