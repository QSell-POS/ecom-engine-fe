"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRightLeft, Check, PackageCheck, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { StatusLabel } from "@/components/common/StatusLabel";
import { useCan } from "@/components/auth/PermissionsProvider";
import { approveReturnAction } from "@/lib/api/returns/action";
import { RETURN_STATUS_META, RETURN_TYPE_LABELS, returnCustomerName, type OrderReturn } from "@/lib/api/returns/types";
import { ORDER_ROUTES } from "@/lib/api/order/constants";
import { paymentMethodLabel } from "@/lib/api/order/types";
import { toAmount } from "@/lib/api/shared/types";
import { formatMoney } from "@/lib/constants/money";
import { CompleteReturnDialog, RejectReturnDialog } from "./ReturnDialogs";

const dateTime = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const when = (value?: string | null) => (value ? dateTime.format(new Date(value)) : null);

/** One return with its lines, money and the next step the store can take. */
export function ReturnCard({ rma, onChanged, showOrder = false }: { rma: OrderReturn; onChanged: () => void; showOrder?: boolean }) {
  const canUpdate = useCan("orders:update");
  const [isPending, startTransition] = useTransition();
  const [completing, setCompleting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const status = RETURN_STATUS_META[rma.status];
  const Icon = rma.type === "exchange" ? ArrowRightLeft : RotateCcw;
  const open = rma.status === "requested" || rma.status === "approved";

  function approve() {
    startTransition(async () => {
      const result = await approveReturnAction({ id: rma.id });
      if (!result?.data) {
        toast.error(result?.serverError ?? "Couldn't approve the return.");
        return;
      }
      toast.success(`${rma.returnNumber} approved`, { description: "Complete it once the items are back." });
      onChanged();
    });
  }

  return (
    <article className="space-y-3 rounded-lg border p-4 text-sm">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="font-medium">
              {rma.returnNumber} · {RETURN_TYPE_LABELS[rma.type]}
            </p>
            <p className="text-xs text-muted-foreground">
              {rma.source === "customer" ? "Requested by the customer" : `Opened by ${rma.handledByName ?? "the store"}`} · {when(rma.createdAt)}
              {showOrder && rma.order && (
                <>
                  {" · "}
                  <Link href={ORDER_ROUTES.detail(rma.order.id)} className="underline-offset-2 hover:underline">
                    {rma.order.orderNumber}
                  </Link>
                  {returnCustomerName(rma) && ` · ${returnCustomerName(rma)}`}
                </>
              )}
            </p>
          </div>
        </div>
        <StatusLabel tone={status.tone}>{status.label}</StatusLabel>
      </header>

      <ul className="divide-y border-y">
        {rma.items.map((item) => (
          <li key={item.id} className="flex items-baseline justify-between gap-4 py-2">
            <span className="min-w-0">
              <span className="font-medium">{item.productNameSnapshot}</span>
              {rma.type === "exchange" && item.replacementNameSnapshot && (
                <span className="block text-xs text-muted-foreground">
                  → {item.replacementNameSnapshot}
                  {item.replacementUnitPrice != null && ` (${formatMoney(item.replacementUnitPrice)})`}
                </span>
              )}
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {item.quantity} × {formatMoney(item.unitPrice)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        <dt className="text-muted-foreground">Reason</dt>
        <dd>{rma.reason}</dd>
        {rma.customerNote && (
          <>
            <dt className="text-muted-foreground">Customer says</dt>
            <dd className="whitespace-pre-line">{rma.customerNote}</dd>
          </>
        )}
        {rma.adminNote && (
          <>
            <dt className="text-muted-foreground">Store note</dt>
            <dd className="whitespace-pre-line">{rma.adminNote}</dd>
          </>
        )}
        <dt className="text-muted-foreground">Returned value</dt>
        <dd className="tabular-nums">{formatMoney(rma.returnedValue)}</dd>
        {rma.type === "exchange" && (
          <>
            <dt className="text-muted-foreground">Replacement value</dt>
            <dd className="tabular-nums">{formatMoney(rma.replacementValue)}</dd>
          </>
        )}
        {rma.status === "completed" && (
          <>
            <dt className="text-muted-foreground">Refunded</dt>
            <dd className="tabular-nums">
              {formatMoney(rma.refundAmount)}
              {toAmount(rma.refundAmount) > 0 && rma.refundMethod && ` via ${paymentMethodLabel(rma.refundMethod)}`}
              {rma.refundReference && ` · ${rma.refundReference}`}
            </dd>
            {toAmount(rma.amountDue) > 0 && (
              <>
                <dt className="text-muted-foreground">Due from customer</dt>
                <dd className="tabular-nums">{formatMoney(rma.amountDue)}</dd>
              </>
            )}
            <dt className="text-muted-foreground">Stock</dt>
            <dd>{rma.restock ? "Returned items restocked" : "Written off (not restocked)"}</dd>
            <dt className="text-muted-foreground">Completed</dt>
            <dd>{when(rma.completedAt)}</dd>
          </>
        )}
      </dl>

      {rma.photoUrls && rma.photoUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {rma.photoUrls.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="block size-16 overflow-hidden rounded-md border">
              {/* eslint-disable-next-line @next/next/no-img-element -- customer-uploaded proof */}
              <img src={url} alt="Customer photo" className="size-full object-cover" />
            </a>
          ))}
        </div>
      )}

      {canUpdate && open && (
        <footer className="flex flex-wrap justify-end gap-2 pt-1">
          {rma.status === "requested" && (
            <>
              <Button variant="outline" size="sm" onClick={() => setRejecting(true)} disabled={isPending}>
                <X /> Reject
              </Button>
              <Button variant="outline" size="sm" onClick={approve} disabled={isPending}>
                {isPending ? <Spinner /> : <Check />} Approve
              </Button>
            </>
          )}
          <Button size="sm" onClick={() => setCompleting(true)} disabled={isPending}>
            <PackageCheck /> {rma.status === "requested" ? "Approve & complete" : "Complete"}
          </Button>
        </footer>
      )}

      {completing && <CompleteReturnDialog rma={rma} open={completing} onOpenChange={setCompleting} onDone={onChanged} />}
      {rejecting && <RejectReturnDialog rma={rma} open={rejecting} onOpenChange={setRejecting} onDone={onChanged} />}
    </article>
  );
}
