"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Lock, Package, ShoppingBag } from "lucide-react";
import { getDeliveryQuoteAction } from "@/lib/api/delivery-rate/action";
import { paymentMethodLabel } from "@/lib/api/order/types";
import { estimatedShipping } from "@/lib/storefront/checkout";
import { formatDate, formatMoney } from "@/lib/storefront/format";
import type { Address, CheckoutPaymentMethod, Order } from "@/lib/storefront/types";
import { cn } from "@/lib/utils";
import { EmptyState, Spinner, StoreLink } from "../primitives";
import { useStoreHref, useStorefront } from "../store-context";
import { CartSkeleton } from "./CartView";
import { AddressFields, formatAddress, readAddress } from "./forms";

const PAYMENT_METHODS: { id: CheckoutPaymentMethod; label: string; description: string }[] = [
  { id: "cod", label: "Cash on delivery", description: "Pay when it arrives" },
  { id: "esewa", label: "eSewa", description: "Redirects to eSewa to pay" },
  { id: "khalti", label: "Khalti", description: "Redirects to Khalti to pay" },
];

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

/** Shipping cost for the chosen address: a real quote in live mode, an estimate otherwise. */
function useShippingQuote(address: Address | undefined, subtotal: number) {
  const { store } = useStorefront();
  const addressKey = address ? `${address.region}|${address.city}` : null;
  const [result, setResult] = useState<{ key: string; cost: number; unavailable: boolean } | null>(null);

  useEffect(() => {
    if (store.mode !== "live" || !addressKey) return;
    const key = addressKey;
    let cancelled = false;
    getDeliveryQuoteAction({ region: address!.region, city: address!.city }).then((response) => {
      if (cancelled) return;
      if (response?.data?.unavailable || !response?.data?.quote) setResult({ key, cost: 0, unavailable: true });
      else setResult({ key, cost: response.data.quote.shippingCost, unavailable: false });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `address` itself is covered by `addressKey`
  }, [addressKey, store.mode]);

  if (!address) return null;
  if (store.mode !== "live") return { cost: estimatedShipping(subtotal, store.profile.checkout), unavailable: false };
  return result?.key === addressKey ? result : null;
}

export function CheckoutView() {
  const { store, api, cart, setCart, customer } = useStorefront();
  const router = useRouter();
  const href = useStoreHref();
  const currency = store.profile.currency;
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<string>("new");
  const [newAddress, setNewAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>("cod");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!customer) return;
    let cancelled = false;
    api.listAddresses().then((list) => {
      if (cancelled) return;
      setAddresses(list);
      const defaultAddress = list.find((a) => a.isDefault) ?? list[0];
      setAddressId(defaultAddress?.id ?? "new");
    });
    return () => {
      cancelled = true;
    };
  }, [api, customer]);

  const address = addressId === "new" ? newAddress : addresses.find((a) => a.id === addressId);
  const quote = useShippingQuote(address ?? undefined, cart?.subtotal ?? 0);

  if (!cart || customer === undefined) return <CartSkeleton />;
  if (!customer) {
    return (
      <div className="sf-container py-10">
        <EmptyState icon={<Lock />} title="Sign in to check out" text="Create an account or sign in to place your order." action={<StoreLink href="/account/login?next=/checkout" className="sf-btn sf-btn-primary">Sign in</StoreLink>} />
      </div>
    );
  }
  if (cart.lines.length === 0) {
    return (
      <div className="sf-container py-10">
        <EmptyState icon={<ShoppingBag />} title="Your bag is empty" text="Add something to your bag before checking out." action={<StoreLink href="/products" className="sf-btn sf-btn-primary">Continue shopping</StoreLink>} />
      </div>
    );
  }

  const shipping = quote?.cost ?? 0;
  const total = cart.subtotal + shipping;

  function onAddressSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setNewAddress({ ...readAddress(form, "ship-"), id: "", isDefault: false });
  }

  async function submit() {
    if (!cart) return;
    setError("");

    if (addressId === "new" && !newAddress) {
      setError("Add your delivery address to continue.");
      return;
    }
    if (quote?.unavailable) {
      setError("We don't deliver to that address yet. Try a different one.");
      return;
    }

    setPending(true);
    try {
      let resolvedAddressId = addressId;
      if (addressId === "new" && newAddress) {
        const saved = await api.saveAddress({ ...newAddress, isDefault: addresses.length === 0 });
        resolvedAddressId = saved.find((a) => !addresses.some((existing) => existing.id === a.id))?.id ?? saved[0]?.id ?? "";
      }

      const order = await api.placeOrder({
        addressId: resolvedAddressId,
        items: cart.lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
        paymentMethod,
      });

      if (paymentMethod !== "cod") {
        const { redirectUrl } = await api.initiatePayment(order.id);
        setCart({ ...cart, lines: [], itemCount: 0, subtotal: 0 });
        if (redirectUrl.startsWith("/")) router.push(href(redirectUrl));
        else window.location.href = redirectUrl;
        return;
      }

      setCart({ ...cart, lines: [], itemCount: 0, subtotal: 0 });
      router.push(href(`/checkout/success?order=${order.id}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't place your order. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="sf-container py-8 @5xl:py-12">
      <h1 className="sf-heading sf-h1 mb-10">Checkout</h1>
      <div className="grid items-start gap-10 @4xl:grid-cols-[1fr_24rem] @5xl:gap-16">
        <div className="space-y-8">
          <Step number={1} title="Contact">
            <p className="text-sm">
              Signed in as <span className="font-medium">{customer.email}</span>
            </p>
          </Step>

          <Step number={2} title="Delivery address">
            {addresses.length > 0 && (
              <div className="grid gap-3 @xl:grid-cols-2">
                {addresses.map((saved) => (
                  <label key={saved.id} className={cn("flex cursor-pointer gap-3 rounded-(--sf-radius) border p-4 text-sm transition-colors", addressId === saved.id ? "border-(--sf-text)" : "border-(--sf-line) hover:border-(--sf-muted)")}>
                    <input type="radio" name="addressChoice" checked={addressId === saved.id} onChange={() => setAddressId(saved.id)} className="mt-0.5 accent-(--sf-primary)" />
                    <span className="space-y-0.5">
                      {formatAddress(saved).map((line) => <span key={line} className="block first:font-medium">{line}</span>)}
                    </span>
                  </label>
                ))}
                <label className={cn("flex cursor-pointer items-center gap-3 rounded-(--sf-radius) border p-4 text-sm transition-colors", addressId === "new" ? "border-(--sf-text)" : "border-(--sf-line) hover:border-(--sf-muted)")}>
                  <input type="radio" name="addressChoice" checked={addressId === "new"} onChange={() => setAddressId("new")} className="accent-(--sf-primary)" />
                  Use a new address
                </label>
              </div>
            )}
            {addressId === "new" &&
              (newAddress ? (
                <div className="flex items-start justify-between gap-4 rounded-(--sf-radius) border border-(--sf-text) p-4 text-sm">
                  <span className="space-y-0.5">{formatAddress(newAddress).map((line) => <span key={line} className="block first:font-medium">{line}</span>)}</span>
                  <button type="button" onClick={() => setNewAddress(null)} className="sf-link shrink-0 text-xs">Edit</button>
                </div>
              ) : (
                <form onSubmit={onAddressSubmit} className="space-y-4">
                  <AddressFields prefix="ship-" />
                  <button type="submit" className="sf-btn sf-btn-secondary sf-btn-sm">
                    Use this address
                  </button>
                </form>
              ))}
          </Step>

          <Step number={3} title="Payment">
            <div className="grid gap-3">
              {PAYMENT_METHODS.map((method) => (
                <label key={method.id} className={cn("flex cursor-pointer items-center gap-3 rounded-(--sf-radius) border p-4 text-sm transition-colors", paymentMethod === method.id ? "border-(--sf-text)" : "border-(--sf-line) hover:border-(--sf-muted)")}>
                  <input type="radio" name="paymentMethod" checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)} className="accent-(--sf-primary)" />
                  <span className="flex-1">
                    <span className="block font-medium">{method.label}</span>
                    <span className="text-(--sf-muted)">{method.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </Step>

          {error && <p className="rounded-(--sf-radius) border border-(--sf-sale) p-3 text-sm text-(--sf-sale)">{error}</p>}
          <button type="button" onClick={submit} disabled={pending || !address} className="sf-btn sf-btn-primary sf-btn-block min-h-13! text-base!">
            {pending ? <Spinner /> : <Lock className="size-4" />}
            {pending ? "Placing your order…" : paymentMethod === "cod" ? `Place order · ${formatMoney(total, currency)}` : `Continue to pay ${formatMoney(total, currency)}`}
          </button>
        </div>

        <aside className="space-y-5 rounded-(--sf-radius) bg-(--sf-surface) p-6 @4xl:sticky @4xl:top-[calc(var(--sf-sticky-top,0px)+6rem)]">
          <h2 className="text-lg font-medium">Order summary</h2>
          <ul className="space-y-4">
            {cart.lines.map((line) => (
              <li key={line.id} className="flex items-center gap-3 text-sm">
                <div className="relative shrink-0">
                  <span className="flex aspect-4/5 w-14 items-center justify-center rounded-(--sf-radius) bg-(--sf-bg)">
                    <Package className="size-5 text-(--sf-muted)" />
                  </span>
                  <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-(--sf-text) text-[0.625rem] text-(--sf-bg) tabular-nums">{line.quantity}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{line.name}</p>
                </div>
                <span className="tabular-nums">{formatMoney(line.price * line.quantity, currency)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2.5 border-t border-(--sf-line) pt-4 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{formatMoney(cart.subtotal, currency)}</dd></div>
            <div className="flex justify-between">
              <dt>Shipping</dt>
              <dd className="tabular-nums">{!address ? "—" : quote === null ? <Spinner className="size-3.5" /> : quote.unavailable ? "Unavailable" : shipping === 0 ? "Free" : formatMoney(shipping, currency)}</dd>
            </div>
            <div className="flex justify-between border-t border-(--sf-line) pt-3 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatMoney(total, currency)}</dd></div>
          </dl>
        </aside>
      </div>
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
            <span className="flex aspect-4/5 w-16 shrink-0 items-center justify-center rounded-(--sf-radius) bg-(--sf-surface)">
              <Package className="size-5 text-(--sf-muted)" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{line.name}</p>
              <p className="text-(--sf-muted)">Qty {line.quantity}</p>
            </div>
            <span className="tabular-nums">{formatMoney(line.price * line.quantity, currency)}</span>
          </li>
        ))}
      </ul>
      <div className="grid gap-8 @3xl:grid-cols-2">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{formatMoney(order.subtotal, currency)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between"><dt>Discount</dt><dd className="tabular-nums">−{formatMoney(order.discount, currency)}</dd></div>}
          <div className="flex justify-between"><dt>Shipping</dt><dd className="tabular-nums">{order.shipping === 0 ? "Free" : formatMoney(order.shipping, currency)}</dd></div>
          <div className="flex justify-between border-t border-(--sf-line) pt-2 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatMoney(order.total, currency)}</dd></div>
        </dl>
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="mb-2 font-medium">Shipping to</h3>
            <p className="text-(--sf-muted)">{order.shippingAddress}</p>
            <p className="text-(--sf-muted)">{[order.shippingCity, order.shippingRegion].filter(Boolean).join(", ")}</p>
          </div>
          <div>
            <h3 className="mb-2 font-medium">Payment</h3>
            <p className="text-(--sf-muted)">{paymentMethodLabel(order.paymentMethod)}</p>
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
    let timer: ReturnType<typeof setTimeout> | undefined;
    // A gateway's server callback can land either side of the browser
    // redirect here, so a `pending` order is polled briefly rather than
    // trusted as final.
    function poll() {
      api.getOrder(id!).then((result) => {
        if (cancelled) return;
        setOrder(result);
        if (result?.status === "pending") timer = setTimeout(poll, 3000);
      });
    }
    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [api, id]);

  if (!id || order === null) {
    return (
      <div className="sf-container py-10">
        <EmptyState icon={<ShoppingBag />} title="Order not found" text="We couldn't find that order. If you just placed it, check your account for the confirmation." action={<StoreLink href="/" className="sf-btn sf-btn-primary">Back to the store</StoreLink>} />
      </div>
    );
  }
  if (order === undefined) return <CartSkeleton />;

  return (
    <div className="sf-container max-w-3xl! py-12 @5xl:py-16">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-(--sf-primary) text-(--sf-primary-text)">
          <Check className="size-8" strokeWidth={2.5} />
        </div>
        <p className="sf-eyebrow text-(--sf-muted)">Order {order.number}</p>
        <h1 className="sf-heading sf-h1 mt-2">Thank you for your order</h1>
        <p className="mx-auto mt-3 max-w-md text-(--sf-muted)">
          {order.status === "pending" ? "We're confirming your payment. This usually takes a moment." : "We'll let you know as soon as it ships."}
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
