"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  Trash2,
  UserRound,
} from "lucide-react";
import { formatMoney } from "@/lib/storefront/format";
import { cn } from "@/lib/utils";
import { EASE } from "./motion";
import { SfDrawer } from "./overlay";
import { Price, QuantityStepper, StoreImage, StoreLink } from "./primitives";
import { SocialIcons } from "./social-icons";
import { useStoreHref, useStorefront } from "./store-context";

// Store chrome shared by every page and every theme: announcement bar,
// header, cart drawer and footer. Content comes from the store profile;
// look and layout come from the theme's settings.

export function Logo({ className }: { className?: string }) {
  const { store } = useStorefront();
  const { logo, name } = store.profile;
  return (
    <StoreLink
      href="/"
      className={cn("sf-focus inline-flex items-center", className)}
      aria-label={`${name} home`}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- merchant logo from any source
        <img
          src={logo}
          alt={name}
          className="h-8 w-auto max-w-40 object-contain @3xl:h-9"
        />
      ) : (
        <span className="sf-heading text-[1.375rem] leading-none font-semibold tracking-tight whitespace-nowrap @3xl:text-2xl">
          {name}
        </span>
      )}
    </StoreLink>
  );
}

function AnnouncementBar() {
  const { store } = useStorefront();
  const { enabled, text, link } = store.profile.announcement;
  if (!enabled || !text) return null;
  const content = <span className="truncate">{text}</span>;
  return (
    <div className="sf-scheme-inverse">
      <div className="sf-container flex h-9 items-center justify-center text-center text-xs font-medium tracking-wide @3xl:text-[0.8125rem]">
        {link ? (
          <StoreLink
            href={link}
            className="inline-flex min-w-0 items-center gap-1.5 hover:opacity-80"
          >
            {content} <ArrowRight className="size-3.5 shrink-0" />
          </StoreLink>
        ) : (
          content
        )}
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  href,
  badge,
  children,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  badge?: number;
  children: ReactNode;
}) {
  const className =
    "sf-focus relative flex size-10 items-center justify-center rounded-full transition-colors hover:bg-(--sf-soft) [&_svg]:size-[1.2rem]";
  const count = badge ? (
    <AnimatePresence>
      <motion.span
        key={badge}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="absolute top-1 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-(--sf-primary) px-1 text-[0.625rem] font-semibold text-(--sf-primary-text) tabular-nums"
      >
        {badge}
      </motion.span>
    </AnimatePresence>
  ) : null;
  if (href) {
    return (
      <StoreLink href={href} aria-label={label} className={className}>
        {children}
        {count}
      </StoreLink>
    );
  }
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={className}
    >
      {children}
      {count}
    </button>
  );
}

function SearchOverlay({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { store } = useStorefront();
  const router = useRouter();
  const href = useStoreHref();
  const [term, setTerm] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const q = term.trim();
    onOpenChange(false);
    router.push(href(q ? `/products?q=${encodeURIComponent(q)}` : "/products"));
  }

  return (
    <SfDrawer
      open={open}
      onOpenChange={onOpenChange}
      side="top"
      title="Search"
      description="Search the store"
    >
      <div className="sf-container py-8">
        <form onSubmit={submit} role="search" className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-(--sf-muted)" />
          <input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={`Search ${store.profile.name}`}
            aria-label="Search products"
            className="sf-input h-14! pl-12! text-lg!"
            type="search"
          />
        </form>
        <div className="mt-6">
          <p className="sf-eyebrow mb-3 text-(--sf-muted)">Popular</p>
          <div className="flex flex-wrap gap-2">
            {store.profile.navigation.map((link) => (
              <StoreLink
                key={link.href}
                href={link.href}
                onClick={() => onOpenChange(false)}
                className="sf-focus rounded-(--sf-btn-radius) border border-(--sf-line) px-3.5 py-1.5 text-sm transition-colors hover:border-(--sf-text)"
              >
                {link.label}
              </StoreLink>
            ))}
          </div>
        </div>
      </div>
    </SfDrawer>
  );
}

