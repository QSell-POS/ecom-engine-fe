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
import { createCategoryAction, updateCategoryAction } from "@/lib/api/category/action";
import type { Category } from "@/lib/api/category/types";
import { CreateCategorySchema } from "@/lib/api/category/validation";
import { slugify } from "@/lib/slugify";

type Input = z.input<typeof CreateCategorySchema>;
type Output = z.output<typeof CreateCategorySchema>;

export function CategoryFormDialog({
  category,
  open,
  onOpenChange,
}: {
  category?: Category;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<Input, unknown, Output>({
    resolver: zodResolver(CreateCategorySchema),
    defaultValues: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      imageId: category?.image?.id ?? undefined,
      description: category?.description ?? "",
      isActive: category?.isActive ?? true,
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
      const result = category
        ? await updateCategoryAction({ id: category.id, ...values })
        : await createCategoryAction(values);
      if (!result?.data) {
        setServerError(result?.serverError ?? "Please check the highlighted fields.");
        return;
      }
      toast.success(category ? "Category updated" : "Category created", { description: values.name });
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{category ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>
            {category ? "Changes apply everywhere this category is shown." : "Categories organize products in your store navigation."}
          </DialogDescription>
        </DialogHeader>

        <form id="category-form" onSubmit={form.handleSubmit(onSubmit, () => setServerError(null))} noValidate>
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                form={form}
                name="name"
                label="Name"
                placeholder="e.g. Outerwear"
                autoFocus
                onValueChange={(value) => {
                  // Keep the handle in sync with the name until the user edits it.
                  if (!category && !form.getFieldState("slug").isDirty) form.setValue("slug", slugify(value));
                }}
              />
              <TextField
                form={form}
                name="slug"
                label="URL handle"
                placeholder="outerwear"
              />
            </div>
            <TextField form={form} name="description" label="Description" optional multiline />
            <MediaField form={form} name="imageId" label="Image" optional folder="category" currentUrl={category?.image?.url} description="Uploaded to your media library." />
            <SwitchField
              form={form}
              name="isActive"
              label="Active"
              description="Inactive categories are hidden from your storefront."
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
          <Button type="submit" form="category-form" disabled={isPending}>
            {isPending && <Spinner />}
            {category ? "Save changes" : "Create category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CreateCategoryButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> New category
      </Button>
      <CategoryFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
