"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle2, PackageCheck, ReceiptText, Truck } from "lucide-react";
import { DataGrid, type ActionOutcome, type BulkAction, type RowAction } from "@/components/data-grid";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { StatusLabel } from "@/components/common/StatusLabel";
import { updateOrderStatusAction } from "@/lib/api/order/action";
import { orderColumns, orderStatuses } from "@/lib/api/order/grid";
import { canTransition, type Order, type OrderStatus } from "@/lib/api/order/types";
import { clientSource } from "@/lib/data-grid";
import { OrderDetail } from "./OrderDetail";

type SafeResult = { data?: unknown; serverError?: string } | undefined;

async function settle(results: Promise<SafeResult>[], message: string): Promise<ActionOutcome> {
  const settled = await Promise.all(results);
  const failed = settled.filter((result) => !result?.data);
  if (failed.length === 0) return { ok: true, message };
  return { ok: false, error: failed[0]?.serverError ?? `${failed.length} of ${settled.length} failed. Please try again.` };
}

function setStatus(order: Order, status: OrderStatus) {
  return updateOrderStatusAction({ id: order.id, status });
}

const label = (order: Order) => order.orderNumber;

export function OrdersGrid({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const source = useMemo(() => clientSource(orders), [orders]);

  // One forward step per row, so the common case is a single click. What is
  // offered comes from the API's own transition table — an illegal jump is a
  // 400, not something to discover by clicking.
  const rowActions: RowAction<Order>[] = [
    {
      id: "confirm",
      label: "Mark confirmed",
      icon: CheckCircle2,
      swipe: "leading",
      hidden: (order) => !canTransition(order.status, "confirmed"),
      optimistic: () => ({ status: "confirmed" as OrderStatus }),
      run: (order) => settle([setStatus(order, "confirmed")], `${label(order)} confirmed`),
    },
    {
      id: "ship",
      label: "Mark shipped",
      icon: Truck,
      swipe: "leading",
      hidden: (order) => !canTransition(order.status, "shipped"),
      optimistic: () => ({ status: "shipped" as OrderStatus }),
      run: (order) => settle([setStatus(order, "shipped")], `${label(order)} marked shipped`),
    },
    {
      id: "deliver",
      label: "Mark delivered",
      icon: PackageCheck,
      hidden: (order) => !canTransition(order.status, "delivered"),
      optimistic: () => ({ status: "delivered" as OrderStatus }),
      run: (order) => settle([setStatus(order, "delivered")], `${label(order)} delivered`),
    },
    {
      id: "cancel",
      label: "Cancel order",
      icon: Ban,
      tone: "destructive",
      swipe: "trailing",
      hidden: (order) => !canTransition(order.status, "cancelled"),
      confirm: (order) => ({
        title: `Cancel ${label(order)}?`,
        description: "Reserved stock is released. Refunds are handled with the payment provider.",
        confirmLabel: "Cancel order",
      }),
      optimistic: () => ({ status: "cancelled" as OrderStatus }),
      run: (order) => settle([setStatus(order, "cancelled")], `${label(order)} cancelled`),
    },
  ];

  const bulkActions: BulkAction<Order>[] = [
    {
      id: "confirm",
      label: "Mark confirmed",
      icon: CheckCircle2,
      optimistic: () => ({ status: "confirmed" as OrderStatus }),
      run: ({ rows }) => settle(rows.map((order) => setStatus(order, "confirmed")), `${rows.length} orders confirmed`),
    },
    {
      id: "ship",
      label: "Mark shipped",
      icon: Truck,
      optimistic: () => ({ status: "shipped" as OrderStatus }),
      run: ({ rows }) => settle(rows.map((order) => setStatus(order, "shipped")), `${rows.length} orders marked shipped`),
    },
  ];

  return (
    <DataGrid<Order>
      id="orders"
      noun={["order", "orders"]}
      columns={orderColumns}
      source={source}
      getRowId={(order) => order.id}
      workspace={{ icon: ReceiptText, render: (order) => <OrderDetail order={order} /> }}
      rowActions={rowActions}
      bulkActions={bulkActions}
      onMutated={() => router.refresh()}
      defaultQuery={{ sort: [{ id: "createdAt", desc: true }] }}
      cells={{
        orderNumber: (order) => <span className="font-medium">{label(order)}</span>,
        status: (order) => {
          const status = orderStatuses[order.status];
          return status ? <StatusLabel tone={status.tone}>{status.label}</StatusLabel> : <span>{order.status}</span>;
        },
      }}
      emptyState={
        <Empty className="border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ReceiptText />
            </EmptyMedia>
            <EmptyTitle>No orders yet</EmptyTitle>
            <EmptyDescription>Orders placed on your storefront show up here the moment checkout completes.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      }
    />
  );
}
