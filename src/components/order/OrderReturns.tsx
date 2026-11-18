"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailSection } from "@/components/data-grid";
import { useCan } from "@/components/auth/PermissionsProvider";
import { ReturnCard } from "@/components/returns/ReturnCard";
import { CreateReturnDialog } from "@/components/returns/ReturnDialogs";
import { loadOrderReturnsAction } from "@/lib/api/returns/action";
import type { OrderReturnsSummary } from "@/lib/api/returns/types";
import type { Order } from "@/lib/api/order/types";
import { formatMoney } from "@/lib/constants/money";

/**
 * Returns, refunds and exchanges on this order. Shown for delivered orders and
 * any order that already has returns; admins can open one on any delivered
 * order, whatever channel it came from.
 */
export function OrderReturns({ order }: { order: Order }) {
  const router = useRouter();
  const canUpdate = useCan("orders:update");
  const [summary, setSummary] = useState<OrderReturnsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const relevant = order.status === "delivered" || order.status === "refunded";

  const load = useCallback(async () => {
    const result = await loadOrderReturnsAction({ orderId: order.id });
    if (result?.data) {
      setSummary(result.data.summary);
      setError(null);
    } else setError(result?.serverError ?? "Couldn't load returns");
  }, [order.id]);

  useEffect(() => {
    if (!relevant) return;
    let cancelled = false;
    void loadOrderReturnsAction({ orderId: order.id }).then((result) => {
      if (cancelled) return;
      if (result?.data) setSummary(result.data.summary);
      else setError(result?.serverError ?? "Couldn't load returns");
    });
    return () => {
      cancelled = true;
    };
  }, [order.id, relevant]);

  if (!relevant) return null;

  const changed = () => {
    void load();
    router.refresh();
  };

  return (
    <DetailSection
      title="Returns & exchanges"
      action={
        canUpdate && summary?.eligibility.eligible ? (
          <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
            <RotateCcw /> New return / exchange
          </Button>
        ) : undefined
      }
    >
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : !summary ? (
        <Skeleton className="h-16 w-full" />
      ) : (
        <div className="space-y-3">
          {summary.refundedAmount > 0 && (
            <p className="text-sm text-muted-foreground">
              Refunded so far: <span className="font-medium text-foreground tabular-nums">{formatMoney(summary.refundedAmount)}</span>
            </p>
          )}
          {summary.returns.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {summary.eligibility.eligible ? "No returns on this order." : (summary.eligibility.reason ?? "No returns on this order.")}
            </p>
          ) : (
            summary.returns.map((rma) => <ReturnCard key={rma.id} rma={rma} onChanged={changed} />)
          )}
        </div>
      )}

      {creating && summary && (
        <CreateReturnDialog
          orderId={order.id}
          orderNumber={order.orderNumber}
          items={summary.items}
          remaining={summary.eligibility.remaining}
          paymentMethod={order.paymentMethod}
          open={creating}
          onOpenChange={setCreating}
          onDone={changed}
        />
      )}
    </DetailSection>
  );
}
