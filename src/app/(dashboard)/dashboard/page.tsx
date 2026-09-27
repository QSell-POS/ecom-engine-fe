import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusLabel, type StatusTone } from "@/components/common/StatusLabel";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { lowStock, metrics, orders, revenueByMonth, type Metric, type OrderStatus } from "./mock-data";

export const metadata: Metadata = { title: "Dashboard" };

const ORDER_TONE: Record<OrderStatus, StatusTone> = { Paid: "success", Pending: "warning", Refunded: "neutral" };

function StatTile({ metric }: { metric: Metric }) {
  const up = metric.change >= 0;
  const good = up === metric.upIsGood;
  const Arrow = up ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="space-y-1.5 bg-card px-5 py-4">
      <p className="text-sm text-muted-foreground">{metric.label}</p>
      <p className="text-2xl font-semibold tracking-tight">{metric.value}</p>
      <p className="flex items-center gap-1 text-sm">
        <span className={cn("inline-flex items-center gap-0.5 font-medium", good ? "text-success" : "text-destructive")}>
          <Arrow className="size-3.5" aria-hidden />
          {up ? "+" : "−"}
          {Math.abs(metric.change)}%
        </span>
        <span className="text-muted-foreground">vs last month</span>
      </p>
    </div>
  );
}

function Panel({ title, description, action, children, className }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-md border bg-card", className)}>
      <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-1 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {children} <ArrowRight className="size-3.5" />
    </Link>
  );
}

export default function DashboardPage() {
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  return (
    <>
      <PageHeader title="Overview" description={`${today} · Here's how your store is doing this month.`} />

      <div className="space-y-6">
        <section aria-label="Key metrics" className="grid gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <StatTile key={metric.label} metric={metric} />
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Panel title="Revenue" description="Last 12 months">
            <div className="px-3 pb-4">
              <RevenueChart data={revenueByMonth} />
            </div>
          </Panel>

          <Panel title="Low stock" description="Products at or below their alert level" action={<PanelLink href="/products">Products</PanelLink>}>
            <ul className="divide-y border-t">
              {lowStock.map((item) => (
                <li key={item.name} className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm">
                  <span className="truncate font-medium">{item.name}</span>
                  {item.stock === 0 ? (
                    <StatusLabel tone="danger">Out of stock</StatusLabel>
                  ) : (
                    <StatusLabel tone="warning">{item.stock} left</StatusLabel>
                  )}
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel title="Recent orders" description="The latest orders placed in your store">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-9 pl-5 text-xs font-medium text-muted-foreground">Order</TableHead>
                <TableHead className="h-9 px-4 text-xs font-medium text-muted-foreground">Customer</TableHead>
                <TableHead className="h-9 px-4 text-xs font-medium text-muted-foreground">Status</TableHead>
                <TableHead className="h-9 px-4 text-xs font-medium text-muted-foreground">Placed</TableHead>
                <TableHead className="h-9 pr-5 text-right text-xs font-medium text-muted-foreground">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="py-3 pl-5 font-medium tabular-nums">{order.id}</TableCell>
                  <TableCell className="px-4 py-3">
                    <p>{order.customer}</p>
                    <p className="text-muted-foreground">{order.product}</p>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <StatusLabel tone={ORDER_TONE[order.status]}>{order.status}</StatusLabel>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground">{order.placedAt}</TableCell>
                  <TableCell className="py-3 pr-5 text-right font-medium tabular-nums">{order.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      </div>
    </>
  );
}
