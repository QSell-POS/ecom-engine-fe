"use client";

import { TbTrash } from "react-icons/tb";
import { deleteProductFromForm } from "@/lib/api/product/action";
import type { Product } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DeleteProductForm({ product }: { product: Product }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <div
          aria-label={`Delete ${product.name}`}
          className="border p-1 rounded-md cursor-pointer"
        >
          <TbTrash size={14} />
        </div>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete product?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete &ldquo;
            {product.name}&rdquo;.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={deleteProductFromForm} className="contents">
            <input type="hidden" name="id" value={product.id} />
            <AlertDialogAction type="submit" variant="destructive">
              Delete
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
