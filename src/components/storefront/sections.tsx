"use client";

import { useRef, useState, type ComponentType } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Gift, Heart, Leaf, Lock, MessageCircle, RefreshCw, ShieldCheck, Sparkles, Star, Truck, type LucideIcon } from "lucide-react";
import type { HomeData, Product, StoreImage as StoreImageData } from "@/lib/storefront/types";
import type { SectionInstance, SettingValues } from "@/lib/theme-engine/types";
import { cn } from "@/lib/utils";
import { EditableBlock, useInEditor } from "./editor-bridge";
import { productCountLabel } from "@/lib/storefront/format";
import { EASE, Reveal, RevealGroup, RevealItem, useMotionEnabled } from "./motion";
import { ProductCard, ProductGrid } from "./ProductCard";
import { SectionHeading, Stars, StoreImage, StoreLink } from "./primitives";
import { schemeClass, spaceClass } from "./theme-vars";

// Home page sections. Every section is a pure function of its settings and
// the store's HomeData, so it renders identically on the live store, in the
// simple customizer preview and in the builder canvas. Responsive rules use
// container queries (@3xl ≈ tablet, @5xl ≈ desktop) against .sf-root.

export type SectionProps = { section: SectionInstance; data: HomeData };

const s = (v: SettingValues, k: string) => String(v[k] ?? "");
const n = (v: SettingValues, k: string) => Number(v[k] ?? 0);

/** Stable pick from the store's stock imagery, so an empty image setting never renders blank. */
function fallback(list: StoreImageData[], key: string, offset = 0): StoreImageData | undefined {
  if (list.length === 0) return undefined;
  let hash = offset;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return list[hash % list.length];
}

/** Content-based key: section ids change when a theme is rebuilt, the content doesn't. */
const stableKey = (section: SectionInstance) => `${section.type}:${String(section.settings.heading ?? "")}`;

function imageFor(value: string, list: StoreImageData[], key: string, offset = 0) {
  return value ? { url: value, alt: "" } : fallback(list, key, offset);
}

function ButtonLink({ label, url, variant = "primary" }: { label: string; url: string; variant?: string }) {
  if (!label) return null;
  return (
    <StoreLink href={url || "/products"} className={cn("sf-btn", variant === "secondary" ? "sf-btn-secondary" : "sf-btn-primary")}>
      {label}
    </StoreLink>
  );
}

function Frame({ section, className, children }: { section: SectionInstance; className?: string; children: React.ReactNode }) {
  return <section className={cn(schemeClass(section.settings.colorScheme), spaceClass(section.settings.spacing), className)}>{children}</section>;
}

// ------------------------------------------------------------------- hero

const HERO_HEIGHT: Record<string, string> = {
  medium: "min-h-[26rem] @5xl:min-h-[34rem]",
  large: "min-h-[32rem] @5xl:min-h-[44rem]",
  full: "min-h-[38rem] @5xl:min-h-[52rem]",
};

