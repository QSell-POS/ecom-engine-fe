import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  CircleDollarSign,
  Clock3,
  MoreHorizontal,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";

const metrics = [
  {
    label: "Total revenue",
    value: "$48,290",
    change: "+12.8%",
    icon: CircleDollarSign,
    tone: "bg-emerald-50 text-emerald-600",
    positive: true,
  },
  {
    label: "Orders",
    value: "1,284",
    change: "+8.4%",
    icon: ShoppingCart,
    tone: "bg-blue-50 text-blue-600",
    positive: true,
  },
  {
    label: "Customers",
    value: "8,549",
    change: "+5.7%",
    icon: Users,
    tone: "bg-violet-50 text-violet-600",
    positive: true,
  },
  {
    label: "Refunds",
    value: "$1,240",
    change: "-2.1%",
    icon: Package,
    tone: "bg-orange-50 text-orange-600",
    positive: false,
  },
];

const orders = [
  {
    id: "#10482",
    customer: "Olivia Martin",
    product: "Canvas weekender",
    amount: "$248.00",
    status: "Paid",
  },
  {
    id: "#10481",
    customer: "Jackson Lee",
    product: "Everyday sneakers",
    amount: "$129.00",
    status: "Paid",
  },
  {
    id: "#10480",
    customer: "Isabella Chen",
    product: "Linen overshirt",
    amount: "$96.00",
    status: "Pending",
  },
  {
    id: "#10479",
    customer: "Ethan Wilson",
    product: "Leather card holder",
    amount: "$64.00",
    status: "Paid",
  },
];

const inventory = [
  { name: "Canvas weekender", stock: 4, color: "bg-orange-500" },
  { name: "Studio ceramic mug", stock: 7, color: "bg-amber-500" },
  { name: "Everyday sneakers", stock: 9, color: "bg-yellow-500" },
];

const chartBars = [42, 55, 48, 68, 58, 76, 64, 82, 72, 92, 78, 96];
const months = [
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
];

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
        <button className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800">
          Download report
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const ChangeIcon = metric.positive ? ArrowUpRight : ArrowDownRight;

          return (
            <article
              key={metric.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex size-10 items-center justify-center rounded-lg ${metric.tone}`}
                >
                  <Icon className="size-5" />
                </div>
                <button
                  aria-label={`More options for ${metric.label}`}
                  className="text-slate-400 transition hover:text-slate-700"
                >
                  <MoreHorizontal className="size-5" />
                </button>
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
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
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
            <select
              defaultValue="12-months"
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-slate-400"
            >
              <option value="12-months">Last 12 months</option>
              <option value="30-days">Last 30 days</option>
              <option value="7-days">Last 7 days</option>
            </select>
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
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
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
            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
              3 items
            </span>
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
          <button className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            View inventory <ArrowUpRight className="size-4" />
          </button>
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-semibold text-slate-950">Recent orders</h2>
            <p className="mt-1 text-sm text-slate-500">
              The latest activity from your store
            </p>
          </div>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
            View all
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Order</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">
                  <span className="sr-only">Time</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id} className="transition hover:bg-slate-50/80">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {order.id}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{order.customer}</td>
                  <td className="px-6 py-4 text-slate-600">{order.product}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {order.amount}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${order.status === "Paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-400">
                    <Clock3 className="ml-auto size-4" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