function MobileMenu({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { store, customer } = useStorefront();
  const close = () => onOpenChange(false);
  return (
    <SfDrawer
      open={open}
      onOpenChange={onOpenChange}
      side="left"
      title={store.profile.name}
      description="Store menu"
    >
      <nav className="flex flex-col p-2">
        <StoreLink
          href="/products"
          onClick={close}
          className="rounded-(--sf-radius) px-3 py-3 text-lg font-medium hover:bg-(--sf-soft)"
        >
          Shop all
        </StoreLink>
        {store.profile.navigation.map((link) => (
          <StoreLink
            key={link.href}
            href={link.href}
            onClick={close}
            className="rounded-(--sf-radius) px-3 py-3 text-lg hover:bg-(--sf-soft)"
          >
            {link.label}
          </StoreLink>
        ))}
      </nav>
      <div className="mx-5 border-t border-(--sf-line) py-4 text-[0.9375rem]">
        <StoreLink
          href={customer ? "/account" : "/account/login"}
          onClick={close}
          className="flex items-center gap-3 py-2.5"
        >
          <UserRound className="size-5 text-(--sf-muted)" />{" "}
          {customer ? `Hi, ${customer.firstName}` : "Sign in"}
        </StoreLink>
        <StoreLink
          href="/wishlist"
          onClick={close}
          className="flex items-center gap-3 py-2.5"
        >
          <Heart className="size-5 text-(--sf-muted)" /> Wishlist
        </StoreLink>
      </div>
      <div className="px-3 pb-6">
        <SocialIcons social={store.profile.social} />
      </div>
    </SfDrawer>
  );
}

function FreeShippingMeter({ subtotal }: { subtotal: number }) {
  const { store } = useStorefront();
  const { freeShippingThreshold } = store.profile.checkout;
  if (!freeShippingThreshold) return null;
  const remaining = Math.max(0, freeShippingThreshold - subtotal);
  const progress = Math.min(1, subtotal / freeShippingThreshold);
  return (
    <div className="space-y-2">
      <p className="text-[0.8125rem]">
        {remaining > 0 ? (
          <>
            You&apos;re{" "}
            <span className="font-semibold">
              {formatMoney(remaining, store.profile.currency)}
            </span>{" "}
            away from free shipping
          </>
        ) : (
          <span className="font-medium">Your order ships free</span>
        )}
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-(--sf-soft)">
        <motion.div
          className="h-full rounded-full bg-(--sf-primary)"
          initial={false}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.6, ease: EASE }}
        />
      </div>
    </div>
  );
}

