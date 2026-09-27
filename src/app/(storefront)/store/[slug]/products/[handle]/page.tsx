import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductView } from "@/components/storefront/pages/ProductView";
import type { Review } from "@/lib/storefront/types";
import { loadStore } from "../../store";

type Props = { params: Promise<{ slug: string; handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { catalog } = await loadStore(params);
  const product = await catalog.getProduct((await params).handle);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: { title: product.name, description: product.description.slice(0, 160), images: product.images.slice(0, 1).map((i) => ({ url: i.url })) },
  };
}

export default async function ProductPage({ params }: Props) {
  const { store, catalog } = await loadStore(params);
  const { handle } = await params;
  const product = await catalog.getProduct(handle);
  if (!product) notFound();

  const [related, firstPage] = await Promise.all([catalog.relatedProducts(handle, 4), catalog.listReviews(handle, 1)]);
  // Load the remaining review pages (bounded) so the page can reveal them without extra round trips.
  const pages = await Promise.all(
    Array.from({ length: Math.min(firstPage.reviews.pageCount, 4) - 1 }, (_, i) => catalog.listReviews(handle, i + 2)),
  );
  const reviews: Review[] = [firstPage, ...pages].flatMap((page) => page.reviews.items);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => i.url),
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: product.brand.name },
    aggregateRating: product.rating.count ? { "@type": "AggregateRating", ratingValue: product.rating.average, reviewCount: product.rating.count } : undefined,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: store.profile.currency,
      availability: product.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ProductView product={product} related={related} reviewSummary={firstPage.summary} reviews={reviews} />
    </>
  );
}
