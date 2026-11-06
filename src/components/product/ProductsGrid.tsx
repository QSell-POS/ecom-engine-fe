"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleCheck, CircleDashed, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { DataGrid, type ActionOutcome, type BulkAction, type RowAction } from "@/components/data-grid";
import { StatusLabel } from "@/components/common/StatusLabel";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { deleteProductAction, updateProductAction } from "@/lib/api/product/action";
import { PRODUCT_ROUTES } from "@/lib/api/product/constants";
import { productColumns, stockLevel, stockStatuses } from "@/lib/api/product/grid";
import type { Product } from "@/lib/api/product/types";
import { httpSource, type FilterOption, type GridResult } from "@/lib/data-grid";
import { ProductDetail } from "./ProductDetail";
import { availableStock, primaryImage } from "@/lib/api/product/types";

/** Primary image (position 0), or a box icon when the product has none. */
function ProductThumb({ product }: { product: Product }) {
  const image = primaryImage(product);
  if (!image?.url) {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-sm border bg-muted/40 text-muted-foreground">
        <Package className="size-3.5" />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image.url} alt={image.alt ?? ""} loading="lazy" className="size-7 shrink-0 rounded-sm border bg-muted/40 object-cover" />
  );
}

type SafeResult = { data?: unknown; serverError?: string; validationErrors?: unknown } | undefined;

function outcome(result: SafeResult, message: string): ActionOutcome {
  if (result?.data) return { ok: true, message };
  return { ok: false, error: result?.serverError ?? "Please try again." };
}

async function settle(results: Promise<SafeResult>[], message: string): Promise<ActionOutcome> {
  const settled = await Promise.all(results);
  const failed = settled.filter((r) => !r?.data).length;
  if (failed === 0) return { ok: true, message };
  return { ok: false, error: `${failed} of ${settled.length} couldn't be updated. Please try again.` };
}

async function loadProduct(id: string, signal: AbortSignal): Promise<Product | null> {
  const response = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, { signal });
  if (response.status === 404) return null;
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error ?? "Couldn't load the product");
  return body as Product;
}

export function ProductsGrid({ initialResult, facets }: { initialResult?: GridResult<Product>; facets: Record<string, FilterOption[]> }) {
  const router = useRouter();
  const source = useMemo(() => httpSource<Product>("/api/admin/products", productColumns, facets), [facets]);

  const rowActions: RowAction<Product>[] = [
    {
      id: "edit", permission: "products:update",
      label: "Edit",
      icon: Pencil,
      swipe: "leading",
      run: (product) => router.push(PRODUCT_ROUTES.edit(product.id)),
    },
    {
      id: "activate", permission: "products:update",
      label: "Set active",
      icon: CircleCheck,
      hidden: (p) => p.isActive !== false,
      optimistic: () => ({ isActive: true }),
      run: async (p) => outcome(await updateProductAction({ id: p.id, isActive: true }), `${p.name} is active`),
    },
    {
      id: "draft", permission: "products:update",
      label: "Set as draft",
      icon: CircleDashed,
      hidden: (p) => p.isActive === false,
      optimistic: () => ({ isActive: false }),
      run: async (p) => outcome(await updateProductAction({ id: p.id, isActive: false }), `${p.name} moved to drafts`),
    },
    {
      id: "delete", permission: "products:delete",
      label: "Delete",
      icon: Trash2,
      tone: "destructive",
      swipe: "trailing",
      confirm: (p) => ({
        title: `Delete ${p.name}?`,
        description: "The product will be removed from your catalog and storefront. This can't be undone.",
        confirmLabel: "Delete product",
      }),
      optimistic: "remove",
      run: async (p) => outcome(await deleteProductAction({ id: p.id }), `${p.name} deleted`),
    },
  ];

  const bulkActions: BulkAction<Product>[] = [
    {
      id: "activate", permission: "products:update",
      label: "Set active",
      icon: CircleCheck,
      optimistic: () => ({ isActive: true }),
      run: ({ rows }) => settle(rows.map((p) => updateProductAction({ id: p.id, isActive: true })), `${rows.length} products set active`),
    },
    {
      id: "draft", permission: "products:update",
      label: "Set as draft",
      icon: CircleDashed,
      optimistic: () => ({ isActive: false }),
      run: ({ rows }) => settle(rows.map((p) => updateProductAction({ id: p.id, isActive: false })), `${rows.length} products moved to drafts`),
    },
    {
      id: "delete", permission: "products:delete",
      label: "Delete",
      icon: Trash2,
      tone: "destructive",
      confirm: (count) => ({
        title: `Delete ${count} ${count === 1 ? "product" : "products"}?`,
        description: "They'll be removed from your catalog and storefront. This can't be undone.",
        confirmLabel: "Delete",
      }),
      optimistic: "remove",
      run: ({ rows }) => settle(rows.map((p) => deleteProductAction({ id: p.id })), `${rows.length} products deleted`),
    },
  ];

  return (
    <DataGrid<Product>
      id="products"
      noun={["product", "products"]}
      columns={productColumns}
      source={source}
      initialResult={initialResult}
      getRowId={(p) => p.id}
      searchPlaceholder="Search by name or SKU"
      workspace={{ icon: Package, render: (p) => <ProductDetail product={p} />, loadRow: loadProduct }}
      rowActions={rowActions}
      bulkActions={bulkActions}
      onMutated={() => router.refresh()}
      cells={{
        name: (p) => (
          <span className="flex min-w-0 items-center gap-2.5">
            <ProductThumb product={p} />
            <span className="truncate font-medium">{p.name}</span>
          </span>
        ),
        sku: (p) => <span className="font-mono text-[13px] text-muted-foreground">{p.sku}</span>,
        stock: (p) => {
          const level = stockStatuses[stockLevel(p)];
          const quantity = availableStock(p);
          return level.tone === "success" ? (
            <span className="tabular-nums">{quantity} in stock</span>
          ) : (
            <StatusLabel tone={level.tone}>{quantity === 0 ? "Out of stock" : `${quantity} left`}</StatusLabel>
          );
        },
      }}
      emptyState={
        <Empty className="border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Package />
            </EmptyMedia>
            <EmptyTitle>Add your first product</EmptyTitle>
            <EmptyDescription>Products you add here can be featured anywhere on your storefront.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href={PRODUCT_ROUTES.create}>
                <Plus /> New product
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      }
    />
  );
}
