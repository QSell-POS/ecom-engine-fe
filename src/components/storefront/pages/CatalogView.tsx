"use client";

import { useOptimistic, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, SearchX, SlidersHorizontal, X } from "lucide-react";
import { activeFilterCount, createCatalogQuery, serializeCatalogQuery, SORT_OPTIONS } from "@/lib/storefront/query";
import { formatMoney } from "@/lib/storefront/format";
import type { CatalogFacets, CatalogQuery, Paginated, Product, ProductSort, StoreImage as StoreImageData } from "@/lib/storefront/types";
import { cn } from "@/lib/utils";
import { Reveal } from "../motion";
import { SfDrawer } from "../overlay";
import { ProductGrid } from "../ProductCard";
import { Breadcrumbs, EmptyState, Stars, StoreImage, StoreLink } from "../primitives";
import { useStoreHref, useStorefront } from "../store-context";

type Fixed = "category" | "brands" | "collection";

export type CatalogViewProps = {
  title: string;
  description?: string;
  image?: StoreImageData;
  breadcrumbs: { label: string; href?: string }[];
  /** Store-relative path this listing lives at ("/products", "/categories/shoes"). */
  path: string;
  query: CatalogQuery;
  results: Paginated<Product>;
  facets: CatalogFacets;
  /** Filters implied by the page itself (a category page fixes the category). */
  fixed?: Fixed[];
};

/** URL-driven filters that respond instantly: the query updates optimistically while results load. */
function useCatalogNavigation(path: string, fixed: Fixed[], serverQuery: CatalogQuery) {
  const router = useRouter();
  const href = useStoreHref();
  const [pending, startTransition] = useTransition();
  const [query, setOptimisticQuery] = useOptimistic(serverQuery);
  const urlFor = (next: CatalogQuery) => {
    const params = serializeCatalogQuery(next, fixed);
    return href(`${path}${params.size ? `?${params}` : ""}`);
  };
  const go = (next: CatalogQuery) =>
    startTransition(() => {
      setOptimisticQuery(next);
      router.push(urlFor(next), { scroll: false });
    });
  return { query, go, urlFor, pending };
}

function FilterGroup({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-(--sf-line) py-5 first:pt-0">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="sf-focus flex w-full items-center justify-between text-left text-sm font-medium">
        {title}
        <ChevronDown className={cn("size-4 text-(--sf-muted) transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && <div className="mt-4 space-y-2.5">{children}</div>}
    </div>
  );
}

function Check({ checked, onChange, label, count, type = "checkbox" }: { checked: boolean; onChange: () => void; label: ReactNode; count?: number; type?: "checkbox" | "radio" }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <input type={type} checked={checked} onChange={onChange} className="size-4 accent-(--sf-primary)" />
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-xs text-(--sf-muted) tabular-nums">{count}</span>}
    </label>
  );
}

function PriceFilter({ query, facets, onApply }: { query: CatalogQuery; facets: CatalogFacets; onApply: (min: number | null, max: number | null) => void }) {
  const [min, setMin] = useState(query.minPrice?.toString() ?? "");
  const [max, setMax] = useState(query.maxPrice?.toString() ?? "");
  const [synced, setSynced] = useState(`${query.minPrice}-${query.maxPrice}`);
  if (synced !== `${query.minPrice}-${query.maxPrice}`) {
    setSynced(`${query.minPrice}-${query.maxPrice}`);
    setMin(query.minPrice?.toString() ?? "");
    setMax(query.maxPrice?.toString() ?? "");
  }
  const parse = (value: string) => (value.trim() === "" || !Number.isFinite(Number(value)) ? null : Number(value));
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onApply(parse(min), parse(max));
      }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <input value={min} onChange={(e) => setMin(e.target.value)} inputMode="decimal" placeholder={`${facets.price.min}`} aria-label="Minimum price" className="sf-input min-h-10! px-3! text-sm!" />
        <span className="text-(--sf-muted)">–</span>
        <input value={max} onChange={(e) => setMax(e.target.value)} inputMode="decimal" placeholder={`${facets.price.max}`} aria-label="Maximum price" className="sf-input min-h-10! px-3! text-sm!" />
      </div>
      <button type="submit" className="sf-btn sf-btn-secondary sf-btn-sm sf-btn-block">
        Apply price
      </button>
    </form>
  );
}

