"use client";

/* eslint-disable @next/next/no-img-element -- storefront images come from any CDN/upload; responsive srcsets are built below. */
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, ImageIcon, Minus, Plus, Star } from "lucide-react";
import { discountPercent, formatMoney } from "@/lib/storefront/format";
import type { ProductBadge } from "@/lib/storefront/types";
import { cn } from "@/lib/utils";
import { useStoreHref, useStorefront } from "./store-context";

// ------------------------------------------------------------------ links

/** A link inside the store; "/products" resolves to "/store/<slug>/products". */
export function StoreLink({ href, ...props }: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  const resolve = useStoreHref();
  const target = resolve(href);
  if (/^(https?:|mailto:|tel:)/.test(target)) return <a href={target} target={target.startsWith("http") ? "_blank" : undefined} rel="noreferrer" {...props} />;
  return <Link href={target} {...props} />;
}

// ------------------------------------------------------------------ images

const UNSPLASH = /^https:\/\/images\.unsplash\.com\//;

function srcSet(url: string) {
  if (!UNSPLASH.test(url)) return undefined;
  return [400, 700, 1000, 1400, 2000]
    .map((width) => {
      const next = new URL(url);
      const ratio = Number(next.searchParams.get("h")) / Number(next.searchParams.get("w"));
      next.searchParams.set("w", String(width));
      if (ratio) next.searchParams.set("h", String(Math.round(width * ratio)));
      return `${next} ${width}w`;
    })
    .join(", ");
}

/**
 * Every storefront image. Responsive, lazy, fades in when loaded, and never
 * leaves a blank hole: a missing or broken image becomes a soft placeholder.
 */
export function StoreImage({
  src,
  alt,
  sizes = "100vw",
  priority = false,
  className,
  imgClassName,
}: {
  src: string | undefined;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
}) {
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  const imgRef = useRef<HTMLImageElement>(null);
  const [shownSrc, setShownSrc] = useState(src);
  if (shownSrc !== src) {
    setShownSrc(src);
    setState("loading");
  }
  const failed = !src || state === "error";

  // Images can finish loading before hydration attaches React's handlers, so
  // check the element itself and listen natively: never stuck invisible.
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const settle = () => setState(img.naturalWidth > 0 ? "loaded" : "error");
    const fail = () => setState("error");
    if (img.complete) {
      const frame = requestAnimationFrame(settle);
      return () => cancelAnimationFrame(frame);
    }
    img.addEventListener("load", settle);
    img.addEventListener("error", fail);
    return () => {
      img.removeEventListener("load", settle);
      img.removeEventListener("error", fail);
    };
  }, [src]);
  return (
    <div className={cn("relative overflow-hidden bg-(--sf-soft)", className)}>
      {failed ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,var(--sf-surface),var(--sf-soft))] text-(--sf-muted)">
          <ImageIcon className="size-7 opacity-50" aria-hidden />
        </div>
      ) : (
        <img
          src={src}
          srcSet={srcSet(src)}
          sizes={sizes}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
          ref={imgRef}
          className={cn(
            "absolute inset-0 size-full object-cover transition-[opacity,transform] duration-700 ease-out",
            state === "loaded" ? "opacity-100" : "opacity-0",
            imgClassName,
          )}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------------ commerce

export function Price({ price, compareAtPrice, className, size = "md" }: { price: number; compareAtPrice?: number | null; className?: string; size?: "sm" | "md" | "lg" }) {
  const { store } = useStorefront();
  const currency = store.profile.currency;
  const onSale = compareAtPrice !== null && compareAtPrice !== undefined && compareAtPrice > price;
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2 tabular-nums", size === "lg" ? "text-xl" : size === "sm" ? "text-sm" : "text-[0.9375rem]", className)}>
      <span className={cn("font-medium", onSale && "text-(--sf-sale)")}>{formatMoney(price, currency)}</span>
      {onSale && <s className="text-[0.85em] text-(--sf-muted)">{formatMoney(compareAtPrice!, currency)}</s>}
    </span>
  );
}

