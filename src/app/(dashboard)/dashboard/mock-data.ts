import {
  CircleDollarSign,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";

export const metrics = [
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

export const orders = [
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

export const inventory = [
  { name: "Canvas weekender", stock: 4, color: "bg-orange-500" },
  { name: "Studio ceramic mug", stock: 7, color: "bg-amber-500" },
  { name: "Everyday sneakers", stock: 9, color: "bg-yellow-500" },
];

export const chartBars = [42, 55, 48, 68, 58, 76, 64, 82, 72, 92, 78, 96];

export const months = [
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
