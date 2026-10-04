import Link from "next/link";
import { DetailFields, DetailSection, DetailStats } from "@/components/data-grid";
import { StatusLabel } from "@/components/common/StatusLabel";
import { formatAddress } from "@/lib/api/shared/types";
import { orderCustomerName, orderItemCount, paymentMethodLabel, type Order } from "@/lib/api/order/types";
import { orderStatuses } from "@/lib/api/order/grid";
import { formatMoney } from "@/lib/constants/money";

const dateTime = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const when = (value?: string) => (value ? dateTime.format(new Date(value)) : null);

/**
 * Order record body. Line items render from their snapshots, not from the
 * live product: that is what keeps order history true after a catalog edit.
 */
export function OrderDetail({ order }: { order: Order }) {
  const status = orderStatuses[order.status];
  const items = order.items ?? [];

  return (
    <div className="max-w-3xl space-y-10">
      <DetailStats
        items={[
          { label: "Total", value: formatMoney(order.totalAmount) },
          { label: "Items", value: orderItemCount(order) },
          { label: "Status", value: status ? <StatusLabel tone={status.tone}>{status.label}</StatusLabel> : order.status },
          { label: "Payment", value: paymentMethodLabel(order.paymentMethod) },
        ]}
      />

      <DetailSection title="Items">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No line items on this order.</p>
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
            ["Discount", order.discountAmount ? `− ${formatMoney(order.discountAmount)}` : null],
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
              View customer
            </Link>
          ) : undefined
        }
      >
        <DetailFields
          items={[
            ["Name", orderCustomerName(order)],
            ["Email", order.customer?.email],
            ["Phone", order.customer?.phone],
            ["Ships to", formatAddress(order.address)],
          ]}
        />
      </DetailSection>

      <DetailSection title="Activity">
        <DetailFields
          items={[
            ["Channel", order.channel],
            ["Placed", when(order.createdAt)],
            ["Updated", when(order.updatedAt)],
          ]}
        />
      </DetailSection>
    </div>
  );
}
