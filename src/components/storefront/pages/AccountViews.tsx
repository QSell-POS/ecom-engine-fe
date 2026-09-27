"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, ChevronRight, LogOut, MapPin, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatMoney } from "@/lib/storefront/format";
import type { Address, Customer, Order, OrderStatus } from "@/lib/storefront/types";
import { cn } from "@/lib/utils";
import { EASE } from "../motion";
import { SfDrawer } from "../overlay";
import { Breadcrumbs, EmptyState, Spinner, StoreImage, StoreLink } from "../primitives";
import { useStoreHref, useStorefront } from "../store-context";
import { OrderSummaryCard } from "./CheckoutView";
import { AddressFields, Field, formatAddress, readAddress } from "./forms";

const STATUS: Record<OrderStatus, { label: string; tone: string }> = {
  confirmed: { label: "Confirmed", tone: "bg-sky-500" },
  processing: { label: "Processing", tone: "bg-amber-500" },
  shipped: { label: "Shipped", tone: "bg-indigo-500" },
  delivered: { label: "Delivered", tone: "bg-emerald-500" },
  cancelled: { label: "Cancelled", tone: "bg-zinc-400" },
};

function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-(--sf-surface) px-2.5 py-1 text-xs font-medium">
      <span className={cn("size-1.5 rounded-full", STATUS[status].tone)} /> {STATUS[status].label}
    </span>
  );
}

const NAV = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/wishlist", label: "Wishlist" },
];

/** Signed-in area: redirects guests to sign in, then back here. */
function AccountShell({ title, children, crumbs = [] }: { title: string; children: (customer: Customer) => ReactNode; crumbs?: { label: string; href?: string }[] }) {
  const { api, customer, setCustomer } = useStorefront();
  const router = useRouter();
  const href = useStoreHref();
  const pathname = usePathname();
  const current = pathname.replace(href(""), "") || "/account";

  useEffect(() => {
    if (customer === null) router.replace(href(`/account/login?next=${encodeURIComponent(current)}`));
  }, [customer, router, href, current]);

  if (!customer) {
    return (
      <div className="sf-container flex justify-center py-24">
        <Spinner className="size-6 text-(--sf-muted)" />
      </div>
    );
  }

  return (
    <div className="sf-container py-8 @5xl:py-12">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Account", href: crumbs.length ? "/account" : undefined }, ...crumbs]} />
      <div className="mt-4 mb-10 flex flex-wrap items-end justify-between gap-4">
        <h1 className="sf-heading sf-h2">{title}</h1>
        <button
          type="button"
          onClick={async () => {
            await api.logout();
            setCustomer(null);
            toast.success("You've been signed out");
            router.push(href("/"));
          }}
          className="sf-btn sf-btn-ghost sf-btn-sm text-(--sf-muted)"
        >
          <LogOut className="size-4" /> Sign out
        </button>
      </div>
      <div className="grid gap-10 @4xl:grid-cols-[12rem_1fr] @5xl:gap-16">
        <nav aria-label="Account" className="sf-no-scrollbar -mx-1 flex gap-1 overflow-x-auto @4xl:flex-col">
          {NAV.map((item) => {
            const active = item.href === "/account" ? current === "/account" : current.startsWith(item.href);
            return (
              <StoreLink key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("rounded-(--sf-radius) px-3 py-2 text-sm whitespace-nowrap transition-colors", active ? "bg-(--sf-surface) font-medium" : "text-(--sf-muted) hover:text-(--sf-text)")}>
                {item.label}
              </StoreLink>
            );
          })}
        </nav>
        <motion.div key={current} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }} className="min-w-0">
          {children(customer)}
        </motion.div>
      </div>
    </div>
  );
}

function useOrders() {
  const { api, customer } = useStorefront();
  const [orders, setOrders] = useState<Order[] | null>(null);
  useEffect(() => {
    if (!customer) return;
    let cancelled = false;
    api.listOrders().then((list) => !cancelled && setOrders(list));
    return () => {
      cancelled = true;
    };
  }, [api, customer]);
  return orders;
}

