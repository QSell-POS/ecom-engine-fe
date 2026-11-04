"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { SwitchField, TextField } from "@/components/common/FormFields";
import { MediaField } from "@/components/common/MediaField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { createBrandAction, updateBrandAction } from "@/lib/api/brand/action";
import type { Brand } from "@/lib/api/brand/types";
import { CreateBrandSchema } from "@/lib/api/brand/validation";
import { slugify } from "@/lib/slugify";

type Input = z.input<typeof CreateBrandSchema>;
type Output = z.output<typeof CreateBrandSchema>;

export function BrandFormDialog({
  brand,
  open,
  onOpenChange,
}: {
  brand?: Brand;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<Input, unknown, Output>({
    resolver: zodResolver(CreateBrandSchema),
    defaultValues: {
      name: brand?.name ?? "",
      slug: brand?.slug ?? "",
      description: brand?.description ?? "",
      logoId: brand?.logoId ?? brand?.logo?.id ?? undefined,
      website: brand?.website ?? "",
      isActive: brand?.isActive ?? true,
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
      const result = brand
        ? await updateBrandAction({ id: brand.id, ...values })
        : await createBrandAction(values);
      if (!result?.data) {
        setServerError(result?.serverError ?? "Please check the highlighted fields.");
        return;
      }
      toast.success(brand ? "Brand updated" : "Brand created", { description: values.name });
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{brand ? "Edit brand" : "New brand"}</DialogTitle>
          <DialogDescription>
            {brand ? "Changes apply everywhere this brand is shown." : "Brands help customers find products they trust."}
          </DialogDescription>
        </DialogHeader>

        <form id="brand-form" onSubmit={form.handleSubmit(onSubmit, () => setServerError(null))} noValidate>
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                form={form}
                name="name"
                label="Name"
                placeholder="e.g. Northwind"
                autoFocus
                onValueChange={(value) => {
                  // Keep the handle in sync with the name until the user edits it.
                  if (!brand && !form.getFieldState("slug").isDirty) form.setValue("slug", slugify(value));
                }}
              />
              <TextField
                form={form}
                name="slug"
                label="URL handle"
                placeholder="northwind"
              />
            </div>
            <TextField form={form} name="description" label="Description" optional multiline />
            <TextField form={form} name="website" label="Website" optional type="url" placeholder="https://" />
            <MediaField form={form} name="logoId" label="Logo" optional folder="brand" currentUrl={brand?.logo?.url} description="Choose from your media library, or upload a new image." />
            <SwitchField
              form={form}
              name="isActive"
              label="Active"
              description="Inactive brands are hidden from your storefront."
            />
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
          <Button type="submit" form="brand-form" disabled={isPending}>
            {isPending && <Spinner />}
            {brand ? "Save changes" : "Create brand"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CreateBrandButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> New brand
      </Button>
      <BrandFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
