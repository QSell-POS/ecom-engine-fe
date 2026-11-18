"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { DataGrid } from "@/components/data-grid";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { StatusLabel } from "@/components/common/StatusLabel";
import { returnColumns, returnStatuses } from "@/lib/api/returns/grid";
import type { OrderReturn } from "@/lib/api/returns/types";
import { clientSource } from "@/lib/data-grid";
import { ReturnCard } from "./ReturnCard";

/** The returns desk: customer requests to review, and every return the store has handled. */
export function ReturnsGrid({ returns }: { returns: OrderReturn[] }) {
  const router = useRouter();
  const source = useMemo(() => clientSource(returns), [returns]);

  return (
    <DataGrid<OrderReturn>
      id="returns"
      noun={["return", "returns"]}
      columns={returnColumns}
      source={source}
      getRowId={(rma) => rma.id}
      workspace={{
        icon: RotateCcw,
        render: (rma) => (
          <div className="max-w-3xl">
            <ReturnCard rma={rma} showOrder onChanged={() => router.refresh()} />
          </div>
        ),
      }}
      onMutated={() => router.refresh()}
      defaultQuery={{ sort: [{ id: "createdAt", desc: true }] }}
      cells={{
        returnNumber: (rma) => <span className="font-medium">{rma.returnNumber}</span>,
        status: (rma) => {
          const status = returnStatuses[rma.status];
          return <StatusLabel tone={status.tone}>{status.label}</StatusLabel>;
        },
      }}
      emptyState={
        <Empty className="border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RotateCcw />
            </EmptyMedia>
            <EmptyTitle>No returns yet</EmptyTitle>
            <EmptyDescription>
              Return and exchange requests from your storefront land here. To return an order taken in a chat or at the counter, open the
              order and choose &ldquo;New return / exchange&rdquo;.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      }
    />
  );
}
