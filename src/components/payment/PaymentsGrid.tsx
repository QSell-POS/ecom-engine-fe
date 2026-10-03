"use client";

import { useMemo } from "react";
import { CreditCard } from "lucide-react";
import { DataGrid, DetailFields, DetailSection, DetailStats } from "@/components/data-grid";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { StatusLabel } from "@/components/common/StatusLabel";
import { paymentColumns, paymentStatuses } from "@/lib/api/payment/grid";
import type { Payment } from "@/lib/api/payment/types";
import { paymentMethodLabel } from "@/lib/api/order/types";
import { clientSource } from "@/lib/data-grid";
import { formatMoney } from "@/lib/constants/money";

const dateTime = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const when = (value?: string) => (value ? dateTime.format(new Date(value)) : null);

// Read-only by design: the API owns payment state, and the providers own the
// money. Refunds happen in the eSewa/Khalti dashboards.
function PaymentDetail({ payment }: { payment: Payment }) {
  const status = paymentStatuses[payment.status];

  return (
    <div className="max-w-3xl space-y-10">
      <DetailStats
        items={[
          { label: "Amount", value: formatMoney(payment.amount) },
          { label: "Method", value: paymentMethodLabel(payment.method) },
          { label: "Status", value: status ? <StatusLabel tone={status.tone}>{status.label}</StatusLabel> : payment.status },
          { label: "Paid", value: payment.paidAt ? when(payment.paidAt) : "—" },
        ]}
      />
      <DetailSection title="Reconciliation">
        <DetailFields
          items={[
            ["Order", payment.orderNumber ?? payment.orderId],
            ["Customer", payment.customerId],
            ["Transaction id", payment.transactionId && <span className="font-mono text-[13px]">{payment.transactionId}</span>],
            ["Gateway reference", payment.gatewayReference && <span className="font-mono text-[13px]">{payment.gatewayReference}</span>],
            ["Failure reason", payment.failureReason],
          ]}
        />
      </DetailSection>
      <DetailSection title="Activity">
        <DetailFields items={[["Created", when(payment.createdAt)], ["Updated", when(payment.updatedAt)]]} />
      </DetailSection>
    </div>
  );
}

export function PaymentsGrid({ payments }: { payments: Payment[] }) {
  const source = useMemo(() => clientSource(payments), [payments]);

  return (
    <DataGrid<Payment>
      id="payments"
      noun={["payment", "payments"]}
      columns={paymentColumns}
      source={source}
      getRowId={(payment) => payment.id}
      workspace={{ icon: CreditCard, render: (payment) => <PaymentDetail payment={payment} /> }}
      defaultQuery={{ sort: [{ id: "createdAt", desc: true }] }}
      cells={{
        status: (payment) => {
          const status = paymentStatuses[payment.status];
          return status ? <StatusLabel tone={status.tone}>{status.label}</StatusLabel> : <span>{payment.status}</span>;
        },
      }}
      emptyState={
        <Empty className="border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CreditCard />
            </EmptyMedia>
            <EmptyTitle>No payments yet</EmptyTitle>
            <EmptyDescription>Every eSewa and Khalti attempt lands here, successful or not.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      }
    />
  );
}
