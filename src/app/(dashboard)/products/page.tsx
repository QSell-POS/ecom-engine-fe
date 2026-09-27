import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { ProductsGrid } from "@/components/product/ProductsGrid";
import { Button } from "@/components/ui/button";
import { PRODUCT_ROUTES } from "@/lib/api/product/constants";
import { productColumns } from "@/lib/api/product/grid";
import { productFacets, queryProducts } from "@/lib/api/product/grid-server";
import { parseQuery } from "@/lib/data-grid";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const params = new URLSearchParams(
    Object.entries(raw).flatMap(([key, value]) => (typeof value === "string" ? [[key, value]] : [])),
  );
  // First page rendered on the server for the exact URL, so there's no loading flash.
  // If the API is down, render the grid anyway: it shows its own error + retry.
  const [initialResult, facets] = await Promise.all([
    queryProducts(parseQuery(params, productColumns)).catch(() => undefined),
    productFacets().catch(() => ({})),
  ]);

  return (
    <>
      <PageHeader
        title="Products"
        description="Everything you sell, with pricing and stock at a glance."
        actions={
          <Button asChild>
            <Link href={PRODUCT_ROUTES.create}>
              <Plus /> New product
            </Link>
          </Button>
        }
      />
      <ProductsGrid initialResult={initialResult} facets={facets} />
    </>
  );
}
