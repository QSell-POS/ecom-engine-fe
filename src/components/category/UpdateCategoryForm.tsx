"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { updateCategoryAction } from "@/lib/api/category/action";
import { UpdateCategorySchema } from "@/lib/api/category/validation";
import type { Category } from "@/lib/api/category/types";

type InputValues = z.input<typeof UpdateCategorySchema>;
type Values = z.output<typeof UpdateCategorySchema>;

export function UpdateCategoryForm({ category }: { category: Category }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const form = useForm<InputValues, unknown, Values>({
    resolver: zodResolver(UpdateCategorySchema),
    defaultValues: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      image: category.image ?? "",
      description: category.description ?? "",
      isActive: category.isActive ?? true,
    },
  });
  function onSubmit(values: Values) {
    startTransition(async () => {
      const result = await updateCategoryAction(values);
      if (result?.data?.category) {
        setOpen(false);
        router.refresh();
      }
    });
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={`Edit ${category.name}`}
        >
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit category</DialogTitle>
          <DialogDescription>Update category details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Name" name="name" form={form} />
          <Field label="Slug" name="slug" form={form} />
          <Field label="Image URL" name="image" form={form} />
          <div className="space-y-2">
            <Label htmlFor={`description-${category.id}`}>Description</Label>
            <Textarea
              id={`description-${category.id}`}
              {...form.register("description")}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor={`active-${category.id}`}>Active</Label>
            <Controller
              name="isActive"
              control={form.control}
              render={({ field }) => (
                <Switch
                  id={`active-${category.id}`}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type FieldProps = {
  label: string;
  name: "name" | "slug" | "image";
  form: ReturnType<typeof useForm<InputValues, unknown, Values>>;
};
function Field({ label, name, form }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`${name}-${form.getValues("id")}`}>{label}</Label>
      <Input id={`${name}-${form.getValues("id")}`} {...form.register(name)} />
    </div>
  );
}
