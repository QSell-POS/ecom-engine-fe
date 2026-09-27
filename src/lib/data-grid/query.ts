import { formatValue, getValue, isSearchable, toNumber, toTime } from "./columns";
import type {
  DateRangeValue,
  FilterValue,
  GridColumn,
  GridQuery,
  GridResult,
  RangeValue,
  SortRule,
} from "./types";

export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function createQuery(overrides: Partial<GridQuery> = {}): GridQuery {
  return { search: "", sort: [], filters: {}, page: 1, pageSize: DEFAULT_PAGE_SIZE, ...overrides };
}

/** Stable identity for a query (cache keys, request de-duplication). */
export function queryKey(query: GridQuery) {
  return JSON.stringify([query.search.trim(), query.sort, sortedEntries(query.filters), query.page, query.pageSize]);
}

/** Identity of the result *set* (ignores paging): selection resets when it changes. */
export function resultSetKey(query: GridQuery) {
  return JSON.stringify([query.search.trim(), sortedEntries(query.filters)]);
}

function sortedEntries(filters: Record<string, FilterValue>) {
  return Object.entries(filters)
    .filter(([, value]) => isActiveFilter(value))
    .sort(([a], [b]) => a.localeCompare(b));
}

export function isActiveFilter(value: FilterValue | undefined): boolean {
  if (value === undefined || value === null || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.values(value).some((v) => v !== undefined && v !== "" && v !== null);
  return true;
}

export function activeFilterCount(query: GridQuery) {
  return Object.values(query.filters).filter(isActiveFilter).length;
}

export function isRefined(query: GridQuery) {
  return query.search.trim() !== "" || activeFilterCount(query) > 0;
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

function matchesFilter<T>(column: GridColumn<T>, row: T, value: FilterValue): boolean {
  const raw = getValue(column, row);
  switch (column.filter?.type) {
    case "text":
      return formatValue(column, row).toLowerCase().includes(String(value).toLowerCase());
    case "multiselect": {
      const wanted = value as string[];
      const values = Array.isArray(raw) ? raw.map(String) : [String(raw ?? "")];
      return values.some((v) => wanted.includes(v));
    }
    case "range": {
      const { min, max } = value as RangeValue;
      const n = toNumber(raw);
      if (n === null) return false;
      return (min === undefined || n >= min) && (max === undefined || n <= max);
    }
    case "boolean":
      return Boolean(raw) === value;
    case "date-range": {
      const { from, to } = value as DateRangeValue;
      const t = toTime(raw);
      if (t === null) return false;
      const start = from ? toTime(from) : null;
      const end = to ? toTime(`${to}T23:59:59.999`) : null;
      return (start === null || t >= start) && (end === null || t <= end);
    }
    default:
      return true;
  }
}

function matchesRow<T>(columns: GridColumn<T>[], row: T, query: GridQuery, tokens: string[]) {
  for (const [id, value] of Object.entries(query.filters)) {
    if (!isActiveFilter(value)) continue;
    const column = columns.find((c) => c.id === id);
    if (column && !matchesFilter(column, row, value)) return false;
  }
  if (tokens.length === 0) return true;
  const haystack = columns
    .filter(isSearchable)
    .map((column) => formatValue(column, row).toLowerCase())
    .join(" \u0000 ");
  return tokens.every((token) => haystack.includes(token));
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

function sortValue<T>(column: GridColumn<T>, row: T): number | string | null {
  const raw = getValue(column, row);
  switch (column.type) {
    case "number":
    case "currency":
    case "percent":
      return toNumber(raw);
    case "date":
    case "datetime":
      return toTime(raw);
    case "boolean":
      return raw ? 1 : 0;
    default: {
      const text = formatValue(column, row);
      return text === "" ? null : text;
    }
  }
}

export function sortRows<T>(rows: T[], columns: GridColumn<T>[], sort: SortRule[]): T[] {
  const rules = sort
    .map((rule) => ({ rule, column: columns.find((c) => c.id === rule.id) }))
    .filter((entry): entry is { rule: SortRule; column: GridColumn<T> } => Boolean(entry.column));
  if (rules.length === 0) return rows;

  return rows
    .map((row, index) => ({ row, index, keys: rules.map(({ column }) => sortValue(column, row)) }))
    .sort((a, b) => {
      for (let i = 0; i < rules.length; i++) {
        const x = a.keys[i];
        const y = b.keys[i];
        if (x === y) continue;
        // Empty values always sink to the bottom, regardless of direction.
        if (x === null) return 1;
        if (y === null) return -1;
        const cmp = typeof x === "number" && typeof y === "number" ? x - y : collator.compare(String(x), String(y));
        if (cmp !== 0) return rules[i].rule.desc ? -cmp : cmp;
      }
      return a.index - b.index;
    })
    .map((entry) => entry.row);
}

// ---------------------------------------------------------------------------
// The engine
// ---------------------------------------------------------------------------

export type QueryOptions<T> = {
  /** Nested rows. A parent is kept when it or any descendant matches. */
  getSubRows?: (row: T) => T[] | undefined;
  /** Skip pagination (exports, "select all matching"). */
  paginate?: boolean;
};

export type TreeResult<T> = GridResult<T> & {
  /** Filtered + sorted children per parent (only when getSubRows is used). */
  children?: Map<T, T[]>;
};

export function applyQuery<T>(rows: T[], columns: GridColumn<T>[], query: GridQuery, options: QueryOptions<T> = {}): TreeResult<T> {
  const tokens = query.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const refined = tokens.length > 0 || activeFilterCount(query) > 0;
  const children = options.getSubRows ? new Map<T, T[]>() : undefined;

  function visit(level: T[]): T[] {
    const kept: T[] = [];
    for (const row of level) {
      const subRows = options.getSubRows?.(row) ?? [];
      const keptChildren = subRows.length ? visit(subRows) : [];
      const selfMatches = !refined || matchesRow(columns, row, query, tokens);
      if (selfMatches || keptChildren.length > 0) {
        kept.push(row);
        // Unrefined: all children (sorted). Refined: only matching descendants.
        if (children && keptChildren.length) children.set(row, keptChildren);
      }
    }
    return sortRows(kept, columns, query.sort);
  }

  const matched = visit(rows);
  const total = matched.length;
  if (options.paginate === false) return { rows: matched, total, children };

  const start = (Math.max(1, query.page) - 1) * query.pageSize;
  return { rows: matched.slice(start, start + query.pageSize), total, children };
}

// ---------------------------------------------------------------------------
// URL serialization: short, readable, shareable
//   ?q=shoe&sort=price.desc,name&page=2&size=50&f.status=active|draft&f.price=10..200
// ---------------------------------------------------------------------------

export function serializeQuery<T>(query: GridQuery, columns: GridColumn<T>[], defaults: GridQuery = createQuery()) {
  const params = new URLSearchParams();
  if (query.search.trim()) params.set("q", query.search.trim());
  if (query.sort.length) params.set("sort", query.sort.map((s) => (s.desc ? `${s.id}.desc` : s.id)).join(","));
  if (query.page > 1) params.set("page", String(query.page));
  if (query.pageSize !== defaults.pageSize) params.set("size", String(query.pageSize));

  for (const column of columns) {
    const value = query.filters[column.id];
    if (!column.filter || !isActiveFilter(value)) continue;
    const key = `f.${column.id}`;
    switch (column.filter.type) {
      case "multiselect":
        params.set(key, (value as string[]).join("|"));
        break;
      case "range": {
        const { min, max } = value as RangeValue;
        params.set(key, `${min ?? ""}..${max ?? ""}`);
        break;
      }
      case "date-range": {
        const { from, to } = value as DateRangeValue;
        params.set(key, `${from ?? ""}..${to ?? ""}`);
        break;
      }
      default:
        params.set(key, String(value));
    }
  }
  return params;
}

type ParamsLike = { get(name: string): string | null };

export function parseQuery<T>(params: ParamsLike, columns: GridColumn<T>[], defaults: GridQuery = createQuery()): GridQuery {
  const ids = new Set(columns.map((c) => c.id));
  const sort: SortRule[] =
    params
      .get("sort")
      ?.split(",")
      .map((part) => {
        const [id, dir] = part.split(".");
        return { id, desc: dir === "desc" };
      })
      .filter((rule) => ids.has(rule.id)) ?? defaults.sort;

  const filters: Record<string, FilterValue> = { ...defaults.filters };
  for (const column of columns) {
    const raw = params.get(`f.${column.id}`);
    if (raw === null || !column.filter) continue;
    switch (column.filter.type) {
      case "multiselect":
        filters[column.id] = raw.split("|").filter(Boolean);
        break;
      case "range": {
        const [min, max] = raw.split("..");
        filters[column.id] = { min: toNumber(min) ?? undefined, max: toNumber(max) ?? undefined };
        break;
      }
      case "date-range": {
        const [from, to] = raw.split("..");
        filters[column.id] = { from: from || undefined, to: to || undefined };
        break;
      }
      case "boolean":
        filters[column.id] = raw === "true";
        break;
      default:
        filters[column.id] = raw;
    }
  }

  const page = Number(params.get("page"));
  const pageSize = Number(params.get("size"));
  return {
    search: params.get("q") ?? defaults.search,
    sort,
    filters,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: PAGE_SIZE_OPTIONS.includes(pageSize) ? pageSize : defaults.pageSize,
  };
}
