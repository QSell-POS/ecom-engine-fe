import Link from "next/link";
import { DetailFields, DetailSection, DetailStats } from "@/components/data-grid";
import { StatusLabel } from "@/components/common/StatusLabel";
import { customerName, type Customer } from "@/lib/api/customer/types";
import { customerStatuses } from "@/lib/api/customer/grid";
import { formatMoney } from "@/lib/constants/money";

const dateTime = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const when = (value?: string) => (value ? dateTime.format(new Date(value)) : null);

export function CustomerDetail({ customer }: { customer: Customer }) {
  const status = customerStatuses[customer.status];

  return (
    <div className="max-w-3xl space-y-10">
      <DetailStats
        items={[
          { label: "Orders", value: customer.ordersCount ?? 0 },
          { label: "Spent", value: formatMoney(customer.totalSpent ?? 0) },
          { label: "Status", value: <StatusLabel tone={status.tone}>{status.label}</StatusLabel> },
          { label: "Last order", value: customer.lastOrderAt ? when(customer.lastOrderAt) : "Never" },
        ]}
      />

      <DetailSection
        title="Contact"
        action={
          <Link href={`/orders?q=${encodeURIComponent(customer.email)}`} className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            View orders
          </Link>
        }
      >
        <DetailFields
          items={[
            ["Name", customerName(customer)],
            ["Email", customer.email],
            ["Phone", customer.phone],
          ]}
        />
      </DetailSection>

      <DetailSection title="Activity">
        <DetailFields
          items={[
            ["Joined", when(customer.createdAt)],
            ["Updated", when(customer.updatedAt)],
          ]}
        />
      </DetailSection>
    </div>
  );
}