function OrderRow({ order }: { order: Order }) {
  const { store } = useStorefront();
  return (
    <StoreLink href={`/account/orders/${order.id}`} className="group/order flex flex-wrap items-center gap-x-6 gap-y-3 rounded-(--sf-radius) border border-(--sf-line) p-4 transition-colors hover:border-(--sf-text) @3xl:p-5">
      <div className="flex -space-x-3">
        {order.lines.slice(0, 3).map((line) => (
          <StoreImage key={line.id} src={line.image.url} alt="" sizes="56px" className="aspect-4/5 w-12 rounded-(--sf-radius) ring-2 ring-(--sf-bg)" />
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium">Order {order.number}</p>
        <p className="text-sm text-(--sf-muted)">
          {formatDate(order.createdAt)} · {order.lines.reduce((n, l) => n + l.quantity, 0)} items
        </p>
      </div>
      <StatusPill status={order.status} />
      <span className="w-20 text-right font-medium tabular-nums">{formatMoney(order.total, store.profile.currency)}</span>
      <ChevronRight className="size-4 text-(--sf-muted) transition-transform group-hover/order:translate-x-0.5" />
    </StoreLink>
  );
}

function ProfileForm({ customer }: { customer: Customer }) {
  const { api, setCustomer } = useStorefront();
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      setCustomer(
        await api.updateProfile({
          firstName: String(form.get("firstName") ?? "").trim(),
          lastName: String(form.get("lastName") ?? "").trim(),
          phone: String(form.get("phone") ?? "").trim(),
          marketingOptIn: form.get("marketing") === "on",
        }),
      );
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save your profile.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 @xl:grid-cols-2">
      <Field label="First name" htmlFor="firstName">
        <input id="firstName" name="firstName" required defaultValue={customer.firstName} className="sf-input" />
      </Field>
      <Field label="Last name" htmlFor="lastName">
        <input id="lastName" name="lastName" required defaultValue={customer.lastName} className="sf-input" />
      </Field>
      <Field label="Email" htmlFor="email">
        <input id="email" value={customer.email} disabled className="sf-input opacity-60" />
      </Field>
      <Field label="Phone" htmlFor="phone">
        <input id="phone" name="phone" type="tel" defaultValue={customer.phone} className="sf-input" />
      </Field>
      <label className="flex items-center gap-2.5 text-sm @xl:col-span-2">
        <input type="checkbox" name="marketing" defaultChecked={customer.marketingOptIn} className="size-4 accent-(--sf-primary)" /> Send me news and offers by email
      </label>
      <div className="@xl:col-span-2">
        <button type="submit" disabled={pending} className="sf-btn sf-btn-primary">
          {pending && <Spinner />} Save changes
        </button>
      </div>
    </form>
  );
}

export function AccountOverview() {
  return (
    <AccountShell title="My account">
      {(customer) => <Overview customer={customer} />}
    </AccountShell>
  );
}

function Overview({ customer }: { customer: Customer }) {
  const { api } = useStorefront();
  const orders = useOrders();
  const [address, setAddress] = useState<Address | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    api.listAddresses().then((list) => !cancelled && setAddress(list.find((a) => a.isDefault) ?? list[0] ?? null));
    return () => {
      cancelled = true;
    };
  }, [api]);

  return (
    <div className="space-y-12">
      <div>
        <p className="sf-heading sf-h3">Hi, {customer.firstName}</p>
        <p className="mt-1 text-sm text-(--sf-muted)">Member since {formatDate(customer.createdAt)}</p>
      </div>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent orders</h2>
          <StoreLink href="/account/orders" className="sf-link text-sm">View all</StoreLink>
        </div>
        {orders === null ? (
          <div className="h-20 animate-pulse rounded-(--sf-radius) bg-(--sf-soft)" />
        ) : orders.length === 0 ? (
          <p className="text-sm text-(--sf-muted)">No orders yet. <StoreLink href="/products" className="sf-link">Start shopping</StoreLink></p>
        ) : (
          <div className="space-y-3">{orders.slice(0, 2).map((order) => <OrderRow key={order.id} order={order} />)}</div>
        )}
      </section>
      <div className="grid gap-12 @4xl:grid-cols-[1fr_16rem]">
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Profile</h2>
          <ProfileForm customer={customer} />
        </section>
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Default address</h2>
          {address === undefined ? (
            <div className="h-24 animate-pulse rounded-(--sf-radius) bg-(--sf-soft)" />
          ) : address ? (
            <div className="space-y-0.5 text-sm">
              {formatAddress(address).map((line) => <p key={line} className="first:font-medium">{line}</p>)}
            </div>
          ) : (
            <p className="text-sm text-(--sf-muted)">No saved address yet.</p>
          )}
          <StoreLink href="/account/addresses" className="sf-link text-sm">Manage addresses</StoreLink>
        </section>
      </div>
    </div>
  );
}

