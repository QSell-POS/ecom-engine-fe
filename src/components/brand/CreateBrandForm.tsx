"use client";

import { type FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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
import { createBrand } from "@/services/brands";

export function CreateBrandForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") || "").trim();
    const slug = String(formData.get("slug") || "").trim();

    if (!name || !slug) {
      return;
    }

    const payload = {
      name,
      slug,
      description:
        String(formData.get("description") || "").trim() || undefined,
      logo: String(formData.get("logo") || "").trim() || undefined,
      website: String(formData.get("website") || "").trim() || undefined,
      isActive: formData.get("isActive") === "on",
    };

    startTransition(async () => {
      try {
        await createBrand(payload);
        form.reset();
        setOpen(false);
        router.refresh();
      } catch (error) {
        console.error("Failed to create brand:", error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl bg-slate-900 text-white hover:bg-slate-800">
          Add Brand
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="border-b border-slate-200 px-6 py-4">
          <DialogTitle>Create brand</DialogTitle>
          <DialogDescription>Add a new brand to the catalog.</DialogDescription>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium text-slate-700"
                  >
                    Brand name
                    <span className="ml-1 text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g. RedStone"
                    required
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="slug"
                    className="text-sm font-medium text-slate-700"
                  >
                    Slug
                    <span className="ml-1 text-red-500">*</span>
                  </Label>
                  <Input
                    id="slug"
                    name="slug"
                    placeholder="redstone"
                    required
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-sm font-medium text-slate-700"
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Enter brand description"
                  className="min-h-28 rounded-xl border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="logo"
                    className="text-sm font-medium text-slate-700"
                  >
                    Logo URL
                  </Label>
                  <Input
                    id="logo"
                    name="logo"
                    type="url"
                    placeholder="https://example.com/logo.png"
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="website"
                    className="text-sm font-medium text-slate-700"
                  >
                    Website
                  </Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    placeholder="https://example.com"
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Label
                  htmlFor="isActive"
                  className="text-sm font-medium text-slate-700"
                >
                  Brand status
                </Label>
                <div className="flex items-center gap-2">
                  <Switch id="isActive" name="isActive" defaultChecked />
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
                  {isPending ? "Creating..." : "Create Brand"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
