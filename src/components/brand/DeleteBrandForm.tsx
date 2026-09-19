import { Brand } from "@/types";
import { TbTrash } from "react-icons/tb";
import { deleteBrandFromForm } from "@/lib/api/brand/action";
import { Button } from "../ui/button";

type DeleteBrandFormProps = {
  brand: Brand;
};

export function DeleteBrandForm({ brand }: DeleteBrandFormProps) {
  return (
    <form action={deleteBrandFromForm}>
      <input type="hidden" name="id" value={brand.id} />
      <Button
        type="submit"
        aria-label={`Delete ${brand.name}`}
        variant="outline"
        size="sm"
        className="rounded-xl"
      >
        <TbTrash size={14} />
      </Button>
    </form>
  );
}
