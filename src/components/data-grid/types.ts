import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { GridColumn, GridDataSource, GridQuery, GridResult, GridSelection } from "@/lib/data-grid";

export type ActionOutcome = { ok: true; message?: string } | { ok: false; error: string };

export type ConfirmSpec = { title: string; description?: ReactNode; confirmLabel?: string };

export type RowAction<T> = {
  id: string;
  label: string;
  icon?: LucideIcon;
  tone?: "default" | "destructive";
  /** Mobile list: reveal by swiping. `trailing` = swipe left, `leading` = swipe right. */
  swipe?: "leading" | "trailing";
  hidden?: (row: T) => boolean;
  confirm?: (row: T) => ConfirmSpec;
  /** Update the UI immediately; rolled back automatically if `run` fails. */
  optimistic?: "remove" | ((row: T) => Partial<T>);
  run: (row: T) => void | Promise<ActionOutcome | void>;
};

export type BulkAction<T> = {
  id: string;
  label: string;
  icon?: LucideIcon;
  tone?: "default" | "destructive";
  confirm?: (count: number) => ConfirmSpec;
  optimistic?: "remove" | ((row: T) => Partial<T>);
  /**
   * `rows` are the resolved rows (client mode resolves "all matching" too).
   * In server mode an "all matching" selection carries the query instead.
   */
  run: (context: { selection: GridSelection; rows: T[] }) => void | Promise<ActionOutcome | void>;
};

export type WorkspaceContext = {
  /** Show another record (e.g. a related row) in the workspace. */
  open: (rowId: string) => void;
  /** Leave the workspace and return to the full table. */
  close: () => void;
};

/**
 * Master–detail workspace. Opening a row keeps the list on the left (same
 * search, filters, sort and page) and shows the record on the right. The
 * open record lives in the URL (`?open=<id>`), so it is shareable.
 */
export type WorkspaceConfig<T> = {
  /** The record body. The header (title, status, subtitle) comes from the columns' `mobile` roles. */
  render: (row: T, context: WorkspaceContext) => ReactNode;
  /** Shown in the header when there's no `media` column. */
  icon?: LucideIcon;
  /** Resolve a record that isn't in the loaded rows (deep links, other pages). */
  loadRow?: (rowId: string, signal: AbortSignal) => Promise<T | null>;
};

export type DataGridProps<T> = {
  /** Unique per grid: namespaces saved view preferences. */
  id: string;
  columns: GridColumn<T>[];
  source: GridDataSource<T>;
  getRowId: (row: T) => string;
  /** Web renderers per column id. Anything not listed uses the type-aware default. */
  cells?: Partial<Record<string, (row: T) => ReactNode>>;
  /** Nested rows (tree data). */
  getSubRows?: (row: T) => T[] | undefined;
  /** Expandable detail panel under a row. */
  renderDetail?: (row: T) => ReactNode;
  /** Primary action on a row (click / Enter / tap). `workspace` takes precedence. */
  rowHref?: (row: T) => string;
  onRowOpen?: (row: T) => void;
  workspace?: WorkspaceConfig<T>;
  rowActions?: RowAction<T>[];
  bulkActions?: BulkAction<T>[];
  defaultQuery?: Partial<GridQuery>;
  /** Server mode: first page rendered on the server for the current URL. */
  initialResult?: GridResult<T>;
  /** Mirror search/sort/filters/page into the URL (shareable, back/forward). */
  syncUrl?: boolean;
  searchPlaceholder?: string;
  noun: [singular: string, plural: string];
  /** Shown when there is no data at all (not when filters match nothing). */
  emptyState?: ReactNode;
  exportFileName?: string;
  onImport?: (records: Record<string, string>[]) => Promise<ActionOutcome>;
  /** Column headers shown as the expected CSV format in the import dialog. */
  importColumns?: string[];
  /** Called after a successful mutation, e.g. router.refresh() for server-provided rows. */
  onMutated?: () => void;
};