function Filters({ query, facets, fixed, go }: { query: CatalogQuery; facets: CatalogFacets; fixed: Fixed[]; go: (query: CatalogQuery) => void }) {
  const set = (patch: Partial<CatalogQuery>) => go({ ...query, ...patch, page: 1 });
  return (
    <div>
      {!fixed.includes("category") && facets.categories.length > 0 && (
        <FilterGroup title="Category">
          <Check type="radio" checked={!query.category} onChange={() => set({ category: null })} label="All" />
          {facets.categories.map((c) => (
            <Check key={c.slug} type="radio" checked={query.category === c.slug} onChange={() => set({ category: c.slug })} label={c.name} count={c.count} />
          ))}
        </FilterGroup>
      )}
      {!fixed.includes("brands") && facets.brands.length > 0 && (
        <FilterGroup title="Brand">
          {facets.brands.map((b) => (
            <Check
              key={b.slug}
              checked={query.brands.includes(b.slug)}
              onChange={() => set({ brands: query.brands.includes(b.slug) ? query.brands.filter((x) => x !== b.slug) : [...query.brands, b.slug] })}
              label={b.name}
              count={b.count}
            />
          ))}
        </FilterGroup>
      )}
      <FilterGroup title="Price">
        <PriceFilter query={query} facets={facets} onApply={(minPrice, maxPrice) => set({ minPrice, maxPrice })} />
      </FilterGroup>
      <FilterGroup title="Rating">
        {[4, 3].map((rating) => (
          <Check
            key={rating}
            type="radio"
            checked={query.rating === rating}
            onChange={() => set({ rating: query.rating === rating ? null : rating })}
            label={
              <span className="flex items-center gap-2">
                <Stars rating={rating} size={13} /> & up
              </span>
            }
          />
        ))}
      </FilterGroup>
      <FilterGroup title="Availability">
        <Check checked={query.inStock} onChange={() => set({ inStock: !query.inStock })} label="In stock only" />
        <Check checked={query.onSale} onChange={() => set({ onSale: !query.onSale })} label="On sale" />
      </FilterGroup>
    </div>
  );
}

function ActiveChips({ query, facets, fixed, go }: { query: CatalogQuery; facets: CatalogFacets; fixed: Fixed[]; go: (query: CatalogQuery) => void }) {
  const { store } = useStorefront();
  const currency = store.profile.currency;
  const set = (patch: Partial<CatalogQuery>) => go({ ...query, ...patch, page: 1 });
  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (query.q) chips.push({ key: "q", label: `“${query.q}”`, clear: () => set({ q: "" }) });
  if (query.category && !fixed.includes("category")) chips.push({ key: "cat", label: facets.categories.find((c) => c.slug === query.category)?.name ?? query.category, clear: () => set({ category: null }) });
  if (!fixed.includes("brands")) {
    for (const slug of query.brands) chips.push({ key: `b-${slug}`, label: facets.brands.find((b) => b.slug === slug)?.name ?? slug, clear: () => set({ brands: query.brands.filter((x) => x !== slug) }) });
  }
  if (query.minPrice !== null || query.maxPrice !== null) {
    const label = query.minPrice !== null && query.maxPrice !== null
      ? `${formatMoney(query.minPrice, currency)} – ${formatMoney(query.maxPrice, currency)}`
      : query.minPrice !== null ? `From ${formatMoney(query.minPrice, currency)}` : `Up to ${formatMoney(query.maxPrice!, currency)}`;
    chips.push({ key: "price", label, clear: () => set({ minPrice: null, maxPrice: null }) });
  }
  if (query.rating !== null) chips.push({ key: "rating", label: `${query.rating}★ & up`, clear: () => set({ rating: null }) });
  if (query.inStock) chips.push({ key: "stock", label: "In stock", clear: () => set({ inStock: false }) });
  if (query.onSale) chips.push({ key: "sale", label: "On sale", clear: () => set({ onSale: false }) });
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button key={chip.key} type="button" onClick={chip.clear} className="sf-focus inline-flex items-center gap-1.5 rounded-(--sf-btn-radius) bg-(--sf-surface) px-3 py-1.5 text-xs font-medium transition-colors hover:bg-(--sf-soft)">
          {chip.label}
          <X className="size-3" aria-label="Remove" />
        </button>
      ))}
      <button
        type="button"
        onClick={() => go(createCatalogQuery({ sort: query.sort, category: fixed.includes("category") ? query.category : null, brands: fixed.includes("brands") ? query.brands : [], collection: query.collection }))}
        className="text-xs text-(--sf-muted) underline-offset-4 hover:text-(--sf-text) hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}

