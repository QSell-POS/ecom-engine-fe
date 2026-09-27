import type { FilterOption, GridColumn } from "./types";

/** Identity helper that gives full type inference for a column set. */
export function defineColumns<T>(columns: GridColumn<T>[]): GridColumn<T>[] {
  return columns;
}

export function getValue<T>(column: GridColumn<T>, row: T): unknown {
  return typeof column.accessor === "function" ? column.accessor(row) : row[column.accessor];
}

const numberFormat = new Intl.NumberFormat("en-US");
const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const dateTimeFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const currencyFormats = new Map<string, Intl.NumberFormat>();

function currencyFormat(code: string) {
  let format = currencyFormats.get(code);
  if (!format) {
    format = new Intl.NumberFormat("en-US", { style: "currency", currency: code });
    currencyFormats.set(code, format);
  }
  return format;
}

export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function toTime(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const time = value instanceof Date ? value.getTime() : new Date(String(value)).getTime();
  return Number.isFinite(time) ? time : null;
}

/** Plain-text representation used for display defaults, search and export. */
export function formatValue<T>(column: GridColumn<T>, row: T): string {
  const value = getValue(column, row);
  if (column.format) return column.format(value, row);
  if (value === null || value === undefined || value === "") return "";

  switch (column.type) {
    case "number": {
      const n = toNumber(value);
      return n === null ? "" : numberFormat.format(n);
    }
    case "currency": {
      const n = toNumber(value);
      return n === null ? "" : currencyFormat(column.currency ?? "USD").format(n);
    }
    case "percent": {
      const n = toNumber(value);
      return n === null ? "" : `${numberFormat.format(n)}%`;
    }
    case "date": {
      const t = toTime(value);
      return t === null ? "" : dateFormat.format(t);
    }
    case "datetime": {
      const t = toTime(value);
      return t === null ? "" : dateTimeFormat.format(t);
    }
    case "boolean":
      return value ? "Yes" : "No";
    case "status":
      return column.statuses?.[String(value)]?.label ?? String(value);
    case "tags":
      return Array.isArray(value) ? value.join(", ") : String(value);
    default:
      return String(value);
  }
}

export function isSortable<T>(column: GridColumn<T>) {
  return column.sortable ?? column.type !== "tags";
}

export function isSearchable<T>(column: GridColumn<T>) {
  return column.searchable ?? (!column.type || column.type === "text" || column.type === "status");
}

export function defaultAlign<T>(column: GridColumn<T>): "left" | "right" | "center" {
  if (column.align) return column.align;
  return column.type === "number" || column.type === "currency" || column.type === "percent" ? "right" : "left";
}

/** Multiselect options derived from the data (client mode) when not declared. */
export function deriveOptions<T>(column: GridColumn<T>, rows: T[]): FilterOption[] {
  if (column.filter?.type === "multiselect" && column.filter.options) return column.filter.options;
  if (column.statuses) {
    return Object.entries(column.statuses).map(([value, status]) => ({ value, label: status.label }));
  }
  const seen = new Map<string, string>();
  for (const row of rows) {
    const raw = getValue(column, row);
    const values = Array.isArray(raw) ? raw : [raw];
    for (const value of values) {
      if (value === null || value === undefined || value === "") continue;
      seen.set(String(value), String(value));
    }
  }
  return [...seen.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
