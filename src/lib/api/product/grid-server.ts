import "server-only";
import { applyQuery, deriveOptions, type FilterOption, type GridQuery, type GridResult } from "@/lib/data-grid";
import { productColumns } from "./grid";
import { getProductsAdmin } from "./service";
import type { Product } from "./types";

// The catalog API supports page/limit/search but not sorting or filtering,
// so this backend-for-frontend layer runs the shared query engine on the
// server. When the API supports the full query natively, forward the query
// here instead. Callers (route handler, pages, native apps) don't change.

async function loadCatalog(): Promise<Product[]> {
  const response = await getProductsAdmin({ limit: 1000 });
  return response?.data ?? [];
}

export async function queryProducts(query: GridQuery): Promise<GridResult<Product>> {
  const { rows, total } = applyQuery(await loadCatalog(), productColumns, query);
  return { rows, total };
}

/** Filter options for server-mode multiselects (the client can't derive them). */
export async function productFacets(): Promise<Record<string, FilterOption[]>> {
  const catalog = await loadCatalog();
  const facetColumns = productColumns.filter((c) => c.filter?.type === "multiselect");
  return Object.fromEntries(facetColumns.map((column) => [column.id, deriveOptions(column, catalog)]));
}