function PageLinks({ results, query, urlFor }: { results: Paginated<Product>; query: CatalogQuery; urlFor: (query: CatalogQuery) => string }) {
  if (results.pageCount <= 1) return null;
  const pages = Array.from({ length: results.pageCount }, (_, i) => i + 1).filter((p) => p === 1 || p === results.pageCount || Math.abs(p - results.page) <= 1);
  const link = "sf-focus flex h-10 min-w-10 items-center justify-center rounded-(--sf-btn-radius) px-3 text-sm transition-colors";
  return (
    <nav aria-label="Pages" className="mt-14 flex items-center justify-center gap-1">
      {results.page > 1 && (
        <Link href={urlFor({ ...query, page: results.page - 1 })} className={cn(link, "hover:bg-(--sf-soft)")}>
          Previous
        </Link>
      )}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-(--sf-muted)">…</span>}
          <Link href={urlFor({ ...query, page: p })} aria-current={p === results.page ? "page" : undefined} className={cn(link, p === results.page ? "bg-(--sf-text) text-(--sf-bg)" : "hover:bg-(--sf-soft)")}>
            {p}
          </Link>
        </span>
      ))}
      {results.page < results.pageCount && (
        <Link href={urlFor({ ...query, page: results.page + 1 })} className={cn(link, "hover:bg-(--sf-soft)")}>
          Next
        </Link>
      )}
    </nav>
  );
}

export function CatalogView({ title, description, image, breadcrumbs, path, query: serverQuery, results, facets, fixed = [] }: CatalogViewProps) {
  const { query, go, urlFor, pending } = useCatalogNavigation(path, fixed, serverQuery);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const count = activeFilterCount(query, fixed);
  const sortSelect = (
    <label className="relative flex items-center gap-2 text-sm">
      <span className="hidden text-(--sf-muted) @3xl:inline">Sort by</span>
      <select
        value={query.sort}
        onChange={(e) => go({ ...query, sort: e.target.value as ProductSort, page: 1 })}
        className="sf-focus h-10 cursor-pointer appearance-none rounded-(--sf-input-radius) border border-(--sf-line) bg-(--sf-bg) pr-9 pl-3.5 text-sm"
        aria-label="Sort products"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-4 text-(--sf-muted)" />
    </label>
  );

  return (
    <div>
      {image ? (
        <div className="relative isolate flex min-h-56 items-end overflow-hidden @5xl:min-h-80">
          <StoreImage src={image.url} alt={image.alt} priority className="absolute inset-0 -z-10" />
          <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/60 via-black/20 to-black/10" />
          <Reveal className="sf-container py-10 text-white">
            <div className="[&_a]:text-white/80 [&_nav]:text-white/80 [&_span]:text-white">
              <Breadcrumbs items={breadcrumbs} />
            </div>
            <h1 className="sf-heading sf-h1 mt-3">{title}</h1>
            {description && <p className="mt-2 max-w-xl text-white/85">{description}</p>}
          </Reveal>
        </div>
      ) : (
        <div className="sf-container pt-8 @5xl:pt-12">
          <Breadcrumbs items={breadcrumbs} />
          <h1 className="sf-heading sf-title sf-h1 mt-4">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-(--sf-muted)">{description}</p>}
        </div>
      )}

      <div className="sf-container grid gap-10 py-8 @5xl:grid-cols-[15rem_1fr] @5xl:py-12">
        <aside className="hidden @5xl:block" aria-label="Filters">
          <div className="sticky top-[calc(var(--sf-sticky-top,0px)+6rem)]">
            <Filters query={query} facets={facets} fixed={fixed} go={go} />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setFiltersOpen(true)} className="sf-btn sf-btn-secondary sf-btn-sm @5xl:hidden">
                <SlidersHorizontal className="size-4" /> Filters {count > 0 && <span className="tabular-nums">({count})</span>}
              </button>
              <p className="text-sm text-(--sf-muted)" aria-live="polite">
                {results.total} {results.total === 1 ? "product" : "products"}
              </p>
            </div>
            {sortSelect}
          </div>
          <div className="mb-6">
            <ActiveChips query={query} facets={facets} fixed={fixed} go={go} />
          </div>

          <div className={cn("transition-opacity duration-200", pending && "pointer-events-none opacity-50")}>
            {results.items.length > 0 ? (
              <ProductGrid products={results.items} columns={3} priorityCount={3} />
            ) : (
              <EmptyState
                icon={<SearchX />}
                title="No products match"
                text={query.q ? `We couldn't find anything for “${query.q}”. Try a different search or fewer filters.` : "Try removing a filter or two to see more."}
                action={
                  <StoreLink href="/products" className="sf-btn sf-btn-primary">
                    Browse all products
                  </StoreLink>
                }
              />
            )}
            <PageLinks results={results} query={query} urlFor={urlFor} />
          </div>
        </div>
      </div>

      <SfDrawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        side="left"
        title="Filters"
        description="Filter products"
        footer={
          <button type="button" onClick={() => setFiltersOpen(false)} className="sf-btn sf-btn-primary sf-btn-block">
            Show {results.total} {results.total === 1 ? "product" : "products"}
          </button>
        }
      >
        <div className="p-5">
          <Filters query={query} facets={facets} fixed={fixed} go={go} />
        </div>
      </SfDrawer>
    </div>
  );
}
