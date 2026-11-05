import type { Metadata } from "next";
import { Reveal } from "@/components/storefront/motion";
import { Breadcrumbs, StoreImage, StoreLink } from "@/components/storefront/primitives";
import { loadStore, type StoreParams } from "../store";
import { productCountLabel } from "@/lib/storefront/format";

export const metadata: Metadata = { title: "Brands" };

export default async function BrandsPage({ params }: StoreParams) {
  const { catalog } = await loadStore(params);
  const brands = await catalog.listBrands();

  return (
    <div className="sf-container py-8 @5xl:py-12">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Brands" }]} />
      <h1 className="sf-heading sf-title sf-h1 mt-4 mb-10">Our brands</h1>
      <div className="grid gap-6 @3xl:grid-cols-2">
        {brands.map((brand, i) => (
          <Reveal key={brand.id} delay={i * 0.05}>
            <StoreLink href={`/brands/${brand.slug}`} className="group/brand sf-focus relative isolate block overflow-hidden rounded-(--sf-radius)">
              <StoreImage src={brand.image.url} alt="" sizes="(min-width: 768px) 50vw, 100vw" className="aspect-16/10" imgClassName="transition-transform duration-700 ease-out group-hover/brand:scale-105" priority={i < 2} />
              <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white @3xl:p-8">
                <h2 className="sf-heading sf-h2">{brand.name}</h2>
                <p className="mt-1 max-w-md text-sm text-white/85">{brand.description}</p>
                <p className="mt-3 text-xs font-medium tracking-wide text-white/80 uppercase">{productCountLabel(brand.productCount)}</p>
              </div>
            </StoreLink>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
