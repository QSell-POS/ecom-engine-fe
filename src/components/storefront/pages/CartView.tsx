"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Heart, Lock, RotateCcw, ShoppingBag, Trash2, Truck } from "lucide-react";
import { estimatedShipping } from "@/lib/storefront/checkout";
import { formatMoney } from "@/lib/storefront/format";
import { EASE } from "../motion";
import { Breadcrumbs, EmptyState, Price, QuantityStepper, StoreImage, StoreLink } from "../primitives";
import { useStorefront } from "../store-context";

export function CartSkeleton() {
  return (
    <div className="sf-container grid gap-10 py-12 @4xl:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-5">
            <div className="aspect-4/5 w-24 animate-pulse rounded-(--sf-radius) bg-(--sf-soft)" />
            <div className="flex-1 space-y-3 pt-2">
              <div className="h-4 w-1/2 animate-pulse rounded bg-(--sf-soft)" />
              <div className="h-3 w-1/4 animate-pulse rounded bg-(--sf-soft)" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-(--sf-radius) bg-(--sf-soft)" />
    </div>
  );
}

export function CartView() {
  const { store, cart, updateLine, removeLine, toggleWishlist, isWishlisted } = useStorefront();
  const currency = store.profile.currency;
  if (!cart) return <CartSkeleton />;

  if (cart.lines.length === 0) {
    return (
      <div className="sf-container py-10">
        <EmptyState
          icon={<ShoppingBag />}
          title="Your bag is empty"
          text="Looks like you haven't added anything yet. Explore the collection and find something you love."
          action={
            <StoreLink href="/products" className="sf-btn sf-btn-primary">
              Start shopping
            </StoreLink>
          }
        />
      </div>
    );
  }

  const shipping = estimatedShipping(cart.subtotal, store.profile.checkout);
  const total = cart.subtotal + shipping;
  const remaining = Math.max(0, store.profile.checkout.freeShippingThreshold - cart.subtotal);

  return (
    <div className="sf-container py-8 @5xl:py-12">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Bag" }]} />
      <h1 className="sf-heading sf-h1 mt-4 mb-10">
        Your bag <span className="text-(--sf-muted)">({cart.itemCount})</span>
      </h1>
      <div className="grid items-start gap-10 @4xl:grid-cols-[1fr_22rem] @5xl:gap-16">
        <ul className="divide-y divide-(--sf-line) border-y border-(--sf-line)">
          <AnimatePresence initial={false}>
            {cart.lines.map((line) => (
              <motion.li key={line.id} layout exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: EASE }} className="flex gap-4 py-6 @3xl:gap-6">
                <StoreLink href={`/products/${line.slug}`} className="shrink-0">
                  <StoreImage src={line.image.url} alt={line.image.alt} sizes="140px" className="aspect-(--sf-card-ratio) w-24 rounded-(--sf-radius) @3xl:w-32" />
                </StoreLink>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <StoreLink href={`/products/${line.slug}`} className="font-medium hover:opacity-70">{line.name}</StoreLink>
                      <Price price={line.price} compareAtPrice={line.compareAtPrice} size="sm" className="text-(--sf-muted)" />
                    </div>
                    <p className="font-medium tabular-nums">{formatMoney(line.price * line.quantity, currency)}</p>
                  </div>
                  <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-4">
                    <QuantityStepper size="sm" value={line.quantity} max={line.maxQuantity} onChange={(q) => updateLine(line.id, q)} />
                    {!isWishlisted(line.productId) && (
                      <button type="button" onClick={() => toggleWishlist({ id: line.productId, name: line.name })} className="sf-focus flex items-center gap-1.5 text-sm text-(--sf-muted) hover:text-(--sf-text)">
                        <Heart className="size-4" /> Save for later
                      </button>
                    )}
                    <button type="button" onClick={() => removeLine(line.id)} className="sf-focus flex items-center gap-1.5 text-sm text-(--sf-muted) hover:text-(--sf-text)">
                      <Trash2 className="size-4" /> Remove
                    </button>
                  </div>
                  {line.quantity >= line.maxQuantity && <p className="mt-2 text-xs text-(--sf-sale)">Only {line.maxQuantity} available.</p>}
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <aside className="space-y-5 rounded-(--sf-radius) bg-(--sf-surface) p-6 @4xl:sticky @4xl:top-[calc(var(--sf-sticky-top,0px)+6rem)]">
          <h2 className="text-lg font-medium">Order summary</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{formatMoney(cart.subtotal, currency)}</dd></div>
            <div className="flex justify-between"><dt>Shipping</dt><dd className="tabular-nums">{shipping === 0 ? "Free" : formatMoney(shipping, currency)}</dd></div>
            <div className="flex justify-between border-t border-(--sf-line) pt-3 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatMoney(total, currency)}</dd></div>
          </dl>
          {remaining > 0 && (
            <p className="rounded-(--sf-radius) bg-(--sf-bg) px-3 py-2.5 text-[0.8125rem]">
              Add <span className="font-semibold">{formatMoney(remaining, currency)}</span> more for free shipping.
            </p>
          )}
          <StoreLink href="/checkout" className="sf-btn sf-btn-primary sf-btn-block">
            Checkout <ArrowRight className="size-4" />
          </StoreLink>
          <StoreLink href="/products" className="block text-center text-sm underline-offset-4 hover:underline">
            Continue shopping
          </StoreLink>
          <ul className="space-y-2 border-t border-(--sf-line) pt-4 text-[0.8125rem] text-(--sf-muted)">
            <li className="flex items-center gap-2"><Lock className="size-4" /> Secure, encrypted checkout</li>
            <li className="flex items-center gap-2"><Truck className="size-4" /> Ships in 1–2 business days</li>
            <li className="flex items-center gap-2"><RotateCcw className="size-4" /> Free 30-day returns</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

export function WishlistView() {
  const { wishlist, toggleWishlist, customer } = useStorefront();

  return (
    <div className="sf-container py-8 @5xl:py-12">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Wishlist" }]} />
      <h1 className="sf-heading sf-h1 mt-4 mb-2">Wishlist</h1>
      <p className="mb-10 text-(--sf-muted)">
        {wishlist.length ? `${wishlist.length} saved ${wishlist.length === 1 ? "item" : "items"}` : "Save favourites for later by tapping the heart on any product."}
        {!customer && wishlist.length > 0 && (
          <>
            {" "}
            <StoreLink href="/account/login?next=/wishlist" className="sf-link">Sign in</StoreLink> to keep them on every device.
          </>
        )}
      </p>
      {wishlist.length === 0 ? (
        <EmptyState
          icon={<Heart />}
          title="Nothing saved yet"
          text="Tap the heart on anything you like and it will wait for you here."
          action={
            <StoreLink href="/products" className="sf-btn sf-btn-primary">
              Discover products
            </StoreLink>
          }
        />
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 @3xl:grid-cols-3 @3xl:gap-x-6 @5xl:grid-cols-4">
          <AnimatePresence initial={false}>
            {wishlist.map((item) => (
              <motion.li key={item.productId} layout exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3, ease: EASE }} className="group/card relative">
                <StoreLink href={`/products/${item.slug}`} className="block overflow-hidden rounded-(--sf-radius)">
                  <StoreImage src={item.image.url} alt={item.image.alt} sizes="(min-width: 1024px) 25vw, 50vw" className="aspect-(--sf-card-ratio)" imgClassName="group-hover/card:scale-[1.03]" />
                </StoreLink>
                <button
                  type="button"
                  onClick={() => toggleWishlist({ id: item.productId, name: item.name })}
                  aria-label={`Remove ${item.name} from wishlist`}
                  className="sf-focus absolute top-2.5 right-2.5 flex size-9 items-center justify-center rounded-full bg-(--sf-bg)/90 shadow-sm backdrop-blur"
                >
                  <Heart className="size-4 fill-(--sf-sale) text-(--sf-sale)" />
                </button>
                <div className="mt-3.5 space-y-1">
                  <StoreLink href={`/products/${item.slug}`} className="block text-[0.9375rem] hover:opacity-70">{item.name}</StoreLink>
                  <Price price={item.price} compareAtPrice={item.compareAtPrice} />
                  <StoreLink href={`/products/${item.slug}`} className="sf-btn sf-btn-secondary sf-btn-sm sf-btn-block mt-3">
                    View product
                  </StoreLink>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
