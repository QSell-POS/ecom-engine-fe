import { serializeQuery } from "./query";
import type { ClientDataSource, FilterOption, GridColumn, GridQuery, GridResult, ServerDataSource } from "./types";

/** All rows are in memory; search/filter/sort/paging run locally via applyQuery. */
export function clientSource<T>(rows: T[]): ClientDataSource<T> {
  return { mode: "client", rows };
}

/** Rows live on the server; each query change calls `load`. */
export function serverSource<T>(
  load: (query: GridQuery, signal?: AbortSignal) => Promise<GridResult<T>>,
  facets?: Record<string, FilterOption[]>,
): ServerDataSource<T> {
  return { mode: "server", load, facets };
}

/**
 * Server source backed by a GET endpoint that accepts the grid's own URL
 * format (?q=&sort=&page=&size=&f.col=) and returns `{ rows, total }`.
 * Any client (web, native app) can call the same endpoint.
 */
export function httpSource<T>(
  endpoint: string,
  columns: GridColumn<T>[],
  facets?: Record<string, FilterOption[]>,
): ServerDataSource<T> {
  return serverSource(async (query, signal) => {
    const params = serializeQuery(query, columns);
    params.set("page", String(query.page));
    params.set("size", String(query.pageSize));
    const response = await fetch(`${endpoint}?${params}`, { signal, headers: { Accept: "application/json" } });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error ?? `Request failed (${response.status})`);
    }
    return response.json();
  }, facets);
}
