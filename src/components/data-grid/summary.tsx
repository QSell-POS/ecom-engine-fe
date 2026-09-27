import type { ReactNode } from "react";
import { formatValue, type GridColumn, type MobileRole } from "@/lib/data-grid";
import { renderCell } from "./cells";
import type { DataGridController } from "./use-data-grid";

function columnsFor<T>(columns: GridColumn<T>[], role: MobileRole) {
  return columns
    .filter((c) => c.mobile?.role === role)
    .sort((a, b) => (a.mobile?.order ?? 0) - (b.mobile?.order ?? 0));
}

/** Columns placed by their `mobile` role: drives list cards, the master list and the record header. */
export function summaryRoles<T>(grid: DataGridController<T>) {
  const columns = grid.orderedColumns;
  return {
    media: columnsFor(columns, "media")[0],
    title: columnsFor(columns, "title")[0] ?? grid.visibleColumns.all[0],
    subtitle: columnsFor(columns, "subtitle"),
    status: columnsFor(columns, "status")[0],
    trailing: columnsFor(columns, "trailing")[0],
    meta: columnsFor(columns, "meta"),
  };
}

export type SummaryRoles<T> = ReturnType<typeof summaryRoles<T>>;

export function metaText<T>(roles: SummaryRoles<T>, row: T) {
  return roles.meta
    .map((column) => ({ column, text: formatValue(column, row) }))
    .filter((entry) => entry.text)
    .map(({ column, text }) => (column.mobile?.label === "" ? text : `${column.mobile?.label ?? column.header} ${text}`))
    .join(" · ");
}

/** Media + title/trailing + subtitle + status/meta: a row as a compact card. */
export function RowSummary<T>({ grid, row, roles }: { grid: DataGridController<T>; row: T; roles: SummaryRoles<T> }): ReactNode {
  const { cells } = grid.props;
  const meta = metaText(roles, row);
  return (
    <>
      {roles.media && <div className="shrink-0">{renderCell(roles.media, row, cells)}</div>}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <div className="min-w-0 truncate text-sm font-medium">{formatValue(roles.title, row)}</div>
          {roles.trailing && <div className="shrink-0 text-sm font-medium tabular-nums">{renderCell(roles.trailing, row, cells)}</div>}
        </div>
        {roles.subtitle.length > 0 && (
          <p className="truncate text-sm text-muted-foreground">
            {roles.subtitle.map((c) => formatValue(c, row)).filter(Boolean).join(" · ")}
          </p>
        )}
        {(roles.status || meta) && (
          <div className="mt-1 flex min-w-0 items-center gap-3 text-xs text-muted-foreground">
            {roles.status && <span className="shrink-0 [&_span]:text-xs">{renderCell(roles.status, row, cells)}</span>}
            {meta && <span className="truncate">{meta}</span>}
          </div>
        )}
      </div>
    </>
  );
}
