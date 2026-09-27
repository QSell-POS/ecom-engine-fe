import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/storefront/pages/CatalogView";
import { parseCatalogQuery } from "@/lib/storefront/query";
import { loadStore } from "../../store";

type Props = {
  params: Promise<{ slug: string; brand: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { catalog } = await loadStore(params);
  const brand = await catalog.getBrand((await params).brand);
  return { title: brand?.name ?? "Brand", description: brand?.description };
}

export default async function BrandPage({ params, searchParams }: Props) {
  const { catalog } = await loadStore(params);
  const brand = await catalog.getBrand((await params).brand);
  if (!brand) notFound();
  const query = { ...parseCatalogQuery(await searchParams), brands: [brand.slug] };
  const [results, facets] = await Promise.all([catalog.listProducts(query), catalog.facets(query)]);

  return (
    <CatalogView
      title={brand.name}
      description={brand.description}
      image={brand.image}
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Brands", href: "/brands" }, { label: brand.name }]}
      path={`/brands/${brand.slug}`}
      query={query}
      results={results}
      facets={facets}
      fixed={["brands"]}
    />
  );
}