export function CartDrawer() {
  const { store, cart, cartOpen, setCartOpen, updateLine, removeLine } =
    useStorefront();
  const lines = cart?.lines ?? [];
  const close = () => setCartOpen(false);

  return (
    <SfDrawer
      open={cartOpen}
      onOpenChange={setCartOpen}
      title={`Your bag${cart?.itemCount ? ` (${cart.itemCount})` : ""}`}
      description="Items in your bag"
      footer={
        lines.length > 0 && cart ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[0.9375rem]">
              <span>Subtotal</span>
              <span className="font-semibold tabular-nums">
                {formatMoney(cart.subtotal, store.profile.currency)}
              </span>
            </div>
            <p className="text-xs text-(--sf-muted)">
              Shipping and taxes calculated at checkout.
            </p>
            <StoreLink
              href="/checkout"
              onClick={close}
              className="sf-btn sf-btn-primary sf-btn-block"
            >
              Checkout <ArrowRight className="size-4" />
            </StoreLink>
            <StoreLink
              href="/cart"
              onClick={close}
              className="sf-btn sf-btn-ghost sf-btn-block"
            >
              View bag
            </StoreLink>
          </div>
        ) : null
      }
    >
      {lines.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center px-8 py-16 text-center">
          <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-(--sf-surface) text-(--sf-muted)">
            <ShoppingBag className="size-6" />
          </div>
          <p className="text-lg font-medium">Your bag is empty</p>
          <p className="mt-1 text-sm text-(--sf-muted)">
            Find something you love and it will show up here.
          </p>
          <StoreLink
            href="/products"
            onClick={close}
            className="sf-btn sf-btn-primary mt-6"
          >
            Start shopping
          </StoreLink>
        </div>
      ) : (
        <div className="space-y-5 p-5">
          <FreeShippingMeter subtotal={cart?.subtotal ?? 0} />
          <ul className="divide-y divide-(--sf-line)">
            <AnimatePresence initial={false}>
              {lines.map((line) => (
                <motion.li
                  key={line.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="flex gap-4 py-4"
                >
                  <StoreLink
                    href={`/products/${line.slug}`}
                    onClick={close}
                    className="shrink-0"
                  >
                    <StoreImage
                      src={line.image.url}
                      alt={line.image.alt}
                      sizes="96px"
                      className="aspect-(--sf-card-ratio) w-20 rounded-(--sf-radius)"
                    />
                  </StoreLink>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <StoreLink
                          href={`/products/${line.slug}`}
                          onClick={close}
                          className="line-clamp-2 text-sm font-medium hover:opacity-70"
                        >
                          {line.name}
                        </StoreLink>
                      </div>
                      <Price
                        price={line.price * line.quantity}
                        compareAtPrice={
                          line.compareAtPrice
                            ? line.compareAtPrice * line.quantity
                            : null
                        }
                        size="sm"
                        className="flex-col items-end gap-0"
                      />
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <QuantityStepper
                        size="sm"
                        value={line.quantity}
                        max={line.maxQuantity}
                        onChange={(q) => updateLine(line.id, q)}
                      />
                      <button
                        type="button"
                        onClick={() => removeLine(line.id)}
                        className="sf-focus flex items-center gap-1 text-xs text-(--sf-muted) transition-colors hover:text-(--sf-text)"
                      >
                        <Trash2 className="size-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}
    </SfDrawer>
  );
}

export function Header() {
  const { store, cart, setCartOpen, wishlist, customer } = useStorefront();
  const { settings, profile } = store;
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const centered = settings.headerLayout === "center";
  const sticky = settings.headerSticky !== false;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nav = (
    <nav aria-label="Main" className="hidden @5xl:block">
      <ul className="flex items-center gap-7 text-[0.875rem]">
        {profile.navigation.map((link) => (
          <li key={link.href}>
            <StoreLink
              href={link.href}
              className="group/nav relative py-2 transition-opacity hover:opacity-100"
            >
              {link.label}
              <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-current transition-transform duration-300 ease-out group-hover/nav:scale-x-100" />
            </StoreLink>
          </li>
        ))}
      </ul>
    </nav>
  );

  const actions = (
    <div className="flex items-center justify-end gap-0.5">
      <IconButton label="Search" onClick={() => setSearchOpen(true)}>
        <Search />
      </IconButton>
      <span className="hidden @3xl:contents">
        <IconButton
          label={customer ? "Your account" : "Sign in"}
          href={customer ? "/account" : "/account/login"}
        >
          <UserRound />
        </IconButton>
        <IconButton label="Wishlist" href="/wishlist" badge={wishlist.length}>
          <Heart />
        </IconButton>
      </span>
      <IconButton
        label="Open bag"
        onClick={() => setCartOpen(true)}
        badge={cart?.itemCount}
      >
        <ShoppingBag />
      </IconButton>
    </div>
  );

  return (
    <>
      <header
        className={cn(
          "z-40 border-b transition-[background-color,border-color,box-shadow] duration-300",
          sticky && "sticky top-(--sf-sticky-top,0px)",
          scrolled
            ? "border-(--sf-line) bg-(--sf-bg)/92 shadow-[0_1px_12px_-6px_rgb(0_0_0/0.12)] backdrop-blur-md"
            : "border-transparent bg-(--sf-bg)",
        )}
      >
        <div
          className={cn(
            "sf-container grid h-16 items-center gap-4 @5xl:h-18",
            centered ? "grid-cols-[1fr_auto_1fr]" : "grid-cols-[auto_1fr_auto]",
          )}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
              className="sf-focus -ml-2 flex size-10 items-center justify-center rounded-full hover:bg-(--sf-soft) @5xl:hidden"
            >
              <Menu className="size-5" />
            </button>
            {centered ? nav : <Logo />}
          </div>
          {centered ? (
            <Logo className="justify-self-center" />
          ) : (
            <div className="flex justify-center">{nav}</div>
          )}
          {actions}
        </div>
      </header>
      <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} />
      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
      <CartDrawer />
    </>
  );
}

function FooterNewsletter() {
  const [done, setDone] = useState(false);
  return done ? (
    <p className="text-sm">
      Thanks for subscribing. Check your inbox for a welcome gift.
    </p>
  ) : (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setDone(true);
      }}
      className="flex max-w-sm gap-2"
    >
      <input
        type="email"
        required
        placeholder="Email address"
        aria-label="Email address"
        className="sf-input min-w-0 flex-1 border-(--sf-line)! bg-transparent! text-(--sf-fg)!"
      />
      <button type="submit" className="sf-btn sf-btn-primary shrink-0">
        Join
      </button>
    </form>
  );
}

export function Footer() {
  const { store } = useStorefront();
  const { profile } = store;
  const { contact } = profile;
  const year = new Date().getFullYear();

  return (
    <footer className="sf-scheme-dark mt-auto">
      <div className="sf-container grid gap-10 py-14 @3xl:grid-cols-2 @5xl:grid-cols-[1.4fr_1fr_1fr_1.3fr] @5xl:py-20">
        <div className="space-y-4">
          <Logo />
          {profile.tagline && (
            <p className="max-w-xs text-sm text-(--sf-muted)">
              {profile.tagline}
            </p>
          )}
          <SocialIcons
            social={profile.social}
            className="-ml-2 flex items-center gap-1"
          />
        </div>
        <div>
          <h2 className="sf-eyebrow mb-4 text-(--sf-muted)">Shop</h2>
          <ul className="space-y-2.5 text-sm">
            <li>
              <StoreLink href="/products" className="hover:opacity-70">
                All products
              </StoreLink>
            </li>
            {profile.navigation.slice(0, 5).map((link) => (
              <li key={link.href}>
                <StoreLink href={link.href} className="hover:opacity-70">
                  {link.label}
                </StoreLink>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="sf-eyebrow mb-4 text-(--sf-muted)">Help</h2>
          <ul className="space-y-2.5 text-sm">
            <li>
              <StoreLink href="/account" className="hover:opacity-70">
                My account
              </StoreLink>
            </li>
            <li>
              <StoreLink href="/account/orders" className="hover:opacity-70">
                Track an order
              </StoreLink>
            </li>
            <li>
              <StoreLink href="/wishlist" className="hover:opacity-70">
                Wishlist
              </StoreLink>
            </li>
            {contact.email && (
              <li>
                <a
                  href={`mailto:${contact.email}`}
                  className="hover:opacity-70"
                >
                  {contact.email}
                </a>
              </li>
            )}
            {contact.phone && (
              <li>
                <a
                  href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}
                  className="hover:opacity-70"
                >
                  {contact.phone}
                </a>
              </li>
            )}
            {contact.address && (
              <li className="text-(--sf-muted)">{contact.address}</li>
            )}
          </ul>
        </div>
        <div className="space-y-4">
          <h2 className="sf-eyebrow text-(--sf-muted)">Stay in touch</h2>
          <p className="text-sm text-(--sf-muted)">
            New arrivals, restocks and subscriber-only offers.
          </p>
          <FooterNewsletter />
        </div>
      </div>
      <div className="border-t border-(--sf-line)">
        <div className="sf-container flex flex-col gap-4 py-6 text-xs text-(--sf-muted) @3xl:flex-row @3xl:items-center @3xl:justify-between">
          <p>
            © {year} {profile.name}. All rights reserved.
          </p>
          <ul
            className="flex flex-wrap items-center gap-1.5"
            aria-label="Accepted payment methods"
          >
            {["Visa", "Mastercard", "Amex", "PayPal", "Apple Pay"].map(
              (method) => (
                <li
                  key={method}
                  className="rounded-sm border border-(--sf-line) px-2 py-1 text-[0.6875rem] font-medium"
                >
                  {method}
                </li>
              ),
            )}
          </ul>
        </div>
      </div>
    </footer>
  );
}

/** Announcement + header + page + footer. */
export function StoreChrome({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