function Hero({ section, data }: SectionProps) {
  const v = section.settings;
  const image = imageFor(s(v, "image"), data.media.hero, stableKey(section));
  const animate = useMotionEnabled();
  const centered = s(v, "alignment") === "center";
  const buttons = (
    <div className={cn("flex flex-wrap gap-3 pt-2", centered && "justify-center")}>
      {section.blocks.map((block) => (
        <EditableBlock key={block.id} sectionId={section.id} blockId={block.id}>
          <ButtonLink label={s(block.settings, "label")} url={s(block.settings, "url")} variant={s(block.settings, "style")} />
        </EditableBlock>
      ))}
    </div>
  );
  const copy = (light: boolean) => (
    <RevealGroup className={cn("max-w-2xl space-y-5", centered && "mx-auto text-center", light && "sf-on-image text-white")} stagger={0.1}>
      {s(v, "eyebrow") && (
        <RevealItem>
          <p className="sf-eyebrow opacity-90">{s(v, "eyebrow")}</p>
        </RevealItem>
      )}
      <RevealItem>
        <h1 className="sf-heading sf-h1 text-balance">{s(v, "heading")}</h1>
      </RevealItem>
      {s(v, "text") && (
        <RevealItem>
          <p className={cn("max-w-xl text-base leading-relaxed @3xl:text-lg", light ? "text-white/85" : "text-(--sf-muted)", centered && "mx-auto")}>{s(v, "text")}</p>
        </RevealItem>
      )}
      <RevealItem>{buttons}</RevealItem>
    </RevealGroup>
  );

  if (s(v, "layout") === "split") {
    return (
      <section className={cn(schemeClass(v.colorScheme), "overflow-hidden")}>
        <div className="sf-container grid items-center gap-10 py-10 @4xl:grid-cols-2 @4xl:py-16 @5xl:gap-16">
          <div className={cn("order-2 @4xl:order-1", centered && "text-center")}>{copy(false)}</div>
          <motion.div
            className="order-1 @4xl:order-2"
            initial={animate ? { opacity: 0, scale: 0.97 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: EASE }}
          >
            <StoreImage src={image?.url} alt={image?.alt ?? ""} priority sizes="(min-width: 1024px) 50vw, 100vw" className="aspect-4/3 rounded-(--sf-radius) @4xl:aspect-5/4" />
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("relative isolate flex overflow-hidden", HERO_HEIGHT[s(v, "height")] ?? HERO_HEIGHT.large)}>
      <motion.div
        className="absolute inset-0 -z-10"
        initial={animate ? { scale: 1.08 } : false}
        animate={{ scale: 1 }}
        transition={{ duration: 1.8, ease: EASE }}
      >
        <StoreImage src={image?.url} alt={image?.alt ?? ""} priority className="absolute inset-0" />
      </motion.div>
      <div className="absolute inset-0 -z-10 bg-black" style={{ opacity: n(v, "overlay") / 100 }} />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-linear-to-t from-black/35 to-transparent" />
      <div className={cn("sf-container flex w-full py-14 @5xl:py-20", centered ? "items-center justify-center" : "items-end")}>{copy(true)}</div>
    </section>
  );
}

// ---------------------------------------------------------------- marquee

function Marquee({ section }: SectionProps) {
  const v = section.settings;
  const items = s(v, "items").split("|").map((item) => item.trim()).filter(Boolean);
  if (items.length === 0) return null;
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden} className="flex shrink-0 items-center">
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-10 pr-10 text-sm font-medium tracking-wide whitespace-nowrap @3xl:text-[0.9375rem]">
          {item}
          <Sparkles className="size-3.5 opacity-60" aria-hidden />
        </li>
      ))}
    </ul>
  );
  return (
    <Frame section={section} className={cn("overflow-hidden", s(v, "spacing") === "none" && "py-3.5!")}>
      <div className="sf-marquee flex w-max" style={{ "--sf-marquee-speed": `${n(v, "speed") || 40}s` } as React.CSSProperties}>
        {row(false)}
        {row(true)}
        {row(true)}
        {row(true)}
      </div>
    </Frame>
  );
}

// ------------------------------------------------------------- categories

const DESKTOP_COLS: Record<number, string> = { 2: "@5xl:grid-cols-2", 3: "@5xl:grid-cols-3", 4: "@5xl:grid-cols-4", 5: "@5xl:grid-cols-5", 6: "@5xl:grid-cols-6" };

