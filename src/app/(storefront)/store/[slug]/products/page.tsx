import type { Metadata } from "next";
import { CatalogView } from "@/components/storefront/pages/CatalogView";
import { parseCatalogQuery } from "@/lib/storefront/query";
import { loadStore, type StoreParams } from "../store";

type Props = StoreParams & { searchParams: Promise<Record<string, string | string[] | undefined>> };

const COLLECTION_TITLES: Record<string, { title: string; description: string }> = {
  "new-arrivals": { title: "New arrivals", description: "The latest additions, fresh this season." },
  "best-sellers": { title: "Best sellers", description: "The pieces our customers love most." },
  sale: { title: "Sale", description: "Limited-time prices on favourites. While stocks last." },
};

function heading(query: ReturnType<typeof parseCatalogQuery>): { title: string; description?: string } {
  if (query.q) return { title: `Results for “${query.q}”` };
  return (query.collection && COLLECTION_TITLES[query.collection]) || { title: "All products", description: "Everything in the store, in one place." };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return { title: heading(parseCatalogQuery(await searchParams)).title };
}

export default async function ProductsPage({ params, searchParams }: Props) {
  const { catalog } = await loadStore(params);
  const query = parseCatalogQuery(await searchParams);
  const [results, facets] = await Promise.all([catalog.listProducts(query), catalog.facets(query)]);
  const { title, description } = heading(query);

  return (
    <CatalogView
      title={title}
      description={description}
      breadcrumbs={[{ label: "Home", href: "/" }, { label: query.q ? "Search" : title }]}
      path="/products"
      query={query}
      results={results}
      facets={facets}
    />
  );
}
