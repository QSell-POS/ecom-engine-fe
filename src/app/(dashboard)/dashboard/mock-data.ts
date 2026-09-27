// Mock analytics until the orders/analytics API exists.

export type Metric = {
  label: string;
  value: string;
  /** Signed percentage change vs the previous period. */
  change: number;
  /** Whether an increase is good for the business (refunds: no). */
  upIsGood: boolean;
};

export const metrics: Metric[] = [
  { label: "Revenue", value: "$48,290", change: 12.8, upIsGood: true },
  { label: "Orders", value: "1,284", change: 8.4, upIsGood: true },
  { label: "Customers", value: "8,549", change: 5.7, upIsGood: true },
  { label: "Refunds", value: "$1,240", change: -2.1, upIsGood: false },
];

export const revenueByMonth = [
  { month: "Oct", revenue: 21400 },
  { month: "Nov", revenue: 28050 },
  { month: "Dec", revenue: 24480 },
  { month: "Jan", revenue: 34680 },
  { month: "Feb", revenue: 29580 },
  { month: "Mar", revenue: 38760 },
  { month: "Apr", revenue: 32640 },
  { month: "May", revenue: 41820 },
  { month: "Jun", revenue: 36720 },
  { month: "Jul", revenue: 46920 },
  { month: "Aug", revenue: 39780 },
  { month: "Sep", revenue: 48290 },
];

export type OrderStatus = "Paid" | "Pending" | "Refunded";

export const orders: { id: string; customer: string; product: string; amount: string; status: OrderStatus; placedAt: string }[] = [
  { id: "#10482", customer: "Olivia Martin", product: "Canvas weekender", amount: "$248.00", status: "Paid", placedAt: "12 min ago" },
  { id: "#10481", customer: "Jackson Lee", product: "Everyday sneakers", amount: "$129.00", status: "Paid", placedAt: "38 min ago" },
  { id: "#10480", customer: "Isabella Chen", product: "Linen overshirt", amount: "$96.00", status: "Pending", placedAt: "1 hr ago" },
  { id: "#10479", customer: "Ethan Wilson", product: "Leather card holder", amount: "$64.00", status: "Paid", placedAt: "3 hr ago" },
  { id: "#10478", customer: "Mia Robinson", product: "Studio ceramic mug", amount: "$28.00", status: "Refunded", placedAt: "5 hr ago" },
];

export const lowStock = [
  { name: "Canvas weekender", stock: 0, threshold: 10 },
  { name: "Studio ceramic mug", stock: 4, threshold: 10 },
  { name: "Everyday sneakers", stock: 7, threshold: 10 },
];
