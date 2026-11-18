"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowRightLeft, Minus, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatMoney } from "@/lib/storefront/format";
import type { Order, StoreReturn, StoreReturnEligibility } from "@/lib/storefront/types";
import { cn } from "@/lib/utils";
import { SfDrawer } from "../overlay";
import { Spinner } from "../primitives";
import { useStorefront } from "../store-context";

const REASONS = ["Wrong size or fit", "Damaged or defective", "Not as described", "Wrong item received", "Changed my mind", "Other"];

const STATUS: Record<StoreReturn["status"], { label: string; tone: string; text: string }> = {
  requested: { label: "Requested", tone: "bg-amber-500", text: "We've got your request and will be in touch shortly." },
  approved: { label: "Approved", tone: "bg-sky-500", text: "Approved — please send the items back. We'll finish up once they arrive." },
  rejected: { label: "Declined", tone: "bg-zinc-400", text: "The store declined this request." },
  completed: { label: "Completed", tone: "bg-emerald-500", text: "All done." },
  cancelled: { label: "Cancelled", tone: "bg-zinc-400", text: "You cancelled this request." },
};

/**
 * Returns and exchanges on a delivered order: what has been asked for so far,
 * and a "Request return / exchange" button while the order is eligible
 * (storefront orders, within the return window, with something left to return).
 */
