"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, ChevronDown, Heart, PackageCheck, RotateCcw, ShieldCheck, ShoppingBag, Star, Truck } from "lucide-react";
import { toast } from "sonner";
import { discountPercent, formatDate, formatMoney } from "@/lib/storefront/format";
import { localReviews } from "@/lib/storefront/mock/customer-api";
import type { Product, Review, ReviewSummary } from "@/lib/storefront/types";
import { cn } from "@/lib/utils";
import { EASE, Reveal, useMotionEnabled } from "../motion";
import { ProductGrid } from "../ProductCard";
import { Breadcrumbs, Price, QuantityStepper, SectionHeading, Spinner, Stars, StoreImage, StoreLink } from "../primitives";
import { useStorefront } from "../store-context";

// ------------------------------------------------------------------ gallery

function Gallery({ product }: { product: Product }) {
  const [index, setIndex] = useState(0);
  const animate = useMotionEnabled();
  const track = useRef<HTMLDivElement>(null);
  const images = product.images;

  return (
    <div className="@4xl:sticky @4xl:top-[calc(var(--sf-sticky-top,0px)+6rem)]">
      {/* Mobile & tablet: swipeable strip with dots */}
      <div className="@4xl:hidden">
        <div
          ref={track}
          onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          className="sf-no-scrollbar -mx-[clamp(1rem,4cqi,2.5rem)] flex snap-x snap-mandatory overflow-x-auto"
        >
          {images.map((image, i) => (
            <div key={image.url} className="w-full shrink-0 snap-center">
              <StoreImage src={image.url} alt={image.alt} priority={i === 0} sizes="100vw" className="aspect-4/5" />
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-center gap-1.5">
          {images.map((image, i) => (
            <button
              key={image.url}
              type="button"
              aria-label={`Show image ${i + 1}`}
              onClick={() => track.current?.scrollTo({ left: i * track.current.clientWidth, behavior: "smooth" })}
              className={cn("h-1.5 rounded-full transition-all duration-300", i === index ? "w-6 bg-(--sf-text)" : "w-1.5 bg-(--sf-line)")}
            />
          ))}
        </div>
      </div>

      {/* Desktop: main image with thumbnails */}
      <div className="hidden gap-4 @4xl:grid @4xl:grid-cols-[4.5rem_1fr]">
        <div className="flex flex-col gap-3">
          {images.map((image, i) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === index}
              className={cn("sf-focus overflow-hidden rounded-(--sf-radius) ring-offset-2 ring-offset-(--sf-bg) transition-all", i === index ? "ring-1 ring-(--sf-text)" : "opacity-60 hover:opacity-100")}
            >
              <StoreImage src={image.url} alt="" sizes="80px" className="aspect-4/5" />
            </button>
          ))}
        </div>
        <div className="relative aspect-4/5 overflow-hidden rounded-(--sf-radius) bg-(--sf-soft)">
          <AnimatePresence initial={false}>
            <motion.div
              key={images[index]?.url}
              className="absolute inset-0"
              initial={animate ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              <StoreImage src={images[index]?.url} alt={images[index]?.alt ?? product.name} priority sizes="(min-width: 1024px) 50vw, 100vw" className="absolute inset-0" />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ buy box

function Accordion({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-(--sf-line)">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="sf-focus flex w-full items-center justify-between py-4 text-left text-[0.9375rem] font-medium">
        {title}
        <ChevronDown className={cn("size-4 transition-transform duration-300", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden">
            <div className="pb-5 text-sm leading-relaxed text-(--sf-muted)">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BuyBox({ product, onAddedVisibility }: { product: Product; onAddedVisibility: (visible: boolean) => void }) {
  const { store, addToCart, isWishlisted, toggleWishlist } = useStorefront();
  const initial = product.variants.find((v) => v.inventory > 0) ?? product.variants[0];
  const [selected, setSelected] = useState<Record<string, string>>(initial.options);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const saved = isWishlisted(product.id);
  const { freeShippingThreshold } = store.profile.checkout;

  const variant = product.variants.find((v) => product.options.every((o) => v.options[o.name] === selected[o.name]));
  const stock = variant?.inventory ?? 0;
  const off = discountPercent(variant?.price ?? product.price, variant?.compareAtPrice ?? null);

  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => onAddedVisibility(entry.isIntersecting), { threshold: 0 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [onAddedVisibility]);

  const available = (name: string, value: string) =>
    product.variants.some((v) => v.inventory > 0 && v.options[name] === value && product.options.every((o) => o.name === name || v.options[o.name] === selected[o.name]));

  async function add() {
    if (!variant) return;
    setAdding(true);
    await addToCart(product, variant.id, quantity);
    setAdding(false);
  }

  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <StoreLink href={`/brands/${product.brand.slug}`} className="sf-eyebrow text-(--sf-muted) hover:text-(--sf-text)">
          {product.brand.name}
        </StoreLink>
        <h1 className="sf-heading sf-h2">{product.name}</h1>
        {product.rating.count > 0 && (
          <a href="#reviews" className="inline-flex items-center gap-2 text-sm">
            <Stars rating={product.rating.average} />
            <span className="text-(--sf-muted) underline-offset-4 hover:underline">
              {product.rating.average.toFixed(1)} · {product.rating.count} reviews
            </span>
          </a>
        )}
        <div className="flex items-center gap-3 pt-1">
          <Price price={variant?.price ?? product.price} compareAtPrice={variant?.compareAtPrice ?? product.compareAtPrice} size="lg" />
          {off && <span className="rounded-(--sf-btn-radius) bg-(--sf-sale) px-2 py-1 text-xs font-semibold text-white">Save {off}%</span>}
        </div>
        <p className="text-[0.9375rem] leading-relaxed text-(--sf-muted)">{product.description.split(". ")[0]}.</p>
      </div>

      {product.options.map((option) => {
        const isColor = option.values.some((v) => v.swatch);
        return (
          <fieldset key={option.name} className="space-y-3">
            <legend className="text-sm">
              <span className="font-medium">{option.name}:</span> <span className="text-(--sf-muted)">{selected[option.name]}</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {option.values.map(({ value, swatch }) => {
                const active = selected[option.name] === value;
                const inStock = available(option.name, value);
                return isColor ? (
                  <button
                    key={value}
                    type="button"
                    title={value}
                    aria-label={`${value}${inStock ? "" : " (sold out)"}`}
                    aria-pressed={active}
                    onClick={() => setSelected({ ...selected, [option.name]: value })}
                    className={cn("sf-focus relative size-9 rounded-full p-0.5 ring-1 transition-all", active ? "ring-(--sf-text)" : "ring-(--sf-line) hover:ring-(--sf-muted)", !inStock && "opacity-40")}
                  >
                    <span className="block size-full rounded-full border border-black/10" style={{ background: swatch ?? "#ccc" }} />
                    {!inStock && <span className="absolute inset-0 m-auto h-px w-7 rotate-45 bg-(--sf-text)" />}
                  </button>
                ) : (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelected({ ...selected, [option.name]: value })}
                    className={cn(
                      "sf-focus min-w-12 rounded-(--sf-input-radius) border px-3.5 py-2.5 text-sm transition-colors",
                      active ? "border-(--sf-text) bg-(--sf-text) text-(--sf-bg)" : "border-(--sf-line) hover:border-(--sf-text)",
                      !inStock && !active && "text-(--sf-muted) line-through decoration-(--sf-muted)",
                    )}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      <div className="space-y-3">
        <p className={cn("flex items-center gap-2 text-sm", stock > 0 && stock <= 5 && "text-(--sf-sale)")}>
          <span className={cn("size-2 rounded-full", stock === 0 ? "bg-(--sf-muted)" : stock <= 5 ? "bg-(--sf-sale)" : "bg-emerald-500")} />
          {stock === 0 ? "Sold out. Choose another option." : stock <= 5 ? `Only ${stock} left. Order soon.` : "In stock, ready to ship"}
        </p>
        <div className="flex gap-3">
          <QuantityStepper value={quantity} max={Math.max(1, stock)} onChange={setQuantity} disabled={stock === 0} />
          <button ref={buttonRef} type="button" onClick={add} disabled={!variant || stock === 0 || adding} className="sf-btn sf-btn-primary flex-1">
            {adding ? <Spinner /> : <ShoppingBag className="size-4" />}
            {stock === 0 ? "Sold out" : "Add to bag"}
          </button>
          <button
            type="button"
            onClick={() => toggleWishlist(product)}
            aria-pressed={saved}
            aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
            className="sf-focus flex size-11.5 shrink-0 items-center justify-center rounded-(--sf-btn-radius) border border-(--sf-line) transition-colors hover:border-(--sf-text)"
          >
            <Heart className={cn("size-5", saved && "fill-(--sf-sale) text-(--sf-sale)")} />
          </button>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-3 rounded-(--sf-radius) bg-(--sf-surface) p-4 text-[0.8125rem]">
        <li className="flex items-center gap-2.5"><Truck className="size-4 shrink-0" /> Free shipping over {formatMoney(freeShippingThreshold, store.profile.currency)}</li>
        <li className="flex items-center gap-2.5"><RotateCcw className="size-4 shrink-0" /> 30-day free returns</li>
        <li className="flex items-center gap-2.5"><ShieldCheck className="size-4 shrink-0" /> Secure checkout</li>
        <li className="flex items-center gap-2.5"><PackageCheck className="size-4 shrink-0" /> Ships in 1–2 days</li>
      </ul>

      <div className="border-t border-(--sf-line)">
        <Accordion title="Description" defaultOpen>
          <p>{product.description}</p>
        </Accordion>
        {product.highlights.length > 0 && (
          <Accordion title="Details">
            <ul className="list-disc space-y-1.5 pl-5">
              {product.highlights.map((h) => <li key={h}>{h}</li>)}
              {variant && <li>SKU: {variant.sku}</li>}
            </ul>
          </Accordion>
        )}
        <Accordion title="Shipping & returns">
          <p>
            Standard delivery in 3–5 business days, free on orders over {formatMoney(freeShippingThreshold, store.profile.currency)}. Express delivery in 1–2 business days. Not quite right? Return it within 30 days for a full refund.
          </p>
        </Accordion>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ reviews

function ReviewForm({ product, onSubmitted }: { product: Product; onSubmitted: (review: Review) => void }) {
  const { api, customer } = useStorefront();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      const review = await api.submitReview({
        productId: product.id,
        rating,
        title: String(form.get("title") ?? ""),
        body: String(form.get("body") ?? ""),
        author: String(form.get("author") ?? ""),
      });
      onSubmitted(review);
      toast.success("Thanks for your review!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't post your review.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-(--sf-radius) border border-(--sf-line) p-5 @3xl:p-6">
      <div>
        <span className="sf-label">Your rating</span>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((value) => (
            <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} stars`} onMouseEnter={() => setHover(value)} onClick={() => setRating(value)} className="sf-focus">
              <Star className={cn("size-6 transition-colors", (hover || rating) >= value ? "fill-current" : "opacity-25")} strokeWidth={0} fill="currentColor" />
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 @3xl:grid-cols-2">
        <div>
          <label htmlFor="review-author" className="sf-label">Name</label>
          <input id="review-author" name="author" required defaultValue={customer ? `${customer.firstName} ${customer.lastName.charAt(0)}.` : ""} className="sf-input" />
        </div>
        <div>
          <label htmlFor="review-title" className="sf-label">Title</label>
          <input id="review-title" name="title" required maxLength={120} placeholder="Sum it up" className="sf-input" />
        </div>
      </div>
      <div>
        <label htmlFor="review-body" className="sf-label">Review</label>
        <textarea id="review-body" name="body" required rows={4} maxLength={2000} placeholder="What did you like or dislike?" className="sf-input" />
      </div>
      <button type="submit" disabled={pending} className="sf-btn sf-btn-primary">
        {pending && <Spinner />} Post review
      </button>
    </form>
  );
}

function Reviews({ product, summary, initial }: { product: Product; summary: ReviewSummary; initial: Review[] }) {
  const { store } = useStorefront();
  const [added, setAdded] = useState<Review[]>([]);
  const [local, setLocal] = useState<Review[]>([]);
  const [shown, setShown] = useState(5);
  const [writing, setWriting] = useState(false);

  // Mock mode: reviews posted earlier in this browser.
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_STOREFRONT_API_URL) return;
    const stored = localReviews(store.storeKey, product.id);
    queueMicrotask(() => setLocal(stored));
  }, [store.storeKey, product.id]);

  const all = useMemo(() => {
    const ids = new Set<string>();
    return [...added, ...local, ...initial].filter((r) => (ids.has(r.id) ? false : (ids.add(r.id), true)));
  }, [added, local, initial]);
  const count = all.length;
  const average = count ? all.reduce((sum, r) => sum + r.rating, 0) / count : summary.average;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({ star, count: all.filter((r) => r.rating === star).length }));

  return (
    <section id="reviews" className="scroll-mt-28 border-t border-(--sf-line) py-14 @5xl:py-20">
      <div className="grid gap-12 @4xl:grid-cols-[18rem_1fr] @5xl:gap-20">
        <div className="space-y-5">
          <h2 className="sf-heading sf-h2">Reviews</h2>
          <div className="flex items-end gap-3">
            <span className="sf-heading text-5xl leading-none">{average.toFixed(1)}</span>
            <div className="pb-1">
              <Stars rating={average} size={16} />
              <p className="mt-1 text-sm text-(--sf-muted)">{count} reviews</p>
            </div>
          </div>
          <ul className="space-y-2">
            {distribution.map(({ star, count: n }) => (
              <li key={star} className="flex items-center gap-3 text-sm">
                <span className="w-3 tabular-nums">{star}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-(--sf-soft)">
                  <div className="h-full rounded-full bg-(--sf-text)" style={{ width: `${count ? (n / count) * 100 : 0}%` }} />
                </div>
                <span className="w-6 text-right text-(--sf-muted) tabular-nums">{n}</span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setWriting(!writing)} className="sf-btn sf-btn-secondary sf-btn-block">
            {writing ? "Cancel" : "Write a review"}
          </button>
        </div>

        <div className="space-y-8">
          <AnimatePresence>
            {writing && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: EASE }}>
                <ReviewForm
                  product={product}
                  onSubmitted={(review) => {
                    setAdded((list) => [review, ...list]);
                    setWriting(false);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
          {all.length === 0 ? (
            <p className="text-(--sf-muted)">No reviews yet. Be the first to share your thoughts.</p>
          ) : (
            <ul className="divide-y divide-(--sf-line)">
              {all.slice(0, shown).map((review) => (
                <li key={review.id} className="py-6 first:pt-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Stars rating={review.rating} />
                    <time className="text-xs text-(--sf-muted)" dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
                  </div>
                  <h3 className="mt-3 font-medium">{review.title}</h3>
                  <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-(--sf-muted)">{review.body}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-xs">
                    <span className="font-medium">{review.author}</span>
                    {review.verified && (
                      <span className="inline-flex items-center gap-1 text-(--sf-muted)">
                        <BadgeCheck className="size-3.5" /> Verified buyer
                      </span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {shown < all.length && (
            <button type="button" onClick={() => setShown(shown + 5)} className="sf-btn sf-btn-secondary">
              Show more reviews
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ page

export function ProductView({ product, related, reviewSummary, reviews }: { product: Product; related: Product[]; reviewSummary: ReviewSummary; reviews: Review[] }) {
  const { addToCart } = useStorefront();
  const [buyVisible, setBuyVisible] = useState(true);
  const firstInStock = product.variants.find((v) => v.inventory > 0);

  return (
    <div className="sf-container pt-6 @5xl:pt-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: product.category.name, href: `/categories/${product.category.slug}` }, { label: product.name }]} />
      <div className="mt-6 grid gap-10 @4xl:grid-cols-[1.15fr_1fr] @5xl:gap-16">
        <Gallery product={product} />
        <Reveal>
          <BuyBox product={product} onAddedVisibility={setBuyVisible} />
        </Reveal>
      </div>

      <Reviews product={product} summary={reviewSummary} initial={reviews} />

      {related.length > 0 && (
        <section className="border-t border-(--sf-line) py-14 @5xl:py-20">
          <Reveal>
            <SectionHeading title="You may also like" />
          </Reveal>
          <ProductGrid products={related} columns={4} />
        </section>
      )}

      {/* Mobile: keep the buy button reachable once the main one scrolls away. */}
      <AnimatePresence>
        {!buyVisible && product.available && firstInStock && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-(--sf-line) bg-(--sf-bg)/95 p-3 backdrop-blur @4xl:hidden"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{product.name}</p>
              <Price price={product.price} compareAtPrice={product.compareAtPrice} size="sm" />
            </div>
            <button type="button" onClick={() => addToCart(product, firstInStock.id)} className="sf-btn sf-btn-primary">
              <ShoppingBag className="size-4" /> Add
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
