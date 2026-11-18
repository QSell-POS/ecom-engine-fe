"use client";

import { useState, useTransition } from "react";
import { ArrowRightLeft, Minus, Plus, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ProductSearch, type FoundProduct } from "@/components/chat/OrderDrawer";
import { completeReturnAction, createReturnAction, rejectReturnAction } from "@/lib/api/returns/action";
import { RETURN_REASONS, RETURN_TYPE_LABELS, type OrderReturn, type ReturnType } from "@/lib/api/returns/types";
import { PAYMENT_METHODS, paymentMethodLabel, type OrderItem, type PaymentMethod } from "@/lib/api/order/types";
import { toAmount } from "@/lib/api/shared/types";
import { formatMoney } from "@/lib/constants/money";

const METHOD_OPTIONS = PAYMENT_METHODS.map((method) => ({ value: method, label: paymentMethodLabel(method) }));

function RefundMethodSelect({ value, onChange }: { value: PaymentMethod | ""; onChange: (value: PaymentMethod) => void }) {
  return (
    <Select value={value || undefined} onValueChange={(next) => onChange(next as PaymentMethod)}>
      <SelectTrigger id="refund-method" className="w-full">
        <SelectValue placeholder="Same as the order" />
      </SelectTrigger>
      <SelectContent>
        {METHOD_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function parseAmount(text: string): number | undefined {
  if (text.trim() === "") return undefined;
  const amount = Number(text);
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) / 100 : undefined;
}

// ------------------------------------------------------------------ create

type Line = { quantity: number; replacement?: FoundProduct };

/**
 * The store opens a return on a delivered order — the route for orders taken
 * in a chat, on the phone or at the counter, whose shoppers have no account to
 * ask from. "Process now" restocks, refunds and ships replacements immediately.
 */
export function CreateReturnDialog({
  orderId,
  orderNumber,
  items,
  remaining,
  paymentMethod,
  open,
  onOpenChange,
  onDone,
}: {
  orderId: string;
  orderNumber: string;
  items: OrderItem[];
  remaining: Record<string, number>;
  paymentMethod?: PaymentMethod;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<ReturnType>("return_refund");
  const [lines, setLines] = useState<Record<string, Line>>({});
  const [picking, setPicking] = useState<string | null>(null);
  const [reason, setReason] = useState<string>(RETURN_REASONS[0]);
  const [otherReason, setOtherReason] = useState("");
  const [restock, setRestock] = useState(true);
  const [complete, setComplete] = useState(true);
  const [refund, setRefund] = useState("");
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const returnable = items.filter((item) => (remaining[item.id] ?? 0) > 0);
  const chosen = returnable.filter((item) => (lines[item.id]?.quantity ?? 0) > 0);
  const grossValue = chosen.reduce((sum, item) => sum + toAmount(item.priceSnapshot) * lines[item.id].quantity, 0);
  const replacementValue =
    type === "exchange"
      ? chosen.reduce((sum, item) => sum + (lines[item.id].replacement?.price ?? toAmount(item.priceSnapshot)) * lines[item.id].quantity, 0)
      : 0;

  function reset() {
    setType("return_refund");
    setLines({});
    setPicking(null);
    setReason(RETURN_REASONS[0]);
    setOtherReason("");
    setRestock(true);
    setComplete(true);
    setRefund("");
    setMethod("");
    setReference("");
    setNote("");
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (isPending) return;
    if (!next) reset();
    onOpenChange(next);
  }

  function setQuantity(item: OrderItem, quantity: number) {
    const max = remaining[item.id] ?? 0;
    setLines((current) => ({ ...current, [item.id]: { ...current[item.id], quantity: Math.max(0, Math.min(max, quantity)) } }));
  }

  function submit() {
    setError(null);
    if (chosen.length === 0) return setError("Pick at least one item to return.");
    const finalReason = reason === "Other" ? otherReason.trim() : reason;
    if (finalReason.length < 2) return setError("Give a reason for the return.");

    startTransition(async () => {
      const result = await createReturnAction({
        orderId,
        type,
        reason: finalReason,
        items: chosen.map((item) => ({
          orderItemId: item.id,
          quantity: lines[item.id].quantity,
          ...(type === "exchange" && lines[item.id].replacement ? { replacementProductId: lines[item.id].replacement!.id } : {}),
        })),
        restock,
        complete,
        refundAmount: complete ? parseAmount(refund) : undefined,
        refundMethod: complete && method ? method : undefined,
        refundReference: complete && reference.trim() ? reference.trim() : undefined,
        adminNote: note.trim() || undefined,
      });
      if (!result?.data) {
        setError(result?.serverError ?? "Couldn't create the return. Please check the details.");
        return;
      }
      const rma = result.data.rma;
      toast.success(complete ? `${rma.returnNumber} processed` : `${rma.returnNumber} created`, {
        description: complete && toAmount(rma.refundAmount) > 0 ? `Refunded ${formatMoney(rma.refundAmount)}` : undefined,
      });
      handleOpenChange(false);
      onDone();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Return or exchange · {orderNumber}</DialogTitle>
          <DialogDescription>Choose what comes back. Stock and money only move once the return is processed.</DialogDescription>
        </DialogHeader>

        <FieldGroup className="gap-5">
          <ToggleGroup type="single" variant="outline" value={type} onValueChange={(value) => value && setType(value as ReturnType)} className="w-full">
            <ToggleGroupItem value="return_refund" className="flex-1">
              <RotateCcw /> {RETURN_TYPE_LABELS.return_refund}
            </ToggleGroupItem>
            <ToggleGroupItem value="exchange" className="flex-1">
              <ArrowRightLeft /> {RETURN_TYPE_LABELS.exchange}
            </ToggleGroupItem>
          </ToggleGroup>

          <Field>
            <FieldLabel>Items</FieldLabel>
            {returnable.length === 0 ? (
              <p className="text-sm text-muted-foreground">Everything on this order has already been returned.</p>
            ) : (
              <ul className="divide-y rounded-md border text-sm">
                {returnable.map((item) => {
                  const line = lines[item.id];
                  const quantity = line?.quantity ?? 0;
                  const max = remaining[item.id] ?? 0;
                  return (
                    <li key={item.id} className="space-y-2 px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{item.productNameSnapshot}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatMoney(item.priceSnapshot)} · {max} of {item.quantity} returnable
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Button type="button" variant="outline" size="icon-sm" aria-label="Fewer" disabled={quantity === 0} onClick={() => setQuantity(item, quantity - 1)}>
                            <Minus />
                          </Button>
                          <span className="w-6 text-center tabular-nums">{quantity}</span>
                          <Button type="button" variant="outline" size="icon-sm" aria-label="More" disabled={quantity >= max} onClick={() => setQuantity(item, quantity + 1)}>
                            <Plus />
                          </Button>
                        </span>
                      </div>
                      {type === "exchange" && quantity > 0 && (
                        <div className="rounded-md bg-muted/50 px-2.5 py-2 text-xs">
                          {picking === item.id ? (
                            <div className="space-y-1">
                              <ProductSearch
                                onPick={(product) => {
                                  setLines((current) => ({ ...current, [item.id]: { ...current[item.id], replacement: product } }));
                                  setPicking(null);
                                }}
                              />
                              <Button type="button" variant="ghost" size="sm" onClick={() => setPicking(null)}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <span>
                                Replace with <span className="font-medium">{line?.replacement?.name ?? "the same product"}</span>
                                {line?.replacement && ` · ${formatMoney(line.replacement.price)}`}
                              </span>
                              <span className="flex gap-1">
                                {line?.replacement && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label="Use the same product"
                                    onClick={() => setLines((current) => ({ ...current, [item.id]: { quantity: current[item.id].quantity } }))}
                                  >
                                    <X />
                                  </Button>
                                )}
                                <Button type="button" variant="outline" size="sm" onClick={() => setPicking(item.id)}>
                                  Change
                                </Button>
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="return-reason">Reason</FieldLabel>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="return-reason" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RETURN_REASONS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {reason === "Other" && <Input value={otherReason} onChange={(e) => setOtherReason(e.target.value)} placeholder="Describe the reason" maxLength={100} />}
          </Field>

          <Field orientation="horizontal" className="justify-between">
            <span>
              <FieldLabel htmlFor="return-restock" className="font-normal">
                Put returned items back in stock
              </FieldLabel>
              <FieldDescription className="text-xs">Turn off for damaged goods that can&apos;t be resold.</FieldDescription>
            </span>
            <Switch id="return-restock" checked={restock} onCheckedChange={setRestock} />
          </Field>

          <Field orientation="horizontal" className="justify-between">
            <span>
              <FieldLabel htmlFor="return-complete" className="font-normal">
                Process now
              </FieldLabel>
              <FieldDescription className="text-xs">
                {type === "exchange" ? "Restock, send the replacement and settle any difference now." : "Restock and record the refund now."} Off leaves it approved.
              </FieldDescription>
            </span>
            <Switch id="return-complete" checked={complete} onCheckedChange={setComplete} />
          </Field>

          {complete && (
            <div className="grid gap-4 rounded-md border p-3 sm:grid-cols-2">
              <p className="text-xs text-muted-foreground sm:col-span-2">
                {type === "exchange"
                  ? replacementValue > grossValue
                    ? `The replacement costs about ${formatMoney(replacementValue - grossValue)} more; collect it from the customer.`
                    : `About ${formatMoney(grossValue - replacementValue)} is refundable (before the order's discount).`
                  : `Returned items: ${formatMoney(grossValue)} before the order's discount. Leave the amount blank to refund their value net of discount.`}
              </p>
              <Field>
                <FieldLabel htmlFor="refund-amount">Refund amount</FieldLabel>
                <Input id="refund-amount" inputMode="decimal" value={refund} onChange={(e) => setRefund(e.target.value)} placeholder="Suggested" />
              </Field>
              <Field>
                <FieldLabel htmlFor="refund-method">Refunded via</FieldLabel>
                <RefundMethodSelect value={method} onChange={setMethod} />
                {paymentMethod && !method && <FieldDescription className="text-xs">{paymentMethodLabel(paymentMethod)}</FieldDescription>}
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="refund-reference">Reference</FieldLabel>
                <Input id="refund-reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transaction id, receipt no. (optional)" maxLength={255} />
              </Field>
            </div>
          )}

          <Field>
            <FieldLabel htmlFor="return-note">Note to the customer</FieldLabel>
            <Textarea id="return-note" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-16" maxLength={2000} placeholder="Optional" />
          </Field>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isPending || chosen.length === 0}>
            {isPending && <Spinner />}
            {complete ? "Process return" : "Create return"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------- complete

/** Suggested refund: the returned value; for an exchange only a price drop comes back. */
export function suggestedRefund(rma: OrderReturn): number {
  const returned = toAmount(rma.returnedValue);
  return rma.type === "return_refund" ? returned : Math.max(0, returned - toAmount(rma.replacementValue));
}

export function CompleteReturnDialog({
  rma,
  open,
  onOpenChange,
  onDone,
}: {
  rma: OrderReturn;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const suggested = suggestedRefund(rma);
  const [refund, setRefund] = useState(suggested.toFixed(2));
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [reference, setReference] = useState("");
  const [restock, setRestock] = useState(rma.restock);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const due = rma.type === "exchange" ? Math.max(0, toAmount(rma.replacementValue) - toAmount(rma.returnedValue)) : 0;

  function submit() {
    setError(null);
    const amount = parseAmount(refund);
    if (refund.trim() !== "" && amount === undefined) return setError("Enter a valid refund amount.");
    startTransition(async () => {
      const result = await completeReturnAction({
        id: rma.id,
        // Blank: the server refunds the suggested amount.
        refundAmount: amount,
        refundMethod: method || undefined,
        refundReference: reference.trim() || undefined,
        restock,
        adminNote: note.trim() || undefined,
      });
      if (!result?.data) {
        setError(result?.serverError ?? "Couldn't complete the return.");
        return;
      }
      toast.success(`${rma.returnNumber} completed`, {
        description: toAmount(result.data.rma.refundAmount) > 0 ? `Refunded ${formatMoney(result.data.rma.refundAmount)}` : undefined,
      });
      onOpenChange(false);
      onDone();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete {rma.returnNumber}</DialogTitle>
          <DialogDescription>
            {rma.type === "exchange"
              ? "Received the items back? This restocks them, sends the replacements out of stock and records any refund."
              : "Received the items back? This restocks them and records the refund on the order."}
          </DialogDescription>
        </DialogHeader>
        <FieldGroup className="gap-4">
          {due > 0 && (
            <Alert>
              <AlertDescription>The replacement costs {formatMoney(due)} more; collect it from the customer.</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="complete-refund">Refund amount</FieldLabel>
              <Input id="complete-refund" inputMode="decimal" value={refund} onChange={(e) => setRefund(e.target.value)} />
              <FieldDescription className="text-xs">Suggested {formatMoney(suggested)}</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="refund-method">Refunded via</FieldLabel>
              <RefundMethodSelect value={method} onChange={setMethod} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="complete-reference">Reference</FieldLabel>
            <Input id="complete-reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Optional" maxLength={255} />
          </Field>
          <Field orientation="horizontal" className="justify-between">
            <FieldLabel htmlFor="complete-restock" className="font-normal">
              Put returned items back in stock
            </FieldLabel>
            <Switch id="complete-restock" checked={restock} onCheckedChange={setRestock} />
          </Field>
          <Field>
            <FieldLabel htmlFor="complete-note">Note to the customer</FieldLabel>
            <Textarea id="complete-note" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-16" maxLength={2000} placeholder="Optional" />
          </Field>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending && <Spinner />}
            Complete return
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------------ reject

export function RejectReturnDialog({
  rma,
  open,
  onOpenChange,
  onDone,
}: {
  rma: OrderReturn;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    startTransition(async () => {
      const result = await rejectReturnAction({ id: rma.id, note: note.trim() || undefined });
      if (!result?.data) {
        setError(result?.serverError ?? "Couldn't reject the return.");
        return;
      }
      toast.success(`${rma.returnNumber} rejected`);
      onOpenChange(false);
      onDone();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject {rma.returnNumber}?</DialogTitle>
          <DialogDescription>The customer sees your reason on their order.</DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="reject-note">Reason</FieldLabel>
          <Textarea id="reject-note" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-20" maxLength={2000} placeholder="e.g. Outside the return window" />
        </Field>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={submit} disabled={isPending}>
            {isPending && <Spinner />}
            Reject return
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
