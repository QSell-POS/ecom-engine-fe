"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { SelectField, SwitchField, TextField } from "@/components/common/FormFields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { createDiscountAction, updateDiscountAction } from "@/lib/api/discount/action";
import { DISCOUNT_TYPE_LABELS, type Discount } from "@/lib/api/discount/types";
import { CreateDiscountSchema } from "@/lib/api/discount/validation";

type Input = z.input<typeof CreateDiscountSchema>;
type Output = z.output<typeof CreateDiscountSchema>;

const TYPE_OPTIONS = Object.entries(DISCOUNT_TYPE_LABELS).map(([value, label]) => ({ value, label }));

// The API stores ISO timestamps; <input type="date"> wants YYYY-MM-DD.
const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : "");

export function DiscountFormDialog({ discount, open, onOpenChange }: { discount?: Discount; open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<Input, unknown, Output>({
    resolver: zodResolver(CreateDiscountSchema),
    defaultValues: {
      name: discount?.name ?? "",
      code: discount?.code ?? "",
      description: discount?.description ?? "",
      type: discount?.type ?? "percentage",
      discountValue: discount?.discountValue ?? 10,
      maxTotalUses: discount?.maxTotalUses ?? "",
      maxUsesPerCustomer: discount?.maxUsesPerCustomer ?? "",
      startsAt: toDateInput(discount?.startsAt),
      endsAt: toDateInput(discount?.endsAt),
      isActive: discount?.isActive ?? true,
    },
  });

  const type = useWatch({ control: form.control, name: "type" });

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
      // code, type and discountValue are immutable on the API, so an edit
      // sends only what may change.
      const result = discount
        ? await updateDiscountAction({
            id: discount.id,
            name: values.name,
            description: values.description,
            startsAt: values.startsAt,
            endsAt: values.endsAt,
            isActive: values.isActive,
            maxTotalUses: values.maxTotalUses,
            maxUsesPerCustomer: values.maxUsesPerCustomer,
          })
        : await createDiscountAction(values);
      if (!result?.data) {
        setServerError(result?.serverError ?? "Please check the highlighted fields.");
        return;
      }
      toast.success(discount ? "Discount updated" : "Discount created", { description: values.code });
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{discount ? `Edit ${discount.code}` : "New discount"}</DialogTitle>
          <DialogDescription>Customers enter the code at checkout. Codes are stored uppercase.</DialogDescription>
        </DialogHeader>

        <form id="discount-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField form={form} name="name" label="Offer name" autoFocus placeholder="Dashain 10%" />
              <TextField
                form={form}
                name="code"
                label="Code"
                placeholder="DASHAIN10"
                className="font-mono uppercase"
                disabled={Boolean(discount)}
                description={discount ? "Codes cannot be changed." : undefined}
              />
            </div>
            {/* Scope is omitted: the API accepts only all_products, so a
                picker would offer choices every one of which 400s. */}
            <SelectField form={form} name="type" label="Type" options={TYPE_OPTIONS} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                form={form}
                name="discountValue"
                label={type === "percentage" ? "Percent off" : "Amount off"}
                type="number"
                min={0}
                step="0.01"
                description={type === "percentage" ? "Up to 100." : undefined}
              />
              <TextField form={form} name="maxUsesPerCustomer" label="Uses per customer" optional type="number" min={1} step="1" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField form={form} name="maxTotalUses" label="Total uses" optional type="number" min={1} step="1" description="Blank means unlimited." />
              <div />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField form={form} name="startsAt" label="Starts" type="date" />
              <TextField form={form} name="endsAt" label="Ends" type="date" />
            </div>
            <TextField form={form} name="description" label="Internal note" optional multiline />
            <SwitchField form={form} name="isActive" label="Active" description="Turn off to retire the code without deleting it." />
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
          <Button type="submit" form="discount-form" disabled={isPending}>
            {isPending && <Spinner />}
            {discount ? "Save changes" : "Create discount"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CreateDiscountButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> New discount
      </Button>
      <DiscountFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
