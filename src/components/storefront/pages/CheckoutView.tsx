"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, CreditCard, Lock, ShoppingBag } from "lucide-react";
import { orderTotals, shippingMethods } from "@/lib/storefront/checkout";
import { formatDate, formatMoney } from "@/lib/storefront/format";
import type { Address, Order, ShippingMethod } from "@/lib/storefront/types";
import { cn } from "@/lib/utils";
import { EASE } from "../motion";
import { EmptyState, Spinner, StoreImage, StoreLink } from "../primitives";
import { useStoreHref, useStorefront } from "../store-context";
import { CartSkeleton } from "./CartView";
import { AddressFields, Field, formatAddress, readAddress } from "./forms";

function Step({ number, title, children, action }: { number: number; title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="space-y-5 border-b border-(--sf-line) pb-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-3 text-lg font-medium">
          <span className="flex size-7 items-center justify-center rounded-full bg-(--sf-text) text-xs text-(--sf-bg)">{number}</span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function cardBrand(number: string) {
  if (/^4/.test(number)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(number)) return "Mastercard";
  if (/^3[47]/.test(number)) return "Amex";
  if (/^6/.test(number)) return "Discover";
  return "Card";
}

function luhn(number: string) {
  let sum = 0;
  for (let i = 0; i < number.length; i++) {
    let digit = Number(number[number.length - 1 - i]);
    if (i % 2 === 1) digit = digit * 2 > 9 ? digit * 2 - 9 : digit * 2;
    sum += digit;
  }
  return number.length >= 12 && sum % 10 === 0;
}

export function CheckoutView() {
  const { store, api, cart, setCart, customer } = useStorefront();
  const router = useRouter();
  const href = useStoreHref();
  const currency = store.profile.currency;
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<string>("new");
  const [methodId, setMethodId] = useState<ShippingMethod["id"]>("standard");
  const [card, setCard] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!customer) return;
    let cancelled = false;
    api.listAddresses().then((list) => {
      if (cancelled) return;
      setAddresses(list);
      setAddressId(list.find((a) => a.isDefault)?.id ?? list[0]?.id ?? "new");
    });
    return () => {
      cancelled = true;
    };
  }, [api, customer]);

  if (!cart || customer === undefined) return <CartSkeleton />;
  if (cart.lines.length === 0) {
    return (
      <div className="sf-container py-10">
        <EmptyState icon={<ShoppingBag />} title="Your bag is empty" text="Add something to your bag before checking out." action={<StoreLink href="/products" className="sf-btn sf-btn-primary">Continue shopping</StoreLink>} />
      </div>
    );
  }

  const methods = shippingMethods(cart.subtotal, store.profile.checkout);
  const method = methods.find((m) => m.id === methodId) ?? methods[0];
  const totals = orderTotals(cart.subtotal, method.price, store.profile.checkout);
  const digits = card.replace(/\D/g, "");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next: Record<string, string> = {};
    const email = customer?.email ?? String(form.get("email") ?? "").trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email so we can send your receipt.";
    if (!luhn(digits)) next.card = "That card number doesn't look right.";
    if (!/^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/.test(String(form.get("expiry") ?? ""))) next.expiry = "Use MM / YY.";
    if (!/^\d{3,4}$/.test(String(form.get("cvc") ?? ""))) next.cvc = "3 or 4 digits.";
    setErrors(next);
    if (Object.keys(next).length) return;

    const saved = addresses.find((a) => a.id === addressId);
    setPending(true);
    try {
      // In production the card fields are the payment provider's hosted
      // fields; only a token (plus brand/last4 for display) reaches our API.
      const order = await api.placeOrder({
        email,
        shippingAddress: saved ?? readAddress(form, "ship-"),
        shippingMethodId: method.id,
        payment: { token: `tok_mock_${digits.slice(-4)}`, brand: cardBrand(digits), last4: digits.slice(-4) },
        saveAddress: !saved && form.get("saveAddress") === "on",
      });
      setCart({ ...cart!, lines: [], itemCount: 0, subtotal: 0 });
      router.push(href(`/checkout/success?order=${order.id}`));
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Payment failed. Please try again." });
      setPending(false);
    }
  }

  return (
    <div className="sf-container py-8 @5xl:py-12">
      <h1 className="sf-heading sf-h1 mb-10">Checkout</h1>
      <form onSubmit={submit} noValidate className="grid items-start gap-10 @4xl:grid-cols-[1fr_24rem] @5xl:gap-16">
        <div className="space-y-8">
          <Step
            number={1}
            title="Contact"
            action={!customer && <StoreLink href="/account/login?next=/checkout" className="sf-link text-sm">Sign in</StoreLink>}
          >
            {customer ? (
              <p className="text-sm">
                Signed in as <span className="font-medium">{customer.email}</span>
              </p>
            ) : (
              <Field label="Email" htmlFor="email" error={errors.email}>
                <input id="email" name="email" type="email" autoComplete="email" required aria-invalid={Boolean(errors.email)} className="sf-input" placeholder="you@example.com" />
              </Field>
            )}
          </Step>

          <Step number={2} title="Delivery address">
            {addresses.length > 0 && (
              <div className="grid gap-3 @xl:grid-cols-2">
                {addresses.map((address) => (
                  <label key={address.id} className={cn("flex cursor-pointer gap-3 rounded-(--sf-radius) border p-4 text-sm transition-colors", addressId === address.id ? "border-(--sf-text)" : "border-(--sf-line) hover:border-(--sf-muted)")}>
                    <input type="radio" name="addressChoice" checked={addressId === address.id} onChange={() => setAddressId(address.id)} className="mt-0.5 accent-(--sf-primary)" />
                    <span className="space-y-0.5">
                      {formatAddress(address).map((line) => <span key={line} className="block first:font-medium">{line}</span>)}
                    </span>
                  </label>
                ))}
                <label className={cn("flex cursor-pointer items-center gap-3 rounded-(--sf-radius) border p-4 text-sm transition-colors", addressId === "new" ? "border-(--sf-text)" : "border-(--sf-line) hover:border-(--sf-muted)")}>
                  <input type="radio" name="addressChoice" checked={addressId === "new"} onChange={() => setAddressId("new")} className="accent-(--sf-primary)" />
                  Use a new address
                </label>
              </div>
            )}
            {addressId === "new" && (
              <>
                <AddressFields prefix="ship-" defaults={customer ? { firstName: customer.firstName, lastName: customer.lastName, company: "", line1: "", line2: "", city: "", region: "", postalCode: "", country: "United States", phone: customer.phone } : undefined} />
                {customer && (
                  <label className="flex items-center gap-2.5 text-sm">
                    <input type="checkbox" name="saveAddress" defaultChecked className="size-4 accent-(--sf-primary)" /> Save this address to my account
                  </label>
                )}
              </>
            )}
          </Step>

          <Step number={3} title="Delivery method">
            <div className="grid gap-3">
              {methods.map((m) => (
                <label key={m.id} className={cn("flex cursor-pointer items-center gap-3 rounded-(--sf-radius) border p-4 text-sm transition-colors", methodId === m.id ? "border-(--sf-text)" : "border-(--sf-line) hover:border-(--sf-muted)")}>
                  <input type="radio" name="method" checked={methodId === m.id} onChange={() => setMethodId(m.id)} className="accent-(--sf-primary)" />
                  <span className="flex-1">
                    <span className="block font-medium">{m.label}</span>
                    <span className="text-(--sf-muted)">{m.description}</span>
                  </span>
                  <span className="font-medium tabular-nums">{m.price === 0 ? "Free" : formatMoney(m.price, currency)}</span>
                </label>
              ))}
            </div>
          </Step>

          <Step number={4} title="Payment">
            <p className="flex items-center gap-2 text-[0.8125rem] text-(--sf-muted)">
              <Lock className="size-3.5" /> Payments are encrypted and processed securely.
              {!process.env.NEXT_PUBLIC_STOREFRONT_API_URL && <span> Test mode: use 4242 4242 4242 4242.</span>}
            </p>
            <div className="grid gap-4 @xl:grid-cols-[1fr_7rem_6rem]">
              <Field label="Card number" htmlFor="card" error={errors.card}>
                <div className="relative">
                  <input
                    id="card"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={card}
                    onChange={(e) => setCard(e.target.value.replace(/[^\d ]/g, "").slice(0, 23))}
                    placeholder="1234 1234 1234 1234"
                    aria-invalid={Boolean(errors.card)}
                    className="sf-input pr-24!"
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1.5 text-xs text-(--sf-muted)">
                    <CreditCard className="size-4" /> {digits.length > 1 ? cardBrand(digits) : ""}
                  </span>
                </div>
              </Field>
              <Field label="Expiry" htmlFor="expiry" error={errors.expiry}>
                <input id="expiry" name="expiry" autoComplete="cc-exp" placeholder="MM / YY" aria-invalid={Boolean(errors.expiry)} className="sf-input" />
              </Field>
              <Field label="CVC" htmlFor="cvc" error={errors.cvc}>
                <input id="cvc" name="cvc" inputMode="numeric" autoComplete="cc-csc" placeholder="123" aria-invalid={Boolean(errors.cvc)} className="sf-input" />
              </Field>
            </div>
          </Step>

          {errors.form && <p className="rounded-(--sf-radius) border border-(--sf-sale) p-3 text-sm text-(--sf-sale)">{errors.form}</p>}
          <button type="submit" disabled={pending} className="sf-btn sf-btn-primary sf-btn-block min-h-13! text-base!">
            {pending ? <Spinner /> : <Lock className="size-4" />}
            {pending ? "Placing your order…" : `Pay ${formatMoney(totals.total, currency)}`}
          </button>
        </div>

        <aside className="space-y-5 rounded-(--sf-radius) bg-(--sf-surface) p-6 @4xl:sticky @4xl:top-[calc(var(--sf-sticky-top,0px)+6rem)]">
          <h2 className="text-lg font-medium">Order summary</h2>
          <ul className="space-y-4">
            {cart.lines.map((line) => (
              <li key={line.id} className="flex items-center gap-3 text-sm">
                <div className="relative shrink-0">
                  <StoreImage src={line.image.url} alt={line.image.alt} sizes="64px" className="aspect-4/5 w-14 rounded-(--sf-radius)" />
                  <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-(--sf-text) text-[0.625rem] text-(--sf-bg) tabular-nums">{line.quantity}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{line.name}</p>
                  {line.variantTitle && <p className="text-xs text-(--sf-muted)">{line.variantTitle}</p>}
                </div>
                <span className="tabular-nums">{formatMoney(line.price * line.quantity, currency)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2.5 border-t border-(--sf-line) pt-4 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{formatMoney(totals.subtotal, currency)}</dd></div>
            <div className="flex justify-between"><dt>Shipping</dt><dd className="tabular-nums">{totals.shipping === 0 ? "Free" : formatMoney(totals.shipping, currency)}</dd></div>
            <div className="flex justify-between"><dt>Tax</dt><dd className="tabular-nums">{formatMoney(totals.tax, currency)}</dd></div>
            <div className="flex justify-between border-t border-(--sf-line) pt-3 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatMoney(totals.total, currency)}</dd></div>
          </dl>
        </aside>
      </form>
    </div>
  );
}

// ---------------------------------------------------------- confirmation

export function OrderSummaryCard({ order }: { order: Order }) {
  const { store } = useStorefront();
  const currency = store.profile.currency;
  return (
    <div className="space-y-6">
      <ul className="divide-y divide-(--sf-line) border-y border-(--sf-line)">
        {order.lines.map((line) => (
          <li key={line.id} className="flex items-center gap-4 py-4 text-sm">
            <StoreImage src={line.image.url} alt={line.image.alt} sizes="80px" className="aspect-4/5 w-16 shrink-0 rounded-(--sf-radius)" />
            <div className="min-w-0 flex-1">
              <StoreLink href={`/products/${line.slug}`} className="font-medium hover:opacity-70">{line.name}</StoreLink>
              <p className="text-(--sf-muted)">{[line.variantTitle, `Qty ${line.quantity}`].filter(Boolean).join(" · ")}</p>
            </div>
            <span className="tabular-nums">{formatMoney(line.price * line.quantity, currency)}</span>
          </li>
        ))}
      </ul>
      <div className="grid gap-8 @3xl:grid-cols-2">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{formatMoney(order.subtotal, currency)}</dd></div>
          <div className="flex justify-between"><dt>Shipping · {order.shippingMethod.label}</dt><dd className="tabular-nums">{order.shipping === 0 ? "Free" : formatMoney(order.shipping, currency)}</dd></div>
          <div className="flex justify-between"><dt>Tax</dt><dd className="tabular-nums">{formatMoney(order.tax, currency)}</dd></div>
          <div className="flex justify-between border-t border-(--sf-line) pt-2 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatMoney(order.total, currency)}</dd></div>
        </dl>
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="mb-2 font-medium">Shipping to</h3>
            {formatAddress(order.shippingAddress).map((line) => <p key={line} className="text-(--sf-muted)">{line}</p>)}
          </div>
          <div>
            <h3 className="mb-2 font-medium">Payment</h3>
            <p className="text-(--sf-muted)">{order.payment.brand} ending {order.payment.last4}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrderConfirmation() {
  const { api, customer } = useStorefront();
  const params = useSearchParams();
  const id = params.get("order");
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api.getOrder(id).then((result) => !cancelled && setOrder(result));
    return () => {
      cancelled = true;
    };
  }, [api, id]);

  if (!id || order === null) {
    return (
      <div className="sf-container py-10">
        <EmptyState icon={<ShoppingBag />} title="Order not found" text="We couldn't find that order. If you just placed it, check your email for the confirmation." action={<StoreLink href="/" className="sf-btn sf-btn-primary">Back to the store</StoreLink>} />
      </div>
    );
  }
  if (order === undefined) return <CartSkeleton />;

  return (
    <div className="sf-container max-w-3xl! py-12 @5xl:py-16">
      <div className="mb-10 text-center">
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-(--sf-primary) text-(--sf-primary-text)"
        >
          <Check className="size-8" strokeWidth={2.5} />
        </motion.div>
        <p className="sf-eyebrow text-(--sf-muted)">Order {order.number}</p>
        <h1 className="sf-heading sf-h1 mt-2">Thank you for your order</h1>
        <p className="mx-auto mt-3 max-w-md text-(--sf-muted)">
          A confirmation is on its way to <span className="font-medium text-(--sf-text)">{order.email}</span>. We&apos;ll let you know as soon as it ships.
        </p>
        <p className="mt-1 text-sm text-(--sf-muted)">Placed {formatDate(order.createdAt)}</p>
      </div>
      <OrderSummaryCard order={order} />
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <StoreLink href="/products" className="sf-btn sf-btn-primary">Continue shopping</StoreLink>
        {customer && <StoreLink href={`/account/orders/${order.id}`} className="sf-btn sf-btn-secondary">View order</StoreLink>}
      </div>
    </div>
  );
}
