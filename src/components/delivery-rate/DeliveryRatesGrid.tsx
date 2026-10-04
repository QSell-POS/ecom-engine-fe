"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, CircleSlash, Pencil, Trash2, Truck } from "lucide-react";
import { DataGrid, type ActionOutcome, type BulkAction, type RowAction } from "@/components/data-grid";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { StatusLabel } from "@/components/common/StatusLabel";
import { deleteDeliveryRateAction, updateDeliveryRateAction } from "@/lib/api/delivery-rate/action";
import { deliveryRateColumns, rateStatuses } from "@/lib/api/delivery-rate/grid";
import { deliveryZone, type DeliveryRate } from "@/lib/api/delivery-rate/types";
import { clientSource } from "@/lib/data-grid";
import { CreateDeliveryRateButton, DeliveryRateFormDialog } from "./DeliveryRateFormDialog";

type SafeResult = { data?: unknown; serverError?: string } | undefined;

async function settle(results: Promise<SafeResult>[], message: string): Promise<ActionOutcome> {
  const settled = await Promise.all(results);
  const failed = settled.filter((result) => !result?.data);
  if (failed.length === 0) return { ok: true, message };
  return { ok: false, error: failed[0]?.serverError ?? `${failed.length} of ${settled.length} failed. Please try again.` };
}

export function DeliveryRatesGrid({ rates }: { rates: DeliveryRate[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<DeliveryRate | null>(null);
  const source = useMemo(() => clientSource(rates), [rates]);

  const setActive = (rate: DeliveryRate, isActive: boolean) => updateDeliveryRateAction({ id: rate.id, isActive });

  const rowActions: RowAction<DeliveryRate>[] = [
    { id: "edit", label: "Edit", icon: Pencil, swipe: "leading", run: (rate) => setEditing(rate) },
    {
      id: "deactivate",
      label: "Deactivate",
      icon: CircleSlash,
      hidden: (rate) => rate.isActive === false,
      optimistic: () => ({ isActive: false }),
      run: (rate) => settle([setActive(rate, false)], `${deliveryZone(rate)} deactivated`),
    },
    {
      id: "activate",
      label: "Activate",
      icon: CircleCheck,
      hidden: (rate) => rate.isActive !== false,
      optimistic: () => ({ isActive: true }),
      run: (rate) => settle([setActive(rate, true)], `${deliveryZone(rate)} activated`),
    },
    {
      id: "delete",
      label: "Delete",
      icon: Trash2,
      tone: "destructive",
      swipe: "trailing",
      confirm: (rate) => ({
        title: `Delete the rate for ${deliveryZone(rate)}?`,
        description: "Checkout falls back to whichever other rate matches the address.",
        confirmLabel: "Delete rate",
      }),
      optimistic: "remove",
      run: (rate) => settle([deleteDeliveryRateAction({ id: rate.id })], `${deliveryZone(rate)} deleted`),
    },
  ];

  const bulkActions: BulkAction<DeliveryRate>[] = [
    {
      id: "delete",
      label: "Delete",
      icon: Trash2,
      tone: "destructive",
      confirm: (count) => ({ title: `Delete ${count} ${count === 1 ? "rate" : "rates"}?`, description: "This cannot be undone.", confirmLabel: "Delete" }),
      optimistic: "remove",
      run: ({ rows }) => settle(rows.map((rate) => deleteDeliveryRateAction({ id: rate.id })), `${rows.length} rates deleted`),
    },
  ];

  return (
    <>
      <DataGrid<DeliveryRate>
        id="delivery-rates"
        noun={["rate", "rates"]}
        columns={deliveryRateColumns}
        source={source}
        getRowId={(rate) => rate.id}
        rowActions={rowActions}
        bulkActions={bulkActions}
        onRowOpen={(rate) => setEditing(rate)}
        onMutated={() => router.refresh()}
        cells={{
          region: (rate) => <span className="font-medium">{rate.region}</span>,
          status: (rate) => {
            const status = rateStatuses[rate.isActive === false ? "inactive" : "active"];
            return <StatusLabel tone={status.tone}>{status.label}</StatusLabel>;
          },
        }}
        emptyState={
          <Empty className="border py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Truck />
              </EmptyMedia>
              <EmptyTitle>No delivery rates</EmptyTitle>
              <EmptyDescription>Add at least one rate, or checkout cannot quote shipping.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <CreateDeliveryRateButton />
            </EmptyContent>
          </Empty>
        }
      />
      {editing && (
        <DeliveryRateFormDialog
          key={editing.id}
          rate={editing}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        />
      )}
    </>
  );
}
