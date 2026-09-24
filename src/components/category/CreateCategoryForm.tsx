"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { createCategoryAction } from "@/lib/api/category/action";
import { CreateCategorySchema } from "@/lib/api/category/validation";

type Values = z.output<typeof CreateCategorySchema>;
type InputValues = z.input<typeof CreateCategorySchema>;

export function CreateCategoryForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const form = useForm<InputValues, unknown, Values>({
    resolver: zodResolver(CreateCategorySchema),
    defaultValues: {
      name: "",
      slug: "",
      image: "",
      description: "",
      isActive: true,
    },
  });

  function onSubmit(values: Values) {
    startTransition(async () => {
      const result = await createCategoryAction(values);
      if (result?.data?.category) {
        form.reset();
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Category</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create category</DialogTitle>
          <DialogDescription>Add a category to the catalog.</DialogDescription>
        </DialogHeader>
        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Field label="Name" name="name" form={form} required />
              <Field label="Slug" name="slug" form={form} required />
              <Field label="Image URL" name="image" form={form} />
              <div className="space-y-2">
                <Label htmlFor="category-description">Description</Label>
                <Textarea
                  id="category-description"
                  {...form.register("description")}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <Label htmlFor="category-active">Active</Label>
                <Controller
                  name="isActive"
                  control={form.control}
                  render={({ field }) => (
                    <Switch
                      id="category-active"
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
                  {isPending ? "Creating..." : "Create category"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

type FieldProps = {
  label: string;
  name: "name" | "slug" | "image";
  form: ReturnType<typeof useForm<InputValues, unknown, Values>>;
  required?: boolean;
};
function Field({ label, name, form, required }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`category-${name}`}>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      <Input
        id={`category-${name}`}
        {...form.register(name)}
        required={required}
      />
    </div>
  );
}
