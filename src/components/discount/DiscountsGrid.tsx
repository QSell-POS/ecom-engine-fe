"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, CircleSlash, Pencil, TicketPercent } from "lucide-react";
import { DataGrid, DetailFields, DetailSection, type ActionOutcome, type BulkAction, type RowAction } from "@/components/data-grid";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { StatusLabel } from "@/components/common/StatusLabel";
import { updateDiscountAction } from "@/lib/api/discount/action";
import { discountColumns, discountStates } from "@/lib/api/discount/grid";
import { DISCOUNT_TYPE_LABELS, discountState, type Discount } from "@/lib/api/discount/types";
import { clientSource } from "@/lib/data-grid";
import { formatMoney } from "@/lib/constants/money";
import { CreateDiscountButton, DiscountFormDialog } from "./DiscountFormDialog";

type SafeResult = { data?: unknown; serverError?: string } | undefined;

async function settle(results: Promise<SafeResult>[], message: string): Promise<ActionOutcome> {
  const settled = await Promise.all(results);
  const failed = settled.filter((result) => !result?.data);
  if (failed.length === 0) return { ok: true, message };
  return { ok: false, error: failed[0]?.serverError ?? `${failed.length} of ${settled.length} failed. Please try again.` };
}

const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
const on = (value?: string | null) => (value ? date.format(new Date(value)) : null);

function DiscountDetail({ discount }: { discount: Discount }) {
  const state = discountStates[discountState(discount)];
  return (
    <div className="max-w-2xl space-y-10">
      <DetailSection title="Offer">
        <DetailFields
          items={[
            ["Code", <span key="code" className="font-mono">{discount.code}</span>],
            ["Type", DISCOUNT_TYPE_LABELS[discount.type] ?? discount.type],
            ["Amount", discount.type === "percentage" ? `${discount.discountValue}%` : formatMoney(discount.discountValue)],
            ["Status", <StatusLabel key="state" tone={state.tone}>{state.label}</StatusLabel>],
            ["Offer", discount.name],
            ["Note", discount.description],
          ]}
        />
      </DetailSection>
      <DetailSection title="Conditions">
        <DetailFields
          items={[
            ["Applies to", "Whole order"],
            ["Total uses", discount.maxTotalUses ? `${discount.timesUsed ?? 0} of ${discount.maxTotalUses}` : `${discount.timesUsed ?? 0} (unlimited)`],
            ["Per customer", discount.maxUsesPerCustomer ?? null],
            ["Starts", on(discount.startsAt)],
            ["Ends", on(discount.endsAt)],
          ]}
        />
      </DetailSection>
    </div>
  );
}

export function DiscountsGrid({ discounts }: { discounts: Discount[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Discount | null>(null);
  const source = useMemo(() => clientSource(discounts), [discounts]);

  // There is no DELETE for discounts, so retiring a code is isActive: false.
  const setActive = (discount: Discount, isActive: boolean) => updateDiscountAction({ id: discount.id, isActive });

  const rowActions: RowAction<Discount>[] = [
    { id: "edit", label: "Edit", icon: Pencil, swipe: "leading", run: (discount) => setEditing(discount) },
    {
      id: "disable",
      label: "Disable",
      icon: CircleSlash,
      hidden: (discount) => discount.isActive === false,
      optimistic: () => ({ isActive: false }),
      run: (discount) => settle([setActive(discount, false)], `${discount.code} disabled`),
    },
    {
      id: "enable",
      label: "Enable",
      icon: CircleCheck,
      hidden: (discount) => discount.isActive !== false,
      optimistic: () => ({ isActive: true }),
      run: (discount) => settle([setActive(discount, true)], `${discount.code} enabled`),
    },
  ];

  const bulkActions: BulkAction<Discount>[] = [
    { id: "enable", label: "Enable", icon: CircleCheck, optimistic: () => ({ isActive: true }), run: ({ rows }) => settle(rows.map((d) => setActive(d, true)), `${rows.length} codes enabled`) },
    { id: "disable", label: "Disable", icon: CircleSlash, optimistic: () => ({ isActive: false }), run: ({ rows }) => settle(rows.map((d) => setActive(d, false)), `${rows.length} codes disabled`) },
  ];

  return (
    <>
      <DataGrid<Discount>
        id="discounts"
        noun={["discount", "discounts"]}
        columns={discountColumns}
        source={source}
        getRowId={(discount) => discount.id}
        workspace={{ icon: TicketPercent, render: (discount) => <DiscountDetail discount={discount} /> }}
        rowActions={rowActions}
        bulkActions={bulkActions}
        onMutated={() => router.refresh()}
        cells={{
          code: (discount) => <span className="font-mono font-medium">{discount.code}</span>,
          state: (discount) => {
            const state = discountStates[discountState(discount)];
            return <StatusLabel tone={state.tone}>{state.label}</StatusLabel>;
          },
        }}
        emptyState={
          <Empty className="border py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TicketPercent />
              </EmptyMedia>
              <EmptyTitle>No discount codes</EmptyTitle>
              <EmptyDescription>Create a code to run a sale, reward loyal shoppers or win back carts.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <CreateDiscountButton />
            </EmptyContent>
          </Empty>
        }
      />
      {editing && (
        <DiscountFormDialog
          key={editing.id}
          discount={editing}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        />
      )}
    </>
  );
}