export function OrdersView() {
  return (
    <AccountShell title="Orders" crumbs={[{ label: "Orders" }]}>
      {() => <OrdersList />}
    </AccountShell>
  );
}

function OrdersList() {
  const orders = useOrders();
  if (orders === null) return <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-(--sf-radius) bg-(--sf-soft)" />)}</div>;
  if (orders.length === 0) {
    return <EmptyState icon={<Package />} title="No orders yet" text="When you place an order, you'll be able to track it here." action={<StoreLink href="/products" className="sf-btn sf-btn-primary">Start shopping</StoreLink>} />;
  }
  return <div className="space-y-3">{orders.map((order) => <OrderRow key={order.id} order={order} />)}</div>;
}

const FLOW: OrderStatus[] = ["confirmed", "processing", "shipped", "delivered"];

export function OrderDetailView({ orderId }: { orderId: string }) {
  return (
    <AccountShell title="Order details" crumbs={[{ label: "Orders", href: "/account/orders" }, { label: "Details" }]}>
      {() => <OrderDetail orderId={orderId} />}
    </AccountShell>
  );
}

function OrderDetail({ orderId }: { orderId: string }) {
  const { api } = useStorefront();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    api.getOrder(orderId).then((result) => !cancelled && setOrder(result));
    return () => {
      cancelled = true;
    };
  }, [api, orderId]);

  if (order === undefined) return <div className="h-64 animate-pulse rounded-(--sf-radius) bg-(--sf-soft)" />;
  if (order === null) return <EmptyState icon={<Package />} title="Order not found" text="This order doesn't exist or belongs to another account." action={<StoreLink href="/account/orders" className="sf-btn sf-btn-primary">Your orders</StoreLink>} />;

  const reached = order.status === "cancelled" ? 0 : FLOW.indexOf(order.status);
  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="sf-heading sf-h3">Order {order.number}</p>
          <p className="text-sm text-(--sf-muted)">Placed {formatDate(order.createdAt)}</p>
        </div>
        <StatusPill status={order.status} />
      </div>

      {order.status !== "cancelled" && (
        <ol className="grid grid-cols-4 gap-2" aria-label="Order progress">
          {FLOW.map((status, i) => {
            const done = i <= reached;
            const event = order.timeline.find((t) => t.status === status);
            return (
              <li key={status} className="space-y-2.5">
                <div className="h-1 overflow-hidden rounded-full bg-(--sf-soft)">
                  <motion.div className="h-full bg-(--sf-primary)" initial={{ width: 0 }} animate={{ width: done ? "100%" : 0 }} transition={{ duration: 0.6, delay: i * 0.15, ease: EASE }} />
                </div>
                <div className="flex items-start gap-1.5 text-xs @3xl:text-sm">
                  {done && <Check className="mt-0.5 size-3.5 shrink-0" />}
                  <div>
                    <p className={cn("font-medium", !done && "text-(--sf-muted)")}>{STATUS[status].label}</p>
                    {event && <p className="hidden text-(--sf-muted) @3xl:block">{formatDate(event.at)}</p>}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <OrderSummaryCard order={order} />
    </div>
  );
}

export function AddressesView() {
  return (
    <AccountShell title="Addresses" crumbs={[{ label: "Addresses" }]}>
      {() => <AddressBook />}
    </AccountShell>
  );
}

function AddressBook() {
  const { api } = useStorefront();
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.listAddresses().then((list) => !cancelled && setAddresses(list));
    return () => {
      cancelled = true;
    };
  }, [api]);

  async function run(action: () => Promise<Address[]>, success: string) {
    setPending(true);
    try {
      setAddresses(await action());
      toast.success(success);
      setEditing(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = readAddress(form, "addr-");
    const id = editing && editing !== "new" ? editing.id : undefined;
    void run(() => api.saveAddress({ ...input, id, isDefault: form.get("isDefault") === "on" }), id ? "Address updated" : "Address added");
  }

  if (addresses === null) return <div className="grid gap-4 @3xl:grid-cols-2">{[0, 1].map((i) => <div key={i} className="h-40 animate-pulse rounded-(--sf-radius) bg-(--sf-soft)" />)}</div>;

  return (
    <>
      <div className="grid gap-4 @3xl:grid-cols-2">
        {addresses.map((address) => (
          <div key={address.id} className="flex flex-col rounded-(--sf-radius) border border-(--sf-line) p-5">
            <div className="mb-3 flex items-center justify-between">
              <MapPin className="size-4 text-(--sf-muted)" />
              {address.isDefault && <span className="rounded-full bg-(--sf-surface) px-2.5 py-0.5 text-xs font-medium">Default</span>}
            </div>
            <div className="flex-1 space-y-0.5 text-sm">
              {formatAddress(address).map((line) => <p key={line} className="first:font-medium">{line}</p>)}
              {address.phone && <p className="text-(--sf-muted)">{address.phone}</p>}
            </div>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-(--sf-line) pt-4 text-sm">
              <button type="button" onClick={() => setEditing(address)} className="flex items-center gap-1.5 hover:opacity-70"><Pencil className="size-3.5" /> Edit</button>
              {!address.isDefault && (
                <button type="button" onClick={() => run(() => api.saveAddress({ ...address, isDefault: true }), "Default address updated")} className="hover:opacity-70">
                  Set as default
                </button>
              )}
              <button type="button" onClick={() => run(() => api.deleteAddress(address.id), "Address removed")} className="flex items-center gap-1.5 text-(--sf-muted) hover:text-(--sf-sale)"><Trash2 className="size-3.5" /> Remove</button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setEditing("new")} className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-(--sf-radius) border border-dashed border-(--sf-line) text-sm text-(--sf-muted) transition-colors hover:border-(--sf-text) hover:text-(--sf-text)">
          <Plus className="size-5" /> Add a new address
        </button>
      </div>

      <SfDrawer open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} title={editing === "new" ? "New address" : "Edit address"} description="Address details">
        {editing !== null && (
          <form onSubmit={submit} className="space-y-5 p-5">
            <AddressFields prefix="addr-" defaults={editing === "new" ? undefined : editing} className="@xl:grid-cols-1" />
            <label className="flex items-center gap-2.5 text-sm">
              <input type="checkbox" name="isDefault" defaultChecked={editing !== "new" && editing.isDefault} className="size-4 accent-(--sf-primary)" /> Use as my default address
            </label>
            <button type="submit" disabled={pending} className="sf-btn sf-btn-primary sf-btn-block">
              {pending && <Spinner />} Save address
            </button>
          </form>
        )}
      </SfDrawer>
    </>
  );
}
