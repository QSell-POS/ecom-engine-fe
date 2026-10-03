"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { TextField } from "@/components/common/FormFields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { createCustomerAction } from "@/lib/api/customer/action";
import { CreateCustomerSchema } from "@/lib/api/customer/validation";

type Input = z.input<typeof CreateCustomerSchema>;
type Output = z.output<typeof CreateCustomerSchema>;

/** Adding a customer by hand — phone orders, walk-ins, chat shoppers. */
export function CustomerFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<Input, unknown, Output>({
    resolver: zodResolver(CreateCustomerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", password: "" },
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
      const result = await createCustomerAction(values);
      if (!result?.data) {
        setServerError(result?.serverError ?? "Please check the highlighted fields.");
        return;
      }
      toast.success("Customer added", { description: values.email });
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New customer</DialogTitle>
          <DialogDescription>They can sign in later with a password reset, or shop as a guest.</DialogDescription>
        </DialogHeader>

        <form id="customer-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField form={form} name="firstName" label="First name" autoFocus />
              <TextField form={form} name="lastName" label="Last name" optional />
            </div>
            <TextField form={form} name="email" label="Email" type="email" placeholder="shopper@example.com" />
            <TextField form={form} name="phone" label="Phone" optional type="tel" />
            <TextField form={form} name="password" label="Password" optional type="password" description="Leave blank to let them set their own." />
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
          <Button type="submit" form="customer-form" disabled={isPending}>
            {isPending && <Spinner />}
            Add customer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CreateCustomerButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> New customer
      </Button>
      <CustomerFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