export function OrderReturnsPanel({ order }: { order: Order }) {
  const { api } = useStorefront();
  const [data, setData] = useState<{ returns: StoreReturn[]; eligibility: StoreReturnEligibility } | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const relevant = order.status === "delivered" || order.status === "refunded";

  const reload = useCallback(() => api.getOrderReturns(order.id).then(setData), [api, order.id]);

  useEffect(() => {
    if (!relevant) return;
    let cancelled = false;
    api
      .getOrderReturns(order.id)
      .then((result) => !cancelled && setData(result))
      .catch(() => !cancelled && setData({ returns: [], eligibility: { eligible: false, reason: null, until: null, remaining: {} } }));
    return () => {
      cancelled = true;
    };
  }, [api, order.id, relevant]);

  if (!relevant || !data) return null;
  const { returns, eligibility } = data;
  if (returns.length === 0 && !eligibility.eligible) {
    return eligibility.reason ? <p className="text-sm text-(--sf-muted)">{eligibility.reason}.</p> : null;
  }

  async function cancel(rma: StoreReturn) {
    setCancelling(rma.id);
    try {
      await api.cancelReturn(order.id, rma.id);
      toast.success("Return request cancelled");
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't cancel this request.");
    } finally {
      setCancelling(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="sf-heading text-lg">Returns &amp; exchanges</h2>
          {eligibility.eligible && eligibility.until && (
            <p className="text-sm text-(--sf-muted)">You can request a return or exchange until {formatDate(eligibility.until)}.</p>
          )}
        </div>
        {eligibility.eligible && (
          <button type="button" onClick={() => setRequesting(true)} className="sf-btn sf-btn-secondary sf-btn-sm">
            <RotateCcw className="size-4" /> Request return / exchange
          </button>
        )}
      </div>

      {returns.length > 0 && (
        <ul className="space-y-3">
          {returns.map((rma) => {
            const status = STATUS[rma.status];
            return (
              <li key={rma.id} className="space-y-2 rounded-(--sf-radius) border border-(--sf-line) p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {rma.number} · {rma.type === "exchange" ? "Exchange" : "Return & refund"}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs">
                    <span className={cn("size-1.5 rounded-full", status.tone)} /> {status.label}
                  </span>
                </div>
                <ul className="text-(--sf-muted)">
                  {rma.lines.map((line) => (
                    <li key={line.orderLineId}>
                      {line.quantity} × {line.name}
                      {rma.type === "exchange" && line.replacementName && line.replacementName !== line.name && ` → ${line.replacementName}`}
                    </li>
                  ))}
                </ul>
                <p className="text-(--sf-muted)">
                  {status.text}
                  {rma.status === "completed" && rma.refundAmount > 0 && ` ${formatMoney(rma.refundAmount)} refunded.`}
                  {rma.status === "completed" && rma.amountDue > 0 && ` ${formatMoney(rma.amountDue)} due for the replacement.`}
                </p>
                {rma.storeNote && <p className="whitespace-pre-line">Store: {rma.storeNote}</p>}
                {rma.status === "requested" && (
                  <button type="button" disabled={cancelling === rma.id} onClick={() => cancel(rma)} className="sf-btn sf-btn-ghost sf-btn-sm -ml-2 text-(--sf-muted)">
                    {cancelling === rma.id && <Spinner />} Cancel request
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ReturnRequestDrawer
        order={order}
        remaining={eligibility.remaining}
        open={requesting}
        onOpenChange={setRequesting}
        onDone={async () => {
          setRequesting(false);
          await reload();
        }}
      />
    </section>
  );
}

function ReturnRequestDrawer({
  order,
  remaining,
  open,
  onOpenChange,
  onDone,
}: {
  order: Order;
  remaining: Record<string, number>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => Promise<void>;
}) {
  const { api } = useStorefront();
  const [type, setType] = useState<StoreReturn["type"]>("return_refund");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState(REASONS[0]);
  const [pending, setPending] = useState(false);

  const lines = order.lines.filter((line) => (remaining[line.id] ?? 0) > 0);
  const chosen = lines.filter((line) => (quantities[line.id] ?? 0) > 0);

  function setQuantity(id: string, next: number) {
    setQuantities((current) => ({ ...current, [id]: Math.max(0, Math.min(remaining[id] ?? 0, next)) }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const note = String(form.get("return-note") ?? "").trim();
    const other = String(form.get("return-other") ?? "").trim();
    const finalReason = reason === "Other" ? other : reason;
    if (chosen.length === 0) return toast.error("Choose at least one item.");
    if (finalReason.length < 2) return toast.error("Tell us why you're returning it.");

    setPending(true);
    try {
      const rma = await api.requestReturn(order.id, {
        type,
        reason: finalReason,
        note: note || undefined,
        items: chosen.map((line) => ({ orderLineId: line.id, quantity: quantities[line.id] })),
      });
      toast.success(`Request ${rma.number} sent`, { description: "The store will review it and get back to you." });
      setQuantities({});
      await onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't send your request.");
    } finally {
      setPending(false);
    }
  }

  return (
    <SfDrawer open={open} onOpenChange={(next) => !pending && onOpenChange(next)} title="Return or exchange" description={`Order ${order.number}`}>
      <form onSubmit={submit} className="space-y-6 p-5">
        <fieldset className="grid grid-cols-2 gap-2">
          <legend className="sf-label mb-2">What would you like?</legend>
          {(
            [
              ["return_refund", "Return for a refund", RotateCcw],
              ["exchange", "Exchange for the same item", ArrowRightLeft],
            ] as const
          ).map(([value, label, Icon]) => (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer flex-col gap-2 rounded-(--sf-radius) border p-3 text-sm transition-colors",
                type === value ? "border-(--sf-fg)" : "border-(--sf-line) hover:border-(--sf-muted)",
              )}
            >
              <input type="radio" name="return-type" value={value} checked={type === value} onChange={() => setType(value)} className="sr-only" />
              <Icon className="size-4" /> {label}
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="sf-label mb-2">Items</legend>
          <ul className="divide-y divide-(--sf-line) rounded-(--sf-radius) border border-(--sf-line)">
            {lines.map((line) => {
              const quantity = quantities[line.id] ?? 0;
              const max = remaining[line.id] ?? 0;
              return (
                <li key={line.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{line.name}</span>
                    <span className="text-xs text-(--sf-muted)">
                      {formatMoney(line.price)} · up to {max}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <button type="button" aria-label={`Fewer ${line.name}`} disabled={quantity === 0} onClick={() => setQuantity(line.id, quantity - 1)} className="sf-btn sf-btn-ghost sf-btn-sm px-2">
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-5 text-center tabular-nums">{quantity}</span>
                    <button type="button" aria-label={`More ${line.name}`} disabled={quantity >= max} onClick={() => setQuantity(line.id, quantity + 1)} className="sf-btn sf-btn-ghost sf-btn-sm px-2">
                      <Plus className="size-3.5" />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <div className="space-y-2">
          <label htmlFor="return-reason" className="sf-label">
            Reason
          </label>
          <select id="return-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="sf-input">
            {REASONS.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          {reason === "Other" && <input name="return-other" placeholder="Tell us more" maxLength={100} className="sf-input" />}
        </div>

        <div className="space-y-2">
          <label htmlFor="return-note" className="sf-label">
            {type === "exchange" ? "What should we send instead?" : "Anything else?"} <span className="text-(--sf-muted)">(optional)</span>
          </label>
          <textarea
            id="return-note"
            name="return-note"
            rows={3}
            maxLength={2000}
            placeholder={type === "exchange" ? "e.g. the same shirt in size M" : "Details that help the store"}
            className="sf-input min-h-20"
          />
        </div>

        <button type="submit" disabled={pending || chosen.length === 0} className="sf-btn sf-btn-primary sf-btn-block">
          {pending && <Spinner />} Send request
        </button>
      </form>
    </SfDrawer>
  );
}
