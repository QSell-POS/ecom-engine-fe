"use client";

import { useState } from "react";
import { Heart, Plus } from "lucide-react";
import type { Product } from "@/lib/storefront/types";
import { cn } from "@/lib/utils";
import { Price, ProductBadges, Spinner, Stars, StoreImage, StoreLink } from "./primitives";
import { useStorefront } from "./store-context";

/** The option shoppers pick from a card: sizes first, else the only option with several values. */
function quickOption(product: Product) {
  const size = product.options.find((o) => /size|storage|shade/i.test(o.name) && o.values.length > 1);
  return size ?? (product.options.length === 1 && product.options[0].values.length > 1 ? product.options[0] : undefined);
}

export function ProductCard({ product, priority = false, sizes = "(min-width: 1024px) 25vw, 50vw" }: { product: Product; priority?: boolean; sizes?: string }) {
  const { store, addToCart, isWishlisted, toggleWishlist } = useStorefront();
  const settings = store.settings;
  const [adding, setAdding] = useState<string | null>(null);
  const saved = isWishlisted(product.id);
  const hoverImage = settings.cardHoverImage !== false ? (product.images[2] ?? product.images[1]) : undefined;
  const option = quickOption(product);
  const colors = product.options.find((o) => /color/i.test(o.name) && o.values.length > 1);
  const firstInStock = product.variants.find((v) => v.inventory > 0);

  async function quickAdd(value?: string) {
    const variant = value
      ? product.variants.find((v) => v.options[option!.name] === value && v.inventory > 0)
      : firstInStock;
    if (!variant) return;
    setAdding(value ?? "default");
    await addToCart(product, variant.id, 1);
    setAdding(null);
  }

  return (
    <article className="group/card relative flex flex-col">
      <div className="relative">
        <StoreLink href={`/products/${product.slug}`} className="sf-focus block overflow-hidden rounded-(--sf-radius)" aria-label={product.name}>
          <div className="relative aspect-(--sf-card-ratio)">
            <StoreImage
              src={product.images[0]?.url}
              alt={product.images[0]?.alt ?? product.name}
              sizes={sizes}
              priority={priority}
              className="absolute inset-0"
              imgClassName="group-hover/card:scale-[1.03]"
            />
            {hoverImage && (
              <StoreImage
                src={hoverImage.url}
                alt=""
                sizes={sizes}
                className="absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover/card:opacity-100 [@media(hover:none)]:hidden"
              />
            )}
          </div>
        </StoreLink>
        <ProductBadges badges={product.badges} price={product.price} compareAtPrice={product.compareAtPrice} />

        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className="sf-focus absolute top-2.5 right-2.5 z-10 flex size-9 items-center justify-center rounded-full bg-(--sf-bg)/85 text-(--sf-text) shadow-sm backdrop-blur transition-[transform,opacity] duration-200 hover:scale-105 @3xl:opacity-0 @3xl:group-hover/card:opacity-100 data-[saved=true]:opacity-100"
          data-saved={saved}
        >
          <Heart className={cn("size-4 transition-colors", saved && "fill-(--sf-sale) text-(--sf-sale)")} />
        </button>

        {settings.cardQuickAdd !== false && product.available && (
          <div className="absolute inset-x-2.5 bottom-2.5 z-10 hidden translate-y-2 opacity-0 transition-[opacity,transform] duration-300 ease-out group-hover/card:translate-y-0 group-hover/card:opacity-100 group-focus-within/card:translate-y-0 group-focus-within/card:opacity-100 @3xl:block">
            {option ? (
              <div className="rounded-(--sf-radius) bg-(--sf-bg)/95 p-2 shadow-lg backdrop-blur">
                <p className="mb-1.5 text-center text-[0.6875rem] font-medium tracking-wide text-(--sf-muted) uppercase">Quick add · {option.name}</p>
                <div className="flex flex-wrap justify-center gap-1">
                  {option.values.map(({ value }) => {
                    const available = product.variants.some((v) => v.options[option.name] === value && v.inventory > 0);
                    return (
                      <button
                        key={value}
                        type="button"
                        disabled={!available || adding !== null}
                        onClick={() => quickAdd(value)}
                        className="sf-focus min-w-9 rounded-(--sf-input-radius) border border-(--sf-line) px-2 py-1.5 text-xs font-medium transition-colors hover:border-(--sf-text) hover:bg-(--sf-text) hover:text-(--sf-bg) disabled:cursor-not-allowed disabled:line-through disabled:opacity-40"
                      >
                        {adding === value ? <Spinner className="size-3" /> : value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => quickAdd()} disabled={adding !== null} className="sf-btn sf-btn-primary sf-btn-sm sf-btn-block shadow-lg">
                {adding ? <Spinner className="size-3.5" /> : <Plus className="size-4" />} Add to bag
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-3.5 flex flex-1 flex-col gap-1">
        {settings.cardShowBrand !== false && <p className="text-[0.6875rem] font-medium tracking-[0.12em] text-(--sf-muted) uppercase">{product.brand.name}</p>}
        <h3 className="text-[0.9375rem] leading-snug">
          <StoreLink href={`/products/${product.slug}`} className="transition-opacity hover:opacity-70">
            {product.name}
          </StoreLink>
        </h3>
        {settings.cardShowRating !== false && product.rating.count > 0 && (
          <div className="flex items-center gap-1.5 text-(--sf-text)">
            <Stars rating={product.rating.average} size={12} />
            <span className="text-xs text-(--sf-muted)">({product.rating.count})</span>
          </div>
        )}
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <Price price={product.price} compareAtPrice={product.compareAtPrice} />
          {colors && (
            <span className="flex items-center gap-1" aria-label={`${colors.values.length} colors`}>
              {colors.values.slice(0, 4).map((c) => (
                <span key={c.value} title={c.value} className="size-3 rounded-full border border-(--sf-line)" style={{ background: c.swatch ?? "#ccc" }} />
              ))}
              {colors.values.length > 4 && <span className="text-xs text-(--sf-muted)">+{colors.values.length - 4}</span>}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, columns = 4, priorityCount = 0 }: { products: Product[]; columns?: number; priorityCount?: number }) {
  const desktop = { 2: "@5xl:grid-cols-2", 3: "@5xl:grid-cols-3", 4: "@5xl:grid-cols-4", 5: "@5xl:grid-cols-5" }[Math.min(5, Math.max(2, columns))];
  return (
    <div className={cn("grid grid-cols-2 gap-x-4 gap-y-9 @3xl:grid-cols-3 @3xl:gap-x-6 @3xl:gap-y-12", desktop)}>
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} priority={i < priorityCount} />
      ))}
    </div>
  );
}
