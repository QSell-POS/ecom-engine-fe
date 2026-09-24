"use client";

import { Brand } from "@/types";
import { TbTrash } from "react-icons/tb";
import { deleteBrandFromForm } from "@/lib/api/brand/action";
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
} from "../ui/alert-dialog";
import { Button } from "../ui/button";

type DeleteBrandFormProps = {
  brand: Brand;
};

export function DeleteBrandForm({ brand }: DeleteBrandFormProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          aria-label={`Delete ${brand.name}`}
          variant="outline"
          size="sm"
          className="rounded-xl"
        >
          <TbTrash size={14} />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete brand?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the brand
            &ldquo;{brand.name}&rdquo;.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>

          <form action={deleteBrandFromForm} className="contents">
            <input type="hidden" name="id" value={brand.id} />
            <AlertDialogAction type="submit" variant="destructive">
              Delete
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
