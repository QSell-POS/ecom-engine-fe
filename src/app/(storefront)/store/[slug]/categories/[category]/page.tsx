import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/storefront/pages/CatalogView";
import { parseCatalogQuery } from "@/lib/storefront/query";
import { loadStore } from "../../store";

type Props = {
  params: Promise<{ slug: string; category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { catalog } = await loadStore(params);
  const category = await catalog.getCategory((await params).category);
  return { title: category?.name ?? "Category", description: category?.description };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { catalog } = await loadStore(params);
  const category = await catalog.getCategory((await params).category);
  if (!category) notFound();
  const query = { ...parseCatalogQuery(await searchParams), category: category.slug };
  const [results, facets] = await Promise.all([catalog.listProducts(query), catalog.facets(query)]);

  return (
    <CatalogView
      title={category.name}
      description={category.description}
      image={category.image}
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Categories", href: "/categories" }, { label: category.name }]}
      path={`/categories/${category.slug}`}
      query={query}
      results={results}
      facets={facets}
      fixed={["category"]}
    />
  );
}
