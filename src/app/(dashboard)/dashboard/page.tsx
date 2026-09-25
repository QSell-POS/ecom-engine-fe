import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  Clock3,
  MoreHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { chartBars, inventory, metrics, months, orders } from "./mock-data";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-2 pb-8 sm:p-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Thursday, September 17, 2026
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            Good morning, Alex
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here is what is happening with your store today.
          </p>
        </div>
        <Button size="lg">Download report</Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const ChangeIcon = metric.positive ? ArrowUpRight : ArrowDownRight;

          return (
            <Card key={metric.label} className="p-5">
              <div className="flex items-start justify-between">
                <div
                  className={`flex size-10 items-center justify-center rounded-lg ${metric.tone}`}
                >
                  <Icon className="size-5" />
                </div>
                <Button
                  aria-label={`More options for ${metric.label}`}
                  variant="ghost"
                  size="icon"
                >
                  <MoreHorizontal className="size-5" />
                </Button>
              </div>
              <p className="mt-5 text-sm text-slate-500">{metric.label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                {metric.value}
              </p>
              <p
                className={`mt-2 flex items-center gap-1 text-xs font-medium ${metric.positive ? "text-emerald-600" : "text-orange-600"}`}
              >
                <ChangeIcon className="size-3.5" />
                {metric.change}{" "}
                <span className="font-normal text-slate-400">
                  vs. last month
                </span>
              </p>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-slate-400" />
                <h2 className="font-semibold text-slate-950">
                  Revenue overview
                </h2>
              </div>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                $48,290.00
              </p>
              <p className="mt-1 text-sm text-emerald-600">
                +12.8% <span className="text-slate-400">from last month</span>
              </p>
            </div>
            <Select defaultValue="12-months">
              <SelectTrigger className="h-9 w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12-months">Last 12 months</SelectItem>
                <SelectItem value="30-days">Last 30 days</SelectItem>
                <SelectItem value="7-days">Last 7 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-8 flex h-56 items-end gap-2 border-b border-l border-slate-200 px-3 pb-0 pt-4 sm:gap-4">
            {chartBars.map((height, index) => (
              <div key={index} className="group flex h-full flex-1 items-end">
                <div
                  className="relative w-full rounded-t-sm bg-blue-100 transition-colors group-hover:bg-blue-500"
                  style={{ height: `${height}%` }}
                >
                  <span className="absolute -top-7 left-1/2 hidden -translate-x-1/2 rounded bg-slate-900 px-1.5 py-1 text-[10px] text-white group-hover:block">
                    ${Math.round(height * 510)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between pl-3 text-xs text-slate-400">
            {months.map((month) => (
              <span key={month}>{month}</span>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Boxes className="size-4 text-slate-400" />
                <h2 className="font-semibold text-slate-950">
                  Inventory alerts
                </h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Products that need attention
              </p>
            </div>
            <Badge className="bg-orange-50 text-orange-700 hover:bg-orange-50">
              3 items
            </Badge>
          </div>
          <div className="mt-6 space-y-5">
            {inventory.map((item) => (
              <div key={item.name}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-700">
                    {item.name}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {item.stock} left
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${item.stock * 7}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="mt-7 w-full">
            View inventory <ArrowUpRight className="size-4" />
          </Button>
        </Card>
      </section>

      <Card className="p-0">
        <CardHeader className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-semibold text-slate-950">Recent orders</h2>
            <p className="mt-1 text-sm text-slate-500">
              The latest activity from your store
            </p>
          </div>
          <Button variant="link" className="px-0">
            View all
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Time</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium text-slate-900">
                    {order.id}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {order.customer}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {order.product}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {order.amount}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        order.status === "Paid"
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                          : "bg-amber-50 text-amber-700 hover:bg-amber-50"
                      }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-slate-400">
                    <Clock3 className="ml-auto size-4" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
