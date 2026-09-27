// Framework-agnostic data grid model. Nothing in this folder imports React or
// the DOM, so the same column definitions, query model and query engine run
// in the browser, in route handlers/server components, and in a React Native
// app. Rendering layers (web table, mobile list, native FlatList) consume it.

export type GridTone = "success" | "warning" | "danger" | "info" | "neutral";

export type ColumnType =
  | "text"
  | "number"
  | "currency"
  | "percent"
  | "date"
  | "datetime"
  | "boolean"
  | "status"
  | "tags";

export type FilterOption = { value: string; label: string };

export type FilterDef =
  /** Free-text "contains" match on this column. */
  | { type: "text"; placeholder?: string }
  /** Pick any of the options. Omit options to derive them from the data (client mode). */
  | { type: "multiselect"; options?: FilterOption[] }
  /** Numeric min/max. */
  | { type: "range"; min?: number; max?: number; step?: number }
  | { type: "boolean"; trueLabel?: string; falseLabel?: string }
  | { type: "date-range" };

/**
 * How a column appears in list/card presentations (mobile web, native apps).
 * Columns without a role are left out of cards: the card is a summary, not a
 * squeezed row.
 */
export type MobileRole = "media" | "title" | "subtitle" | "status" | "trailing" | "meta";

export type GridColumn<T> = {
  id: string;
  header: string;
  /** Short explanation shown as a header tooltip. */
  description?: string;
  accessor: keyof T | ((row: T) => unknown);
  type?: ColumnType;
  /** Plain-text formatting override (used for display, search, export). */
  format?: (value: unknown, row: T) => string;
  currency?: string;
  /** For `status` columns: raw value → label + tone. */
  statuses?: Record<string, { label: string; tone: GridTone }>;

  sortable?: boolean;
  /** Included in the global search (defaults: true for text-like columns). */
  searchable?: boolean;
  filter?: FilterDef;

  hideable?: boolean;
  defaultHidden?: boolean;
  pinnable?: boolean;
  defaultPin?: "left" | "right";
  resizable?: boolean;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  align?: "left" | "right" | "center";

  mobile?: { role: MobileRole; order?: number; label?: string };
};

export type SortRule = { id: string; desc: boolean };

export type RangeValue = { min?: number; max?: number };
export type DateRangeValue = { from?: string; to?: string };
export type FilterValue = string | string[] | boolean | RangeValue | DateRangeValue;

export type GridQuery = {
  search: string;
  /** Multi-column sort in priority order. */
  sort: SortRule[];
  filters: Record<string, FilterValue>;
  /** 1-based. */
  page: number;
  pageSize: number;
};

export type GridResult<T> = { rows: T[]; total: number };

/** What a bulk action operates on: explicit ids, or "everything matching this query". */
export type GridSelection =
  | { kind: "ids"; ids: string[] }
  | { kind: "all"; query: GridQuery; excludedIds: string[]; total: number };

export type ClientDataSource<T> = {
  mode: "client";
  rows: T[];
};

export type ServerDataSource<T> = {
  mode: "server";
  /** Must honour search, sort, filters and pagination server-side. */
  load: (query: GridQuery, signal?: AbortSignal) => Promise<GridResult<T>>;
  /** Options for multiselect filters that don't declare them (server mode can't derive them). */
  facets?: Record<string, FilterOption[]>;
};

export type GridDataSource<T> = ClientDataSource<T> | ServerDataSource<T>;
