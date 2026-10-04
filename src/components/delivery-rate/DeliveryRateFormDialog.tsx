"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { SwitchField, TextField } from "@/components/common/FormFields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { createDeliveryRateAction, updateDeliveryRateAction } from "@/lib/api/delivery-rate/action";
import { deliveryZone, type DeliveryRate } from "@/lib/api/delivery-rate/types";
import { CreateDeliveryRateSchema } from "@/lib/api/delivery-rate/validation";

type Input = z.input<typeof CreateDeliveryRateSchema>;
type Output = z.output<typeof CreateDeliveryRateSchema>;

/**
 * A rate is a flat shipping cost for a region, optionally narrowed to one
 * city. Leaving the city blank makes it the regional fallback.
 */
export function DeliveryRateFormDialog({ rate, open, onOpenChange }: { rate?: DeliveryRate; open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<Input, unknown, Output>({
    resolver: zodResolver(CreateDeliveryRateSchema),
    defaultValues: {
      region: rate?.region ?? "",
      city: rate?.city ?? "",
      shippingCost: rate?.shippingCost ?? 0,
      isActive: rate?.isActive ?? true,
    },
  });

  function handleOpenChange(next: boolean) {
    if (isPending) return;
    if (!next) {
      form.reset();
      setServerError(null);
    }
    onOpenChange(next);
  }

  function onSubmit(values: Output) {
    setServerError(null);
    startTransition(async () => {
      const result = rate ? await updateDeliveryRateAction({ id: rate.id, ...values }) : await createDeliveryRateAction(values);
      if (!result?.data) {
        setServerError(result?.serverError ?? "Please check the highlighted fields.");
        return;
      }
      toast.success(rate ? "Rate updated" : "Rate created", { description: values.city ? `${values.city}, ${values.region}` : values.region });
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{rate ? `Edit ${deliveryZone(rate)}` : "New delivery rate"}</DialogTitle>
          <DialogDescription>
            Checkout quotes from these. An exact city match wins over the regional fallback, so set a region-wide rate as a safety net.
          </DialogDescription>
        </DialogHeader>

        <form id="delivery-rate-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField form={form} name="region" label="Region" autoFocus placeholder="Bagmati" />
              <TextField form={form} name="city" label="City" optional placeholder="Kathmandu" description="Blank covers the whole region." />
            </div>
            <TextField form={form} name="shippingCost" label="Shipping cost" type="number" min={0} step="1" />
            <SwitchField form={form} name="isActive" label="Active" description="Inactive rates are not offered at checkout." />
            {serverError && (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form="delivery-rate-form" disabled={isPending}>
            {isPending && <Spinner />}
            {rate ? "Save changes" : "Create rate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CreateDeliveryRateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> New rate
      </Button>
      <DeliveryRateFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