export function Stars({ rating, size = 14, className }: { rating: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${rating.toFixed(1)} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - (i - 1)));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star className="absolute inset-0 text-current opacity-25" style={{ width: size, height: size }} strokeWidth={0} fill="currentColor" />
            <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star style={{ width: size, height: size }} strokeWidth={0} fill="currentColor" />
            </span>
          </span>
        );
      })}
    </span>
  );
}

const BADGE_LABELS: Record<ProductBadge, string> = { new: "New", sale: "Sale", bestseller: "Bestseller", "sold-out": "Sold out" };

export function ProductBadges({ badges, price, compareAtPrice }: { badges: ProductBadge[]; price: number; compareAtPrice: number | null }) {
  if (badges.length === 0) return null;
  const off = discountPercent(price, compareAtPrice);
  return (
    <div className="pointer-events-none absolute top-3 left-3 z-10 flex flex-col items-start gap-1.5">
      {badges.slice(0, 2).map((badge) => (
        <span
          key={badge}
          className={cn(
            "rounded-(--sf-btn-radius) px-2 py-1 text-[0.6875rem] leading-none font-semibold tracking-wide uppercase",
            badge === "sale" ? "bg-(--sf-sale) text-white" : badge === "sold-out" ? "bg-(--sf-text) text-(--sf-bg)" : "bg-(--sf-bg) text-(--sf-text) shadow-sm",
          )}
        >
          {badge === "sale" && off ? `−${off}%` : BADGE_LABELS[badge]}
        </span>
      ))}
    </div>
  );
}

export function QuantityStepper({ value, max, onChange, disabled, size = "md" }: { value: number; max: number; onChange: (value: number) => void; disabled?: boolean; size?: "sm" | "md" }) {
  const height = size === "sm" ? "h-9" : "h-11";
  return (
    <div className={cn("inline-flex items-center rounded-(--sf-input-radius) border border-(--sf-line)", height)}>
      <button type="button" aria-label="Decrease quantity" disabled={disabled || value <= 1} onClick={() => onChange(value - 1)} className="sf-focus flex h-full w-9 items-center justify-center text-(--sf-muted) transition-colors hover:text-(--sf-text) disabled:opacity-30">
        <Minus className="size-3.5" />
      </button>
      <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">{value}</span>
      <button type="button" aria-label="Increase quantity" disabled={disabled || value >= max} onClick={() => onChange(value + 1)} className="sf-focus flex h-full w-9 items-center justify-center text-(--sf-muted) transition-colors hover:text-(--sf-text) disabled:opacity-30">
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

// ------------------------------------------------------------------ layout

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[0.8125rem] text-(--sf-muted)">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3.5 opacity-60" aria-hidden />}
            {item.href ? (
              <StoreLink href={item.href} className="transition-colors hover:text-(--sf-text)">
                {item.label}
              </StoreLink>
            ) : (
              <span aria-current="page" className="text-(--sf-text)">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-(--sf-surface) text-(--sf-muted) [&_svg]:size-6">{icon}</div>
      <h2 className="sf-heading sf-h3">{title}</h2>
      <p className="mt-2 text-[0.9375rem] text-(--sf-muted)">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, text, action, align = "left" }: { eyebrow?: string; title: string; text?: string; action?: ReactNode; align?: "left" | "center" }) {
  if (!title && !eyebrow && !text) return null;
  return (
    <div className={cn("mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 @3xl:mb-10", align === "center" && "flex-col items-center text-center")}>
      <div className={cn("max-w-2xl space-y-2", align === "center" && "mx-auto")}>
        {eyebrow && <p className="sf-eyebrow text-(--sf-muted)">{eyebrow}</p>}
        {title && <h2 className="sf-heading sf-title sf-h2">{title}</h2>}
        {text && <p className="text-[0.9375rem] text-(--sf-muted)">{text}</p>}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span aria-hidden className={cn("inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent", className)} />;
}
