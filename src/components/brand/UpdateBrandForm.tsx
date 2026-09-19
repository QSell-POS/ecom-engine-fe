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
import { Brand } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { updateBrandAction } from "@/lib/api/brand/action";
import { UpdateBrandSchema } from "@/lib/api/brand/validation";
import { TbPencil } from "react-icons/tb";

type UpdateBrandInput = z.input<typeof UpdateBrandSchema>;
type UpdateBrandValues = z.output<typeof UpdateBrandSchema>;

type UpdateBrandFormProps = {
  brand: Brand;
};

export function UpdateBrandForm({ brand }: UpdateBrandFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const form = useForm<UpdateBrandInput, unknown, UpdateBrandValues>({
    resolver: zodResolver(UpdateBrandSchema),
    defaultValues: {
      id: brand.id,
      name: brand.name,
      slug: brand.slug ?? "",
      description: brand.description ?? "",
      logo: brand.logo,
      website: brand.website,
      isActive: Boolean(brand.isActive),
    },
  });

  function onSubmit(values: UpdateBrandValues) {
    startTransition(async () => {
      const result = await updateBrandAction(values);
      if (result?.data?.brand) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl">
          <TbPencil />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="border-b border-slate-200 px-6 py-4">
          <DialogTitle>Edit brand</DialogTitle>
          <DialogDescription>
            Update the selected brand details.
          </DialogDescription>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5 p-6"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor={`edit-name-${brand.id}`}
                    className="text-sm font-medium text-slate-700"
                  >
                    Brand name
                    <span className="ml-1 text-red-500">*</span>
                  </Label>
                  <Input
                    id={`edit-name-${brand.id}`}
                    {...form.register("name")}
                    defaultValue={brand.name}
                    required
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 px-3 text-sm text-slate-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor={`edit-slug-${brand.id}`}
                    className="text-sm font-medium text-slate-700"
                  >
                    Slug
                    <span className="ml-1 text-red-500">*</span>
                  </Label>
                  <Input
                    id={`edit-slug-${brand.id}`}
                    {...form.register("slug")}
                    defaultValue={brand.slug ?? ""}
                    required
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 px-3 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`edit-description-${brand.id}`}
                  className="text-sm font-medium text-slate-700"
                >
                  Description
                </Label>
                <Textarea
                  id={`edit-description-${brand.id}`}
                  {...form.register("description")}
                  defaultValue={brand.description ?? ""}
                  className="min-h-28 rounded-xl border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor={`edit-logo-${brand.id}`}
                    className="text-sm font-medium text-slate-700"
                  >
                    Logo URL
                  </Label>
                  <Input
                    id={`edit-logo-${brand.id}`}
                    {...form.register("logo")}
                    type="url"
                    defaultValue={brand.logo ?? ""}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 px-3 text-sm text-slate-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor={`edit-website-${brand.id}`}
                    className="text-sm font-medium text-slate-700"
                  >
                    Website
                  </Label>
                  <Input
                    id={`edit-website-${brand.id}`}
                    {...form.register("website")}
                    type="url"
                    defaultValue={brand.website ?? ""}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 px-3 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Label
                  htmlFor={`edit-active-${brand.id}`}
                  className="text-sm font-medium text-slate-700"
                >
                  Brand status
                </Label>
                <div className="flex items-center gap-2">
                  <Controller
                    name="isActive"
                    control={form.control}
                    render={({ field }) => (
                      <Switch
                        id={`edit-active-${brand.id}`}
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <span className="text-sm text-slate-600">Active</span>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
