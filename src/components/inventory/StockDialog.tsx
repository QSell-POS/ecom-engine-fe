"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { SelectField, TextField } from "@/components/common/FormFields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { adjustStockAction, receiveStockAction } from "@/lib/api/inventory/action";
import { AdjustStockSchema, ReceiveStockSchema } from "@/lib/api/inventory/validation";
import { TRANSACTION_TYPE_LABELS, ADJUSTMENT_TYPES, itemName, type InventoryItem } from "@/lib/api/inventory/types";

const ADJUSTMENT_OPTIONS = ADJUSTMENT_TYPES.map((type) => ({ value: type, label: TRANSACTION_TYPE_LABELS[type] }));

export type StockMode = "receive" | "adjust";

/**
 * Receiving and adjusting are the two movements a person does by hand;
 * reserve/release/fulfill belong to the order flow and run server-side.
 */
export function StockDialog({ item, mode, open, onOpenChange }: { item: InventoryItem; mode: StockMode; open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const name = itemName(item);

  const receiveForm = useForm({
    resolver: zodResolver(ReceiveStockSchema),
    defaultValues: { productId: item.productId, quantity: 1, costPrice: "", sellingPrice: "", batchNumber: "", purchaseReferenceId: "", note: "" },
  });

  const adjustForm = useForm({
    resolver: zodResolver(AdjustStockSchema),
    defaultValues: { productId: item.productId, type: "adjustment_out", quantity: 1, unitCost: "", note: "" },
  });

  // stock_count means "the counted total", the others mean "this many units".
  const adjustType = useWatch({ control: adjustForm.control, name: "type" });

  function handleOpenChange(next: boolean) {
    if (isPending) return;
    if (!next) {
      receiveForm.reset();
      adjustForm.reset();
      setServerError(null);
    }
    onOpenChange(next);
  }

  function run(action: () => Promise<{ data?: unknown; serverError?: string } | undefined>, message: string) {
    setServerError(null);
    startTransition(async () => {
      const result = await action();
      if (!result?.data) {
        setServerError(result?.serverError ?? "That movement was rejected. Check the quantity and try again.");
        return;
      }
      toast.success(message, { description: name });
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "receive" ? `Receive stock — ${name}` : `Adjust stock — ${name}`}</DialogTitle>
          <DialogDescription>
            {mode === "receive"
              ? "Records a batch and raises what is on hand."
              : `On hand is ${item.quantityOnHand}, of which ${item.quantityReserved} is reserved. The reason decides the direction, so the quantity is always positive.`}
          </DialogDescription>
        </DialogHeader>

        {mode === "receive" ? (
          <form
            id="stock-form"
            onSubmit={receiveForm.handleSubmit((values) => run(() => receiveStockAction(values), "Stock received"))}
            noValidate
          >
            <FieldGroup className="gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField form={receiveForm} name="quantity" label="Quantity" type="number" min={1} step="1" autoFocus />
                <TextField form={receiveForm} name="costPrice" label="Unit cost" type="number" min={0} step="0.01" description="Prices this batch." />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField form={receiveForm} name="batchNumber" label="Batch number" optional placeholder="B-2026-10" />
                <TextField form={receiveForm} name="purchaseReferenceId" label="Purchase order" optional placeholder="PO-881" />
              </div>
              <TextField
                form={receiveForm}
                name="sellingPrice"
                label="New selling price"
                optional
                type="number"
                min={0}
                step="0.01"
                description="Also updates the product's price."
              />
              <TextField form={receiveForm} name="note" label="Note" optional multiline />
            </FieldGroup>
          </form>
        ) : (
          <form
            id="stock-form"
            onSubmit={adjustForm.handleSubmit((values) => run(() => adjustStockAction(values), "Stock adjusted"))}
            noValidate
          >
            <FieldGroup className="gap-4">
              <SelectField form={adjustForm} name="type" label="Reason" options={ADJUSTMENT_OPTIONS} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  form={adjustForm}
                  name="quantity"
                  label={adjustType === "stock_count" ? "Counted total" : "Units"}
                  type="number"
                  min={0}
                  step="1"
                  autoFocus
                  description={adjustType === "stock_count" ? "The new on-hand figure." : undefined}
                />
                <TextField form={adjustForm} name="unitCost" label="Unit cost" optional type="number" min={0} step="0.01" description="Prices stock coming in." />
              </div>
              <TextField form={adjustForm} name="note" label="Note" optional multiline />
            </FieldGroup>
          </form>
        )}

        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form="stock-form" disabled={isPending}>
            {isPending && <Spinner />}
            {mode === "receive" ? "Receive" : "Adjust"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
