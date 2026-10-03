"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { PageHeader } from "@/components/common/PageHeader";
import { SwitchField, TextField } from "@/components/common/FormFields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { createProductAction, updateProductAction } from "@/lib/api/product/action";
import { PRODUCT_ROUTES } from "@/lib/api/product/constants";
import { CreateProductSchema } from "@/lib/api/product/validation";
import type { Brand } from "@/lib/api/brand/types";
import type { Category } from "@/lib/api/category/types";
import type { Product } from "@/lib/api/product/types";
import { slugify } from "@/lib/slugify";

type Input = z.input<typeof CreateProductSchema>;
type Output = z.output<typeof CreateProductSchema>;

const NONE = "__none";
const ADVANCED_FIELDS = ["slug", "hsCode", "badges", "attributes"];

function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-md border bg-card p-6">
      <div className="mb-5 space-y-1">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <FieldGroup className="gap-5">{children}</FieldGroup>
    </section>
  );
}

function OptionSelect({
  form,
  name,
  label,
  placeholder,
  options,
}: {
  form: ReturnType<typeof useForm<Input, unknown, Output>>;
  name: "brandId" | "categoryId";
  label: string;
  placeholder: string;
  options: { id: string; name: string }[];
}) {
  return (
    <Field>
      <FieldLabel htmlFor={`field-${name}`}>{label}</FieldLabel>
      <Controller
        name={name}
        control={form.control}
        render={({ field }) => (
          <Select
            value={(field.value as string) || NONE}
            onValueChange={(value) => field.onChange(value === NONE ? "" : value)}
          >
            <SelectTrigger id={`field-${name}`} className="w-full">
              <SelectValue>{options.find((o) => o.id === field.value)?.name ?? placeholder}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>{placeholder}</SelectItem>
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </Field>
  );
}

export function ProductForm({
  brands,
  categories,
  product,
}: {
  brands: Brand[];
  categories: Category[];
  product?: Product;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<Input, unknown, Output>({
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
      initialQuantity: product?.inventory?.quantity ?? undefined,
      attributes: product?.attributes?.length ? JSON.stringify(product.attributes) : "",
      badges: product?.badges?.join(", ") ?? "",
      brandId: product?.brandId ?? "",
      categoryId: product?.categoryId ?? "",
      isActive: product?.isActive ?? true,
    },
  });

  const [advancedOpen, setAdvancedOpen] = useState(false);

  function onSubmit(values: Output) {
    setSubmitError(null);
    startTransition(async () => {
      const result = product
        ? await updateProductAction({ id: product.id, ...values })
        : await createProductAction(values);
      if (!result?.data?.product) {
        setSubmitError(result?.serverError ?? "Please review the highlighted fields.");
        return;
      }
      toast.success(product ? "Product saved" : "Product created", { description: values.name });
      // Back to the record in the products workspace.
      router.push(PRODUCT_ROUTES.detail(result.data.product.id));
      router.refresh();
    });
  }

  return (
    <form
      id="product-form"
      noValidate
      onSubmit={form.handleSubmit(onSubmit, (errors) => {
        setSubmitError(null);
        // Reveal collapsed fields that failed validation.
        if (ADVANCED_FIELDS.some((key) => key in errors)) setAdvancedOpen(true);
      })}
    >
      <PageHeader
        title={product ? product.name : "New product"}
        description={product ? `SKU ${product.sku}` : "Add a product to your catalog."}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={PRODUCT_ROUTES.list}>{product ? "Discard" : "Cancel"}</Link>
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner />}
              {product ? "Save" : "Create product"}
            </Button>
          </>
        }
      />

      {submitError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>{product ? "Couldn't save this product" : "Couldn't create this product"}</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <FormSection title="Details">
            <TextField
              form={form}
              name="name"
              label="Name"
              placeholder="e.g. Canvas weekender bag"
              onValueChange={(value) => {
                // Keep the handle in sync with the name until the user edits it.
                if (!product && !form.getFieldState("slug").isDirty) form.setValue("slug", slugify(value));
              }}
            />
            <TextField form={form} name="description" label="Description" optional multiline />
          </FormSection>

          <FormSection title="Pricing">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField form={form} name="sellingPrice" label="Price" inputMode="decimal" placeholder="0.00" />
              <TextField
                form={form}
                name="compareAtPrice"
                label="Compare-at price"
                optional
                inputMode="decimal"
                placeholder="0.00"
                description="Shown crossed out to indicate a sale."
              />
            </div>
          </FormSection>

          <FormSection title="Inventory">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField form={form} name="sku" label="SKU" placeholder="BAG-001" />
              <TextField form={form} name="barcode" label="Barcode" optional placeholder="ISBN, UPC, GTIN…" />
              <TextField
                form={form}
                name="initialQuantity"
                label={product ? "Quantity on hand" : "Starting quantity"}
                type="number"
                min={0}
                placeholder="0"
              />
              <TextField
                form={form}
                name="stockAlert"
                label="Low stock alert"
                optional
                type="number"
                min={0}
                placeholder="0"
                description="Flag the product when stock reaches this level."
              />
            </div>
          </FormSection>

          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="rounded-md border bg-card">
            <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-md px-6 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span>
                <span className="block text-sm font-semibold">More options</span>
                <span className="block text-sm text-muted-foreground">URL handle, customs code, badges and attributes.</span>
              </span>
              <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <FieldGroup className="gap-5 border-t px-6 pt-5 pb-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    form={form}
                    name="slug"
                    label="URL handle"
                    placeholder="canvas-weekender-bag"
                  />
                  <TextField form={form} name="hsCode" label="HS code" optional placeholder="4202.92" />
                </div>
                <TextField
                  form={form}
                  name="badges"
                  label="Badges"
                  optional
                  placeholder="New, Bestseller"
                  description="Comma-separated labels shown on product cards."
                />
                <TextField
                  form={form}
                  name="attributes"
                  label="Attributes"
                  optional
                  multiline
                  placeholder='[{"name":"Color","value":"Black"}]'
                  description="JSON list of name and value pairs."
                />
              </FieldGroup>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="space-y-6 lg:sticky lg:top-8">
          <FormSection title="Status">
            <SwitchField
              form={form}
              name="isActive"
              label="Active"
              description="Active products can be seen and bought on your storefront."
            />
          </FormSection>
          <FormSection title="Organization">
            <OptionSelect form={form} name="categoryId" label="Category" placeholder="No category" options={categories} />
            <OptionSelect form={form} name="brandId" label="Brand" placeholder="No brand" options={brands} />
          </FormSection>
        </div>
      </div>
    </form>
  );
}
