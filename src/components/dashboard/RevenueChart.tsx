"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const config = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig;

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

// Single series: past months recede in a neutral step, the current month
// carries the accent. The table below is the non-visual equivalent.
export function RevenueChart({ data }: { data: { month: string; revenue: number }[] }) {
  const lastIndex = data.length - 1;

  return (
    <>
      <ChartContainer config={config} className="aspect-auto h-64 w-full">
        <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }} barCategoryGap={4}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={44}
            tickMargin={4}
            tickFormatter={(value: number) => `$${compact.format(value)}`}
          />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", opacity: 0.6 }}
            content={
              <ChartTooltipContent
                hideIndicator
                formatter={(value) => <span className="font-medium tabular-nums">{money.format(Number(value))}</span>}
              />
            }
          />
          <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false}>
            {data.map((entry, index) => (
              <Cell key={entry.month} fill={index === lastIndex ? "var(--chart-1)" : "var(--chart-5)"} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      <table className="sr-only">
        <caption>Monthly revenue, last 12 months</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.month}>
              <th scope="row">{row.month}</th>
              <td>{money.format(row.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
