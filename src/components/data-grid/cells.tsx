import type { ReactNode } from "react";
import { StatusLabel } from "@/components/common/StatusLabel";
import { formatValue, getValue, type GridColumn } from "@/lib/data-grid";
import { cn } from "@/lib/utils";

const EMPTY = <span className="text-muted-foreground/70">—</span>;

/** Type-aware default rendering; `renderers[column.id]` always wins. */
export function renderCell<T>(
  column: GridColumn<T>,
  row: T,
  renderers?: Partial<Record<string, (row: T) => ReactNode>>,
): ReactNode {
  const custom = renderers?.[column.id];
  if (custom) return custom(row);

  const raw = getValue(column, row);
  if (column.type === "status") {
    const status = column.statuses?.[String(raw)];
    return status ? <StatusLabel tone={status.tone}>{status.label}</StatusLabel> : raw ? String(raw) : EMPTY;
  }
  if (column.type === "boolean") {
    return <StatusLabel tone={raw ? "success" : "neutral"}>{raw ? "Yes" : "No"}</StatusLabel>;
  }
  if (column.type === "tags" && Array.isArray(raw)) {
    if (raw.length === 0) return EMPTY;
    return (
      <span className="flex flex-wrap gap-1">
        {raw.map((tag) => (
          <span key={String(tag)} className="rounded-sm border px-1.5 py-px text-xs text-muted-foreground">
            {String(tag)}
          </span>
        ))}
      </span>
    );
  }

  const text = formatValue(column, row);
  if (!text) return EMPTY;
  const numeric = column.type === "number" || column.type === "currency" || column.type === "percent";
  const temporal = column.type === "date" || column.type === "datetime";
  return <span className={cn("truncate", numeric && "tabular-nums", temporal && "text-muted-foreground tabular-nums")}>{text}</span>;
}
