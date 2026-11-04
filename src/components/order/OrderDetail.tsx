import Link from "next/link";
import { DetailFields, DetailSection, DetailStats } from "@/components/data-grid";
import { StatusLabel } from "@/components/common/StatusLabel";
import { toAmount } from "@/lib/api/shared/types";
import { ORDER_CHANNEL_LABELS, orderCustomerName, orderItemCount, orderShipsTo, paymentMethodLabel, type Order } from "@/lib/api/order/types";
import { orderStatuses, paymentStatuses } from "@/lib/api/order/grid";
import { formatMoney } from "@/lib/constants/money";

const dateTime = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const when = (value?: string) => (value ? dateTime.format(new Date(value)) : null);

/**
 * Order record body. Lines render from their snapshots, not the live product,
 * and the shipping address is the snapshot the order was charged against.
 */
export function OrderDetail({ order }: { order: Order }) {
  const status = orderStatuses[order.status];
  const payment = order.paymentStatus ? paymentStatuses[order.paymentStatus] : undefined;
  const items = order.items ?? [];

  return (
    <div className="max-w-3xl space-y-10">
      <DetailStats
        items={[
          { label: "Total", value: formatMoney(order.totalAmount) },
          { label: "Items", value: orderItemCount(order) },
          { label: "Status", value: status ? <StatusLabel tone={status.tone}>{status.label}</StatusLabel> : order.status },
          {
            label: "Payment",
            value: (
              <span className="flex flex-col gap-0.5">
                {payment && <StatusLabel tone={payment.tone}>{payment.label}</StatusLabel>}
                <span className={payment ? "text-xs text-muted-foreground" : undefined}>{paymentMethodLabel(order.paymentMethod)}</span>
              </span>
            ),
          },
        ]}
      />

      <DetailSection title="Items">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            This view carries no line items. Open the order on its own to load them.
          </p>
        ) : (
          <ul className="divide-y border-y text-sm">
            {items.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-4 py-2.5">
                <span className="min-w-0">
                  <span className="font-medium">{item.productNameSnapshot}</span>
                  {item.productSkuSnapshot && <span className="ml-2 font-mono text-xs text-muted-foreground">{item.productSkuSnapshot}</span>}
                  {item.attributesSnapshot && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {Object.entries(item.attributesSnapshot)
                        .map(([name, value]) => `${name}: ${value}`)
                        .join(" · ")}
                    </span>
                  )}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {item.quantity} × {formatMoney(item.priceSnapshot)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Totals">
        <DetailFields
          items={[
            ["Subtotal", formatMoney(order.subtotalAmount)],
            ["Discount", toAmount(order.discountAmount) > 0 ? `− ${formatMoney(order.discountAmount)}` : null],
            ["Delivery", order.deliveryCharge === undefined ? null : formatMoney(order.deliveryCharge)],
            ["Total", <span key="total" className="font-semibold">{formatMoney(order.totalAmount)}</span>],
          ]}
        />
      </DetailSection>

      <DetailSection
        title="Customer"
        action={
          order.customerId ? (
            <Link href={`/customers?open=${order.customerId}`} className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              View profile
            </Link>
          ) : undefined
        }
      >
        <DetailFields
          items={[
            [
              "Name",
              order.customer ? (
                <Link key="name" href={`/customers?open=${order.customer.id}`} className="underline-offset-4 hover:underline">
                  {orderCustomerName(order)}
                </Link>
              ) : null,
            ],
            ["Email", order.customer?.email ? <a key="email" href={`mailto:${order.customer.email}`} className="underline-offset-4 hover:underline">{order.customer.email}</a> : null],
            ["Phone", order.customer?.phone ? <a key="phone" href={`tel:${order.customer.phone}`} className="underline-offset-4 hover:underline">{order.customer.phone}</a> : null],
          ]}
        />
      </DetailSection>

      <DetailSection title="Delivery">
        <DetailFields
          items={[
            ["Ships to", orderShipsTo(order)],
            ["Note", order.customerNotes],
          ]}
        />
      </DetailSection>

      <DetailSection title="Activity">
        <DetailFields
          items={[
            ["Channel", order.channel ? ORDER_CHANNEL_LABELS[order.channel] ?? order.channel : null],
            ["From chat", order.conversationId ? <Link key="chat" href={`/chat?open=${order.conversationId}`} className="underline-offset-4 hover:underline">Open conversation</Link> : null],
            ["Placed", when(order.createdAt)],
            ["Updated", when(order.updatedAt)],
          ]}
        />
      </DetailSection>
    </div>
  );
}
