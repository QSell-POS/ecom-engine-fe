"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { createCategoryAction, updateCategoryAction } from "@/lib/api/category/action";
import { parentCategoryOptions, type Category } from "@/lib/api/category/types";
import { CreateCategorySchema } from "@/lib/api/category/validation";
import { slugify } from "@/lib/slugify";

type Input = z.input<typeof CreateCategorySchema>;
type Output = z.output<typeof CreateCategorySchema>;

const TOP_LEVEL = "__top";

export function CategoryFormDialog({
  category,
  categories,
  open,
  onOpenChange,
}: {
  category?: Category;
  /** Every category, for the parent picker. */
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const parentOptions = parentCategoryOptions(categories, category?.id);

  const form = useForm<Input, unknown, Output>({
    resolver: zodResolver(CreateCategorySchema),
    defaultValues: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      parentId: category?.parentId ?? null,
      imageId: category?.imageId ?? category?.image?.id ?? undefined,
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
            <Field>
              <FieldLabel htmlFor="field-parentId">
                Parent category <span className="font-normal text-muted-foreground">(optional)</span>
              </FieldLabel>
              <Controller
                name="parentId"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={(field.value as string | null | undefined) || TOP_LEVEL}
                    // null, not undefined: that is how the API moves a category back to the top level.
                    onValueChange={(value) => field.onChange(value === TOP_LEVEL ? null : value)}
                  >
                    <SelectTrigger id="field-parentId" className="w-full">
                      <SelectValue>{parentOptions.find((o) => o.id === field.value)?.name ?? "None (top-level category)"}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TOP_LEVEL}>None (top-level category)</SelectItem>
                      {parentOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldDescription>Nest this category under another, e.g. &ldquo;T-Shirts&rdquo; under &ldquo;Kids&rdquo;.</FieldDescription>
            </Field>
            <TextField form={form} name="description" label="Description" optional multiline />
            <MediaField form={form} name="imageId" label="Image" optional folder="category" currentUrl={category?.image?.url} description="Choose from your media library, or upload a new image." />
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

export function CreateCategoryButton({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> New category
      </Button>
      <CategoryFormDialog categories={categories} open={open} onOpenChange={setOpen} />
    </>
  );
}
