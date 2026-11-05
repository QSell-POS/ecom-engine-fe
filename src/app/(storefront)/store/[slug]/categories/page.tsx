import type { Metadata } from "next";
import { Reveal } from "@/components/storefront/motion";
import { Breadcrumbs, StoreImage, StoreLink } from "@/components/storefront/primitives";
import { loadStore, type StoreParams } from "../store";
import { productCountLabel } from "@/lib/storefront/format";

export const metadata: Metadata = { title: "Shop by category" };

export default async function CategoriesPage({ params }: StoreParams) {
  const { catalog } = await loadStore(params);
  const categories = await catalog.listCategories();

  return (
    <div className="sf-container py-8 @5xl:py-12">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Categories" }]} />
      <h1 className="sf-heading sf-title sf-h1 mt-4 mb-10">Shop by category</h1>
      <div className="grid grid-cols-2 gap-4 @3xl:grid-cols-3 @3xl:gap-6">
        {categories.map((category, i) => (
          <Reveal key={category.id} delay={i * 0.04}>
            <StoreLink href={`/categories/${category.slug}`} className="group/cat sf-focus block">
              <div className="relative overflow-hidden rounded-(--sf-radius)">
                <StoreImage src={category.image.url} alt={category.image.alt} sizes="(min-width: 1024px) 33vw, 50vw" className="aspect-4/5" imgClassName="transition-transform duration-700 ease-out group-hover/cat:scale-105" priority={i < 3} />
              </div>
              <div className="mt-4 space-y-1">
                <h2 className="sf-heading text-xl">{category.name}</h2>
                <p className="text-sm text-(--sf-muted)">{category.description}</p>
                {category.productCount > 0 && <p className="text-xs text-(--sf-muted)">{productCountLabel(category.productCount)}</p>}
              </div>
            </StoreLink>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
