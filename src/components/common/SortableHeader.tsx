import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

type SortableColumn = {
  getIsSorted: () => false | "asc" | "desc";
  toggleSorting: () => void;
};

export function SortableHeader({
  column,
  label,
}: {
  column: SortableColumn;
  label: string;
}) {
  const sorted = column.getIsSorted();
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 font-medium"
      onClick={() => column.toggleSorting()}
    >
      {label}
      {sorted === "asc" ? (
        <ArrowUp className="size-3" />
      ) : sorted === "desc" ? (
        <ArrowDown className="size-3" />
      ) : (
        <ArrowUpDown className="size-3 text-slate-400" />
      )}
    </button>
  );
}
