import type { Metadata } from "next";
import { Check, Package } from "lucide-react";
import { getOrderTracking } from "@/lib/api/order/tracking";
import { paymentMethodLabel, type OrderStatus } from "@/lib/api/order/types";
import { formatDate, formatMoney } from "@/lib/storefront/format";
import { cn } from "@/lib/utils";
import { loadStore } from "../../store";

// The link is a credential: keep it out of search engines and referrers.
export const metadata: Metadata = { title: "Track your order", robots: { index: false, follow: false }, referrer: "no-referrer" };

const LABELS: Record<OrderStatus, string> = {
  pending: "Order placed",
  confirmed: "Confirmed",
  processing: "Being prepared",
  shipped: "On its way",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const FLOW: OrderStatus[] = ["confirmed", "processing", "shipped", "delivered"];

const PAYMENT_LABELS: Record<string, string> = {
  paid: "Paid",
  unpaid: "Not paid yet",
  pending: "Payment pending",
  failed: "Payment failed",
  refunded: "Refunded",
  partially_refunded: "Partly refunded",
};

const time = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

/** Public order tracking, reached from the link staff send in Messenger or Instagram. */
export default async function TrackOrderPage({ params }: { params: Promise<{ slug: string; token: string }> }) {
  const { store } = await loadStore(params);
  const { token } = await params;
  const order = store.host ? await getOrderTracking(token, store.host) : null;
  const currency = store.profile.currency;

  if (!order) {
    return (
      <div className="sf-container flex flex-col items-center gap-3 py-24 text-center">
        <Package className="size-6 text-(--sf-muted)" />
        <h1 className="sf-heading sf-h3">We couldn&apos;t find that order</h1>
        <p className="max-w-sm text-sm text-(--sf-muted)">Check that the link was copied in full, or ask us in chat for a new one.</p>
      </div>
    );
  }

  const stopped = order.status === "cancelled" || order.status === "refunded";
  const reached = stopped ? -1 : FLOW.indexOf(order.status);
  const lastAt = new Map(order.timeline.map((entry) => [entry.status, entry.at]));

  return (
    <div className="sf-container max-w-3xl space-y-10 py-10">
      <header className="space-y-1">
        <p className="text-sm text-(--sf-muted)">Order {order.orderNumber}</p>
        <h1 className="sf-heading sf-h2">{LABELS[order.status]}</h1>
        <p className="text-sm text-(--sf-muted)">
          Placed {formatDate(order.placedAt)} · {paymentMethodLabel(order.paymentMethod as never)} · {PAYMENT_LABELS[order.paymentStatus] ?? order.paymentStatus}
        </p>
      </header>

      {!stopped && (
        <ol className="grid grid-cols-4 gap-2" aria-label="Order progress">
          {FLOW.map((status, i) => {
            const done = i <= reached;
            const at = lastAt.get(status);
            return (
              <li key={status} className="space-y-2.5">
                <div className="h-1 overflow-hidden rounded-full bg-(--sf-soft)">
                  <div className={cn("h-full bg-(--sf-primary) transition-all", done ? "w-full" : "w-0")} />
                </div>
                <div className="text-xs @3xl:text-sm">
                  <p className={cn("flex items-start gap-1.5 font-medium", !done && "text-(--sf-muted)")}>
                    {done && <Check className="mt-0.5 size-3.5 shrink-0" />}
                    {LABELS[status]}
                  </p>
                  {done && at && <p className="mt-0.5 text-(--sf-muted)">{time.format(new Date(at))}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">History</h2>
        <ol className="space-y-2 border-l pl-4 text-sm">
          {[...order.timeline].reverse().map((entry) => (
            <li key={`${entry.status}-${entry.at}`} className="flex flex-wrap justify-between gap-x-4">
              <span className="font-medium">{LABELS[entry.status] ?? entry.status}</span>
              <span className="text-(--sf-muted) tabular-nums">{time.format(new Date(entry.at))}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Items</h2>
        <ul className="divide-y border-y text-sm">
          {order.items.map((item, i) => (
            <li key={`${item.name}-${i}`} className="flex items-baseline justify-between gap-4 py-2.5">
              <span className="min-w-0">
                <span className="font-medium">{item.name}</span>
                {item.attributes && (
                  <span className="ml-2 text-xs text-(--sf-muted)">
                    {Object.entries(item.attributes)
                      .map(([name, value]) => `${name}: ${value}`)
                      .join(" · ")}
                  </span>
                )}
              </span>
              <span className="shrink-0 tabular-nums text-(--sf-muted)">
                {item.quantity} × {formatMoney(item.price, currency)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-(--sf-muted)">Subtotal</dt><dd className="tabular-nums">{formatMoney(order.totals.subtotal, currency)}</dd></div>
          {order.totals.discount > 0 && (
            <div className="flex justify-between"><dt className="text-(--sf-muted)">Discount</dt><dd className="tabular-nums">−{formatMoney(order.totals.discount, currency)}</dd></div>
          )}
          <div className="flex justify-between"><dt className="text-(--sf-muted)">Delivery</dt><dd className="tabular-nums">{order.totals.delivery === 0 ? "Free" : formatMoney(order.totals.delivery, currency)}</dd></div>
          <div className="flex justify-between font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatMoney(order.totals.total, currency)}</dd></div>
        </dl>
      </section>

      <p className="text-sm text-(--sf-muted)">
        Delivering to {order.shipping.city}, {order.shipping.region}.
      </p>
    </div>
  );
}
