import type { Metadata } from "next";
import { ProductForm } from "@/components/product/ProductForm";
import { getBrandsAdmin } from "@/lib/api/brand";
import { getCategoriesAdmin } from "@/lib/api/category/service";

export const metadata: Metadata = { title: "New product" };

export default async function CreateProductPage() {
  const [{ data: brands }, { data: categories }] = await Promise.all([getBrandsAdmin(), getCategoriesAdmin()]);
  return <ProductForm brands={brands} categories={categories} />;
}
