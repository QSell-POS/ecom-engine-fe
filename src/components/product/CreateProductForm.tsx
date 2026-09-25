"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  createProductAction,
  updateProductAction,
} from "@/lib/api/product/action";
import { CreateProductSchema } from "@/lib/api/product/validation";
import type { Brand } from "@/lib/api/brand/types";
import type { Category } from "@/lib/api/category/types";
import type { Product } from "@/lib/api/product/types";

type CreateProductInput = z.input<typeof CreateProductSchema>;
type CreateProductValues = z.output<typeof CreateProductSchema>;

type CreateProductFormProps = {
  brands: Brand[];
  categories: Category[];
  product?: Product;
};

export function CreateProductForm({
  brands,
  categories,
  product,
}: CreateProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string>();
  const form = useForm<CreateProductInput, unknown, CreateProductValues>({
    resolver: zodResolver(CreateProductSchema),
    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      description: product?.description ?? "",
      sku: product?.sku ?? "",
      barcode: product?.barcode ?? "",
      hsCode: product?.hsCode ?? "",
      sellingPrice: product?.sellingPrice ?? "",
      compareAtPrice: product?.compareAtPrice ?? "",
      stockAlert: product?.stockAlert ?? undefined,
      initialQuantity: product?.inventory?.quantityOnHand ?? undefined,
      attributes: product?.attributes ? JSON.stringify(product.attributes) : "",
      badges: product?.badges?.join(", ") ?? "",
      brandId: product?.brandId ?? "",
      categoryId: product?.categoryId ?? "",
      isActive: product?.isActive ?? true,
    },
  });

  function onSubmit(values: CreateProductValues) {
    startTransition(async () => {
      setSubmitError(undefined);
      const result = product
        ? await updateProductAction({ id: product.id, ...values })
        : await createProductAction(values);
      if (result?.data?.product) {
        router.push("/products");
        router.refresh();
      } else if (result?.serverError) {
        setSubmitError(result.serverError);
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Basic details</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field
            label="Product name"
            name="name"
            form={form}
            required
            placeholder="e.g. Canvas weekender"
          />
          <Field
            label="Slug"
            name="slug"
            form={form}
            required
            placeholder="canvas-weekender"
          />
          <Field
            label="SKU"
            name="sku"
            form={form}
            required
            placeholder="BAG-001"
          />
          <Field
            label="Barcode"
            name="barcode"
            form={form}
            placeholder="Optional barcode"
          />
          <Field
            label="HS code"
            name="hsCode"
            form={form}
            placeholder="Optional HS code"
          />
          <div className="space-y-2">
            <Label htmlFor="brandId">Brand</Label>
            <select
              id="brandId"
              {...form.register("brandId")}
              className="h-9 w-full rounded-md border border-input bg-input/20 px-2 text-sm"
            >
              <option value="">No brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoryId">Category</Label>
            <select
              id="categoryId"
              {...form.register("categoryId")}
              className="h-9 w-full rounded-md border border-input bg-input/20 px-2 text-sm"
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-5 space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...form.register("description")}
            placeholder="Describe this product"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Pricing and inventory
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Field
            label="Selling price"
            name="sellingPrice"
            form={form}
            required
            type="text"
            placeholder="0.00"
          />
          <Field
            label="Compare-at price"
            name="compareAtPrice"
            form={form}
            type="text"
            placeholder="0.00"
          />
          <Field
            label={product ? "Quantity on hand" : "Initial quantity"}
            name="initialQuantity"
            form={form}
            type="number"
            min="0"
            placeholder="0"
          />
          <Field
            label="Stock alert"
            name="stockAlert"
            form={form}
            type="number"
            min="0"
            placeholder="0"
          />
        </div>
        <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <Label htmlFor="isActive">Product status</Label>
            <p className="text-xs text-slate-500">
              Allow this product to be sold.
            </p>
          </div>
          <Controller
            name="isActive"
            control={form.control}
            render={({ field }) => (
              <Switch
                id="isActive"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Catalog metadata
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="badges">Badges</Label>
            <Input
              id="badges"
              {...form.register("badges")}
              placeholder="New, Featured, Sale"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attributes">Attributes JSON</Label>
            <Textarea
              id="attributes"
              {...form.register("attributes")}
              placeholder='[{"name":"Color","value":"Black"}]'
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        {submitError && (
          <p role="alert" className="mr-auto self-center text-sm text-red-600">
            {submitError}
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/products")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? product
              ? "Saving..."
              : "Creating..."
            : product
              ? "Save changes"
              : "Create product"}
        </Button>
      </div>
    </form>
  );
}

type FieldProps = {
  label: string;
  name: keyof CreateProductInput;
  form: ReturnType<
    typeof useForm<CreateProductInput, unknown, CreateProductValues>
  >;
  required?: boolean;
  type?: string;
  min?: string;
  placeholder?: string;
};

function Field({ label, name, form, required, ...props }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={String(name)}>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      <Input
        id={String(name)}
        {...form.register(name)}
        required={required}
        {...props}
      />
    </div>
  );
}
