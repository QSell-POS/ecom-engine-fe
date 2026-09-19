"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { deleteBrandAction } from "@/lib/api/brand/action";

type DeleteBrandButtonProps = {
  brandId: string;
  brandName: string;
};

export function DeleteBrandButton({
  brandId,
  brandName,
}: DeleteBrandButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleDelete() {
    const confirmed = window.confirm(`Delete brand "${brandName}"?`);
    if (!confirmed) return;

    try {
      await deleteBrandAction({ id: brandId });
      router.refresh();
    } catch (error) {
      console.error("Failed to delete brand:", error);
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      className="w-20 rounded-xl"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await handleDelete();
        });
      }}
    >
      {isPending ? "Deleting..." : "Delete"}
    </Button>
  );
}
