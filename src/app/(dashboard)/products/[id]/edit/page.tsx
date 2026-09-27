import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/product/ProductForm";
import { getBrandsAdmin } from "@/lib/api/brand";
import { getCategoriesAdmin } from "@/lib/api/category/service";
import { getProductAdmin } from "@/lib/api/product";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, { data: brands }, { data: categories }] = await Promise.all([
    getProductAdmin(id),
    getBrandsAdmin(),
    getCategoriesAdmin(),
  ]);
  if (!product) notFound();

  return <ProductForm product={product} brands={brands} categories={categories} />;
}