function Categories({ section, data }: SectionProps) {
  const v = section.settings;
  const categories = data.categories.slice(0, n(v, "count") || 4);
  const overlay = s(v, "style") === "overlay";
  return (
    <Frame section={section}>
      <div className="sf-container">
        <Reveal>
          <SectionHeading
            title={s(v, "heading")}
            text={s(v, "subheading")}
            action={
              <StoreLink href="/categories" className="sf-link text-sm font-medium">
                View all
              </StoreLink>
            }
          />
        </Reveal>
        <RevealGroup className={cn("grid grid-cols-2 gap-3 @3xl:grid-cols-3 @3xl:gap-5", DESKTOP_COLS[n(v, "columns")] ?? DESKTOP_COLS[4])}>
          {categories.map((category) => (
            <RevealItem key={category.id}>
              <StoreLink href={`/categories/${category.slug}`} className="group/cat sf-focus block">
                <div className="relative overflow-hidden rounded-(--sf-radius)">
                  <StoreImage
                    src={category.image.url}
                    alt={category.image.alt}
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className={overlay ? "aspect-3/4" : "aspect-(--sf-card-ratio)"}
                    imgClassName="transition-transform duration-700 ease-out group-hover/cat:scale-105"
                  />
                  {overlay && (
                    <>
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/5 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 text-white @3xl:p-5">
                        <div>
                          <p className="sf-heading text-lg @3xl:text-xl">{category.name}</p>
                          {category.productCount > 0 && <p className="text-xs text-white/75">{productCountLabel(category.productCount)}</p>}
                        </div>
                        <ArrowRight className="size-5 -translate-x-1 opacity-0 transition-all duration-300 group-hover/cat:translate-x-0 group-hover/cat:opacity-100" />
                      </div>
                    </>
                  )}
                </div>
                {!overlay && (
                  <div className="mt-3 flex items-center justify-between">
                    <p className="font-medium">{category.name}</p>
                    {category.productCount > 0 && <span className="text-xs text-(--sf-muted)">{productCountLabel(category.productCount)}</span>}
                  </div>
                )}
              </StoreLink>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </Frame>
  );
}

// --------------------------------------------------------------- products

export function productsForCollection(products: Product[], collection: string) {
  if (collection === "all") return products;
  if (collection === "sale") return products.filter((p) => p.compareAtPrice !== null && p.compareAtPrice > p.price);
  return products.filter((p) => p.collections.includes(collection));
}

function Carousel({ products }: { products: Product[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState<{ start: boolean; end: boolean }>({ start: true, end: false });
  const scroll = (direction: 1 | -1) => track.current?.scrollBy({ left: direction * track.current.clientWidth * 0.8, behavior: "smooth" });
  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  };
  return (
    <div className="relative">
      <div ref={track} onScroll={onScroll} className="sf-no-scrollbar -mx-[clamp(1rem,4cqi,2.5rem)] flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-[clamp(1rem,4cqi,2.5rem)] px-[clamp(1rem,4cqi,2.5rem)] pb-2 @3xl:gap-6">
        {products.map((product) => (
          <div key={product.id} className="w-[46%] shrink-0 snap-start @3xl:w-[31%] @5xl:w-[calc((100%-4.5rem)/4)]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
      <div className="mt-6 hidden justify-end gap-2 @3xl:flex">
        {([-1, 1] as const).map((direction) => (
          <button
            key={direction}
            type="button"
            aria-label={direction === -1 ? "Previous products" : "Next products"}
            disabled={direction === -1 ? edge.start : edge.end}
            onClick={() => scroll(direction)}
            className="sf-focus flex size-11 items-center justify-center rounded-full border border-(--sf-line) transition-colors hover:border-(--sf-fg) disabled:opacity-30"
          >
            {direction === -1 ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function Products({ section, data }: SectionProps) {
  const inEditor = useInEditor();
  const v = section.settings;
  const collection = s(v, "collection") || "all";
  const matching = productsForCollection(data.products, collection).slice(0, n(v, "count") || 8);
  // Grids fill complete rows once there's more than one (no ragged last row on desktop).
  const columns = n(v, "columns") || 4;
  const products = s(v, "layout") !== "carousel" && matching.length > columns ? matching.slice(0, Math.floor(matching.length / columns) * columns) : matching;
  const href = collection === "all" ? "/products" : `/products?collection=${collection}`;
  // An empty collection renders nothing rather than a heading over blank space.
  // The theme editor still shows it, so the merchant can see and fix it.
  if (products.length === 0 && !inEditor) return null;
  return (
    <Frame section={section}>
      <div className="sf-container">
        <Reveal>
          <SectionHeading
            title={s(v, "heading")}
            text={s(v, "subheading")}
            action={
              v.showViewAll !== false ? (
                <StoreLink href={href} className="group/all inline-flex items-center gap-1.5 text-sm font-medium">
                  <span className="sf-link">View all</span>
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover/all:translate-x-0.5" />
                </StoreLink>
              ) : undefined
            }
          />
        </Reveal>
        <Reveal delay={0.05}>{s(v, "layout") === "carousel" ? <Carousel products={products} /> : <ProductGrid products={products} columns={n(v, "columns")} />}</Reveal>
      </div>
    </Frame>
  );
}

// ------------------------------------------------------------ promo banner

const PROMO_HEIGHT: Record<string, string> = { small: "min-h-[18rem]", medium: "min-h-[24rem] @5xl:min-h-[28rem]", large: "min-h-[30rem] @5xl:min-h-[36rem]" };

function PromoBanner({ section, data }: SectionProps) {
  const v = section.settings;
  const image = imageFor(s(v, "image"), data.media.banners, stableKey(section));
  const centered = s(v, "alignment") === "center";
  return (
    <Frame section={section}>
      <div className="sf-container">
        <Reveal className={cn("group/promo relative isolate flex overflow-hidden rounded-(--sf-radius)", PROMO_HEIGHT[s(v, "height")] ?? PROMO_HEIGHT.medium)}>
          <StoreImage src={image?.url} alt="" className="absolute inset-0 -z-10" imgClassName="transition-transform duration-[1.2s] ease-out group-hover/promo:scale-[1.03]" />
          <div className="absolute inset-0 -z-10 bg-black" style={{ opacity: n(v, "overlay") / 100 }} />
          <div className={cn("sf-on-image flex w-full flex-col justify-center gap-4 p-8 text-white @3xl:p-14", centered ? "items-center text-center" : "items-start")}>
            {s(v, "eyebrow") && <p className="sf-eyebrow opacity-90">{s(v, "eyebrow")}</p>}
            <h2 className="sf-heading sf-h2 max-w-2xl text-balance">{s(v, "heading")}</h2>
            {s(v, "text") && <p className="max-w-lg text-white/85">{s(v, "text")}</p>}
            <div className="pt-2">
              <ButtonLink label={s(v, "buttonLabel")} url={s(v, "buttonUrl")} />
            </div>
          </div>
        </Reveal>
      </div>
    </Frame>
  );
}

// -------------------------------------------------------- collection tiles

function CollectionTiles({ section, data }: SectionProps) {
  const v = section.settings;
  const cols = section.blocks.length >= 3 ? "@4xl:grid-cols-3" : "@4xl:grid-cols-2";
  return (
    <Frame section={section}>
      <div className="sf-container">
        {s(v, "heading") && (
          <Reveal>
            <SectionHeading title={s(v, "heading")} />
          </Reveal>
        )}
        <RevealGroup className={cn("grid gap-4 @3xl:gap-6", cols)}>
          {section.blocks.map((block, i) => {
            // No image set: a tile linking to a category shows that category; others get distinct banners.
            const category = data.categories.find((c) => s(block.settings, "url") === `/categories/${c.slug}`);
            const image = s(block.settings, "image")
              ? { url: s(block.settings, "image"), alt: "" }
              : (category?.image ?? data.media.banners[i % Math.max(1, data.media.banners.length)]);
            return (
              <RevealItem key={block.id}>
                <EditableBlock sectionId={section.id} blockId={block.id}>
                  <StoreLink href={s(block.settings, "url") || "/products"} className="group/tile sf-focus relative isolate block overflow-hidden rounded-(--sf-radius)">
                    <StoreImage src={image?.url} alt="" sizes="(min-width: 1024px) 50vw, 100vw" className="aspect-4/3 @4xl:aspect-4/5" imgClassName="transition-transform duration-[1.1s] ease-out group-hover/tile:scale-105" />
                    <div className="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6 text-white @3xl:p-8">
                      <h3 className="sf-heading sf-h3">{s(block.settings, "title")}</h3>
                      {s(block.settings, "label") && (
                        <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium">
                          <span className="border-b border-white/60 pb-0.5 transition-colors group-hover/tile:border-white">{s(block.settings, "label")}</span>
                          <ArrowRight className="size-4 transition-transform duration-300 group-hover/tile:translate-x-1" />
                        </span>
                      )}
                    </div>
                  </StoreLink>
                </EditableBlock>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </Frame>
  );
}

// -------------------------------------------------------- image with text

function ImageWithText({ section, data }: SectionProps) {
  const v = section.settings;
  const image = imageFor(s(v, "image"), data.media.lifestyle, stableKey(section), 2);
  const right = s(v, "imagePosition") === "right";
  return (
    <Frame section={section}>
      <div className="sf-container grid items-center gap-10 @4xl:grid-cols-2 @5xl:gap-20">
        <Reveal className={cn(right && "@4xl:order-2")}>
          <StoreImage src={image?.url} alt="" sizes="(min-width: 1024px) 50vw, 100vw" className="aspect-4/5 rounded-(--sf-radius) @4xl:aspect-5/6" />
        </Reveal>
        <Reveal delay={0.1} className="max-w-xl space-y-5">
          {s(v, "eyebrow") && <p className="sf-eyebrow text-(--sf-muted)">{s(v, "eyebrow")}</p>}
          <h2 className="sf-heading sf-h2 text-balance">{s(v, "heading")}</h2>
          <p className="text-base leading-relaxed text-(--sf-muted) @3xl:text-[1.0625rem]">{s(v, "text")}</p>
          <div className="pt-2">
            <ButtonLink label={s(v, "buttonLabel")} url={s(v, "buttonUrl")} variant="secondary" />
          </div>
        </Reveal>
      </div>
    </Frame>
  );
}

// ---------------------------------------------------------------- features

const FEATURE_ICONS: Record<string, LucideIcon> = {
  truck: Truck, refresh: RefreshCw, shield: ShieldCheck, message: MessageCircle, leaf: Leaf,
  gift: Gift, lock: Lock, star: Star, heart: Heart, sparkles: Sparkles,
};

function Features({ section }: SectionProps) {
  const v = section.settings;
  const centered = s(v, "alignment") === "center";
  const cols = { 2: "@4xl:grid-cols-2", 3: "@4xl:grid-cols-3", 4: "@4xl:grid-cols-4", 5: "@4xl:grid-cols-5", 6: "@4xl:grid-cols-6" }[n(v, "columns")] ?? "@4xl:grid-cols-4";
  return (
    <Frame section={section}>
      <div className="sf-container">
        {s(v, "heading") && (
          <Reveal>
            <SectionHeading title={s(v, "heading")} align={centered ? "center" : "left"} />
          </Reveal>
        )}
        <RevealGroup className={cn("grid grid-cols-1 gap-8 @xl:grid-cols-2 @4xl:gap-10", cols)}>
          {section.blocks.map((block) => {
            const Icon = FEATURE_ICONS[s(block.settings, "icon")] ?? Sparkles;
            return (
              <RevealItem key={block.id}>
                <EditableBlock sectionId={section.id} blockId={block.id} className={cn("flex gap-4", centered && "flex-col items-center text-center")}>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-(--sf-line)">
                    <Icon className="size-5" strokeWidth={1.6} />
                  </span>
                  <div className="space-y-1">
                    <h3 className="font-medium">{s(block.settings, "title")}</h3>
                    <p className="text-sm text-(--sf-muted)">{s(block.settings, "text")}</p>
                  </div>
                </EditableBlock>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </Frame>
  );
}

// ------------------------------------------------------------------ brands

function Brands({ section, data }: SectionProps) {
  const v = section.settings;
  const wordmarks = s(v, "style") === "wordmarks";
  return (
    <Frame section={section}>
      <div className="sf-container">
        <Reveal>
          <SectionHeading
            title={s(v, "heading")}
            action={
              <StoreLink href="/brands" className="sf-link text-sm font-medium">
                All brands
              </StoreLink>
            }
          />
        </Reveal>
        {wordmarks ? (
          <RevealGroup className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 @5xl:justify-between">
            {data.brands.map((brand) => (
              <RevealItem key={brand.id}>
                <StoreLink href={`/brands/${brand.slug}`} className="sf-heading text-2xl text-(--sf-muted) transition-colors hover:text-(--sf-fg) @3xl:text-3xl">
                  {brand.name}
                </StoreLink>
              </RevealItem>
            ))}
          </RevealGroup>
        ) : (
          <RevealGroup className="grid grid-cols-2 gap-4 @4xl:grid-cols-4 @3xl:gap-6">
            {data.brands.map((brand) => (
              <RevealItem key={brand.id}>
                <StoreLink href={`/brands/${brand.slug}`} className="group/brand sf-focus block">
                  <div className="relative overflow-hidden rounded-(--sf-radius)">
                    <StoreImage src={brand.image.url} alt="" sizes="(min-width: 1024px) 25vw, 50vw" className="aspect-4/3" imgClassName="transition-transform duration-700 ease-out group-hover/brand:scale-105" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors duration-300 group-hover/brand:bg-black/40">
                      <span className="sf-heading px-3 text-center text-xl text-white @3xl:text-2xl">{brand.name}</span>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-(--sf-muted)">{brand.description}</p>
                </StoreLink>
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </div>
    </Frame>
  );
}

// ------------------------------------------------------------ testimonials

function Testimonials({ section }: SectionProps) {
  const v = section.settings;
  return (
    <Frame section={section}>
      <div className="sf-container">
        <Reveal>
          <SectionHeading title={s(v, "heading")} align="center" />
        </Reveal>
        <RevealGroup className="grid gap-4 @4xl:grid-cols-3 @3xl:gap-6">
          {section.blocks.map((block) => (
            <RevealItem key={block.id}>
              <EditableBlock sectionId={section.id} blockId={block.id} className="flex h-full flex-col gap-5 rounded-(--sf-radius) bg-(--sf-bg) p-7 text-(--sf-text) @3xl:p-8">
                <Stars rating={n(block.settings, "rating") || 5} size={15} />
                <blockquote className="sf-heading flex-1 text-lg leading-snug @3xl:text-xl">&ldquo;{s(block.settings, "quote")}&rdquo;</blockquote>
                <footer className="text-sm">
                  <p className="font-medium">{s(block.settings, "author")}</p>
                  {s(block.settings, "detail") && <p className="text-(--sf-muted)">{s(block.settings, "detail")}</p>}
                </footer>
              </EditableBlock>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </Frame>
  );
}

// --------------------------------------------------------------- newsletter

function Newsletter({ section }: SectionProps) {
  const v = section.settings;
  const [done, setDone] = useState(false);
  return (
    <Frame section={section}>
      <Reveal className="sf-container max-w-2xl! text-center">
        <h2 className="sf-heading sf-h2 text-balance">{s(v, "heading")}</h2>
        {s(v, "text") && <p className="mx-auto mt-3 max-w-lg text-(--sf-muted)">{s(v, "text")}</p>}
        {done ? (
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-8 font-medium">
            You&apos;re on the list. Welcome!
          </motion.p>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setDone(true);
            }}
            className="mx-auto mt-8 flex max-w-md flex-col gap-2 @xl:flex-row"
          >
            <input type="email" required placeholder="Your email" aria-label="Email address" className="sf-input flex-1 bg-transparent! text-(--sf-fg)! placeholder:text-(--sf-muted)!" />
            <button type="submit" className="sf-btn sf-btn-primary">
              {s(v, "buttonLabel") || "Subscribe"}
            </button>
          </form>
        )}
      </Reveal>
    </Frame>
  );
}

// ---------------------------------------------------------------- rich text

function RichText({ section }: SectionProps) {
  const v = section.settings;
  const centered = s(v, "alignment") !== "left";
  return (
    <Frame section={section}>
      <Reveal className={cn("sf-container max-w-3xl! space-y-4", centered && "text-center")}>
        {s(v, "eyebrow") && <p className="sf-eyebrow text-(--sf-muted)">{s(v, "eyebrow")}</p>}
        {s(v, "heading") && <h2 className="sf-heading sf-h2 text-balance">{s(v, "heading")}</h2>}
        {s(v, "text") && <p className="text-base leading-relaxed text-(--sf-muted) @3xl:text-lg">{s(v, "text")}</p>}
        {s(v, "buttonLabel") && (
          <div className="pt-3">
            <ButtonLink label={s(v, "buttonLabel")} url={s(v, "buttonUrl")} variant="secondary" />
          </div>
        )}
      </Reveal>
    </Frame>
  );
}

export const SECTION_COMPONENTS: Record<string, ComponentType<SectionProps>> = {
  hero: Hero,
  marquee: Marquee,
  categories: Categories,
  products: Products,
  "promo-banner": PromoBanner,
  "collection-tiles": CollectionTiles,
  "image-with-text": ImageWithText,
  features: Features,
  brands: Brands,
  testimonials: Testimonials,
  newsletter: Newsletter,
  "rich-text": RichText,
};
