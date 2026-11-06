import type { Metadata } from "next";
import { ProductForm } from "@/components/product/ProductForm";
import { getBrandsAdmin } from "@/lib/api/brand";
import { getCategoriesAdmin } from "@/lib/api/category/service";
import { denyUnless } from "@/lib/api/rbac/access";

export const metadata: Metadata = { title: "New product" };

export default async function CreateProductPage() {
  const denied = await denyUnless("products:create");
  if (denied) return denied;

  const [{ data: brands }, { data: categories }] = await Promise.all([getBrandsAdmin(), getCategoriesAdmin()]);
  return <ProductForm brands={brands} categories={categories} />;
}
