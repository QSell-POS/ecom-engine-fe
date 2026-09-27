"use client";

import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  applyQuery,
  createQuery,
  isRefined,
  parseQuery,
  queryKey,
  resultSetKey,
  serializeQuery,
  type FilterValue,
  type GridColumn,
  type GridQuery,
  type GridSelection,
  type SortRule,
} from "@/lib/data-grid";
import { usePersistedState } from "./hooks";
import type { ActionOutcome, DataGridProps } from "./types";

export type Density = "comfortable" | "compact";
export type Presentation = "auto" | "table" | "list";

type ViewPrefs = {
  hidden: string[];
  order: string[];
  pinLeft: string[];
  pinRight: string[];
  widths: Record<string, number>;
  density: Density;
  presentation: Presentation;
};

type ServerState<T> = { key: string; rows: T[]; total: number; error?: string };

const SEARCH_DEBOUNCE_MS = 250;
const OPEN_PARAM = "open";

function isGridParam(key: string) {
  return key === "q" || key === "sort" || key === "page" || key === "size" || key.startsWith("f.");
}

function flatten<T>(rows: T[], getSubRows?: (row: T) => T[] | undefined): T[] {
  if (!getSubRows) return rows;
  return rows.flatMap((row) => [row, ...flatten(getSubRows(row) ?? [], getSubRows)]);
}

export function useDataGrid<T>(props: DataGridProps<T>) {
  const { id, columns, source, getRowId, getSubRows, syncUrl = true, onMutated } = props;

  // ---------------------------------------------------------------- query
  const [defaults] = useState(() => createQuery(props.defaultQuery));
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [localQuery, setLocalQuery] = useState(defaults);
  const query = useMemo(
    () => (syncUrl ? parseQuery(searchParams, columns, defaults) : localQuery),
    [syncUrl, searchParams, columns, defaults, localQuery],
  );

  const commitQuery = useCallback(
    (next: GridQuery) => {
      if (!syncUrl) {
        setLocalQuery(next);
        return;
      }
      // Native history keeps useSearchParams in sync without a server round-trip.
      const params = new URLSearchParams(window.location.search);
      for (const key of [...params.keys()]) if (isGridParam(key)) params.delete(key);
      serializeQuery(next, columns, defaults).forEach((value, key) => params.set(key, value));
      const search = params.toString();
      window.history.replaceState(null, "", search ? `${pathname}?${search}` : pathname);
    },
    [syncUrl, columns, defaults, pathname],
  );

  const update = useCallback(
    (patch: Partial<GridQuery>, { resetPage = true } = {}) =>
      commitQuery({ ...query, ...patch, page: resetPage ? 1 : (patch.page ?? query.page) }),
    [commitQuery, query],
  );

  // Search input is local for instant typing; the query updates after a pause.
  const [searchInput, setSearchInput] = useState(query.search);
  const [syncedSearch, setSyncedSearch] = useState(query.search);
  if (syncedSearch !== query.search) {
    setSyncedSearch(query.search);
    setSearchInput(query.search);
  }
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const setSearch = useCallback(
    (value: string, { immediate = false } = {}) => {
      setSearchInput(value);
      clearTimeout(searchTimer.current);
      if (immediate) update({ search: value });
      else searchTimer.current = setTimeout(() => update({ search: value }), SEARCH_DEBOUNCE_MS);
    },
    [update],
  );
  useEffect(() => () => clearTimeout(searchTimer.current), []);

  /** Click: sort by this column only. Shift+click: add/toggle as a secondary sort. */
  const toggleSort = useCallback(
    (columnId: string, multi: boolean) => {
      const existing = query.sort.find((s) => s.id === columnId);
      let sort: SortRule[];
      if (multi) {
        if (!existing) sort = [...query.sort, { id: columnId, desc: false }];
        else if (!existing.desc) sort = query.sort.map((s) => (s.id === columnId ? { ...s, desc: true } : s));
        else sort = query.sort.filter((s) => s.id !== columnId);
      } else if (!existing || query.sort.length > 1) sort = [{ id: columnId, desc: existing ? !existing.desc : false }];
      else if (!existing.desc) sort = [{ id: columnId, desc: true }];
      else sort = [];
      update({ sort }, { resetPage: false });
    },
    [query.sort, update],
  );

  const setSort = useCallback((sort: SortRule[]) => update({ sort }, { resetPage: false }), [update]);

  const setFilter = useCallback(
    (columnId: string, value: FilterValue | undefined) => {
      const filters = { ...query.filters };
      if (value === undefined) delete filters[columnId];
      else filters[columnId] = value;
      update({ filters });
    },
    [query.filters, update],
  );

  const clearRefinements = useCallback(() => {
    clearTimeout(searchTimer.current);
    setSearchInput("");
    update({ search: "", filters: {} });
  }, [update]);

  // ----------------------------------------------------------------- data
  const clientResult = useMemo(
    () => (source.mode === "client" ? applyQuery(source.rows, columns, query, { getSubRows }) : null),
    [source, columns, query, getSubRows],
  );

  const [reloadToken, setReloadToken] = useState(0);
  const fullKey = `${queryKey(query)}#${reloadToken}`;
  const [serverState, setServerState] = useState<ServerState<T> | null>(() =>
    props.initialResult ? { key: fullKey, ...props.initialResult } : null,
  );

  const load = useEffectEvent((q: GridQuery, signal: AbortSignal) =>
    source.mode === "server" ? source.load(q, signal) : Promise.resolve({ rows: [], total: 0 }),
  );

  useEffect(() => {
    if (source.mode !== "server" || serverState?.key === fullKey) return;
    const controller = new AbortController();
    load(query, controller.signal)
      .then((result) => setServerState({ key: fullKey, ...result }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setServerState((previous) => ({
          key: fullKey,
          rows: previous?.rows ?? [],
          total: previous?.total ?? 0,
          error: error instanceof Error ? error.message : "Something went wrong",
        }));
      });
    return () => controller.abort();
  }, [source.mode, fullKey, query, serverState?.key]);

  const loading = source.mode === "server" && serverState?.key !== fullKey;
  const error = source.mode === "server" && serverState?.key === fullKey ? serverState.error : undefined;
  const base = clientResult ?? { rows: serverState?.rows ?? [], total: serverState?.total ?? 0 };
  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  // ---------------------------------------------------- optimistic overrides
  const [overrides, setOverrides] = useState(() => ({ removed: new Set<string>(), patches: new Map<string, Partial<T>>() }));
  const dataVersion = source.mode === "client" ? source.rows : serverState;
  const [seenVersion, setSeenVersion] = useState(dataVersion);
  if (seenVersion !== dataVersion) {
    // Fresh data from the source supersedes optimistic guesses.
    setSeenVersion(dataVersion);
    setOverrides({ removed: new Set(), patches: new Map() });
  }

  const applyOverrides = useCallback(
    (list: T[]) =>
      list
        .filter((row) => !overrides.removed.has(getRowId(row)))
        .map((row) => {
          const patch = overrides.patches.get(getRowId(row));
          return patch ? { ...row, ...patch } : row;
        }),
    [overrides, getRowId],
  );

  const rows = useMemo(() => applyOverrides(base.rows), [applyOverrides, base.rows]);
  const removedOnPage = base.rows.length - rows.length;
  const total = Math.max(0, base.total - removedOnPage);
  const children = clientResult?.children;
  const getChildren = useCallback(
    (row: T): T[] => {
      const list = children ? (children.get(row) ?? []) : (getSubRows?.(row) ?? []);
      return applyOverrides(list);
    },
    [children, getSubRows, applyOverrides],
  );

  const mutate = useCallback(
    async (
      targetRows: T[],
      optimistic: "remove" | ((row: T) => Partial<T>) | undefined,
      commit: () => void | Promise<ActionOutcome | void>,
    ) => {
      const ids = targetRows.map(getRowId);
      if (optimistic) {
        setOverrides((previous) => {
          const removed = new Set(previous.removed);
          const patches = new Map(previous.patches);
          for (const row of targetRows) {
            const rowId = getRowId(row);
            if (optimistic === "remove") removed.add(rowId);
            else patches.set(rowId, { ...patches.get(rowId), ...optimistic(row) });
          }
          return { removed, patches };
        });
      }
      let outcome: ActionOutcome | void;
      try {
        outcome = await commit();
      } catch (cause) {
        outcome = { ok: false, error: cause instanceof Error ? cause.message : "Something went wrong" };
      }
      if (outcome && !outcome.ok) {
        if (optimistic) {
          setOverrides((previous) => {
            const removed = new Set(previous.removed);
            const patches = new Map(previous.patches);
            ids.forEach((rowId) => {
              removed.delete(rowId);
              patches.delete(rowId);
            });
            return { removed, patches };
          });
        }
        toast.error(outcome.error);
        return false;
      }
      if (outcome?.message) toast.success(outcome.message);
      if (source.mode === "server") reload();
      onMutated?.();
      return true;
    },
    [getRowId, onMutated, reload, source.mode],
  );

  // -------------------------------------------------------------- workspace
  const router = useRouter();
  const [localOpenId, setLocalOpenId] = useState<string | null>(null);
  const openId = props.workspace ? (syncUrl ? searchParams.get(OPEN_PARAM) : localOpenId) : null;

  /** Entering the workspace adds a history entry (Back returns to the table); moving between records doesn't. */
  const openRow = useCallback(
    (rowId: string | null, { push = false } = {}) => {
      if (!syncUrl) {
        setLocalOpenId(rowId);
        return;
      }
      const params = new URLSearchParams(window.location.search);
      if (rowId) params.set(OPEN_PARAM, rowId);
      else params.delete(OPEN_PARAM);
      const search = params.toString();
      const url = search ? `${pathname}?${search}` : pathname;
      if (push) window.history.pushState(null, "", url);
      else window.history.replaceState(null, "", url);
    },
    [syncUrl, pathname],
  );

  /** A row's primary action: open it in the workspace, follow its link, or call onRowOpen. */
  const openItem = useCallback(
    (row: T) => {
      if (props.workspace) openRow(getRowId(row), { push: !openId });
      else if (props.rowHref) router.push(props.rowHref(row));
      else props.onRowOpen?.(row);
    },
    [props, openRow, getRowId, openId, router],
  );

  // Every loaded row by id (client mode: the whole data set, not just the page),
  // optimistic changes applied. Memoized so lookups return stable references.
  const rowIndex = useMemo(() => {
    const index = new Map<string, T>();
    const add = (list: T[]) => {
      for (const row of list) {
        index.set(getRowId(row), row);
        add(applyOverrides(getSubRows?.(row) ?? []));
      }
    };
    add(source.mode === "client" ? applyOverrides(source.rows) : rows);
    return index;
  }, [source, rows, applyOverrides, getSubRows, getRowId]);
  const findRow = useCallback((rowId: string): T | undefined => rowIndex.get(rowId), [rowIndex]);

  // -------------------------------------------------------------- selection
  const [selection, setSelection] = useState(() => ({ all: false, ids: new Map<string, T>() }));
  const setKey = resultSetKey(query);
  const [selectionSetKey, setSelectionSetKey] = useState(setKey);
  if (selectionSetKey !== setKey) {
    // A different result set: a selection made against the old one is stale.
    setSelectionSetKey(setKey);
    setSelection({ all: false, ids: new Map() });
  }

  const isSelected = useCallback(
    (row: T) => (selection.all ? !selection.ids.has(getRowId(row)) : selection.ids.has(getRowId(row))),
    [selection, getRowId],
  );
  const selectedCount = selection.all ? Math.max(0, total - selection.ids.size) : selection.ids.size;

  const toggleRow = useCallback(
    (row: T, value?: boolean) =>
      setSelection((previous) => {
        const ids = new Map(previous.ids);
        const rowId = getRowId(row);
        const currentlySelected = previous.all ? !ids.has(rowId) : ids.has(rowId);
        const next = value ?? !currentlySelected;
        // In "all" mode the map holds exclusions.
        if (next !== previous.all) ids.set(rowId, row);
        else ids.delete(rowId);
        return { all: previous.all, ids };
      }),
    [getRowId],
  );

  const pageState: "none" | "some" | "all" = useMemo(() => {
    const count = rows.filter(isSelected).length;
    return count === 0 ? "none" : count === rows.length ? "all" : "some";
  }, [rows, isSelected]);

  const togglePage = useCallback(() => {
    const select = pageState !== "all";
    rows.forEach((row) => toggleRow(row, select));
  }, [pageState, rows, toggleRow]);

  const selectAllMatching = useCallback(() => setSelection({ all: true, ids: new Map() }), []);
  const clearSelection = useCallback(() => setSelection({ all: false, ids: new Map() }), []);

  const resolveSelection = useCallback((): { selection: GridSelection; rows: T[] } => {
    if (!selection.all) {
      return { selection: { kind: "ids", ids: [...selection.ids.keys()] }, rows: [...selection.ids.values()] };
    }
    const gridSelection: GridSelection = { kind: "all", query, excludedIds: [...selection.ids.keys()], total: selectedCount };
    if (source.mode === "client") {
      const all = flatten(applyQuery(source.rows, columns, query, { getSubRows, paginate: false }).rows, undefined);
      return { selection: gridSelection, rows: all.filter((row) => !selection.ids.has(getRowId(row))) };
    }
    return { selection: gridSelection, rows: [] };
  }, [selection, query, selectedCount, source, columns, getSubRows, getRowId]);

  // -------------------------------------------------------------- expansion
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [expandedSetKey, setExpandedSetKey] = useState(setKey);
  if (expandedSetKey !== setKey) {
    setExpandedSetKey(setKey);
    setExpanded(new Set());
  }
  // While searching a tree, matching branches start open.
  const autoExpand = Boolean(getSubRows) && isRefined(query);
  const isExpanded = useCallback((rowId: string) => expanded.has(rowId) !== autoExpand, [expanded, autoExpand]);
  const toggleExpanded = useCallback(
    (rowId: string) =>
      setExpanded((previous) => {
        const next = new Set(previous);
        if (next.has(rowId)) next.delete(rowId);
        else next.add(rowId);
        return next;
      }),
    [],
  );

  // ------------------------------------------------------------------- view
  const viewDefaults = useMemo<ViewPrefs>(
    () => ({
      hidden: columns.filter((c) => c.defaultHidden).map((c) => c.id),
      order: columns.map((c) => c.id),
      pinLeft: columns.filter((c) => c.defaultPin === "left").map((c) => c.id),
      pinRight: columns.filter((c) => c.defaultPin === "right").map((c) => c.id),
      widths: {},
      density: "comfortable",
      presentation: "auto",
    }),
    [columns],
  );
  const [view, setView, resetView] = usePersistedState<ViewPrefs>(`data-grid:${id}`, viewDefaults);

  const orderedColumns = useMemo(() => {
    const byId = new Map(columns.map((c) => [c.id, c]));
    const ordered = view.order.map((columnId) => byId.get(columnId)).filter((c): c is GridColumn<T> => Boolean(c));
    // Columns added since the preferences were saved go at the end.
    for (const column of columns) if (!view.order.includes(column.id)) ordered.push(column);
    return ordered;
  }, [columns, view.order]);

  const visibleColumns = useMemo(() => {
    const visible = orderedColumns.filter((c) => !view.hidden.includes(c.id));
    const left = visible.filter((c) => view.pinLeft.includes(c.id));
    const right = visible.filter((c) => view.pinRight.includes(c.id));
    const center = visible.filter((c) => !view.pinLeft.includes(c.id) && !view.pinRight.includes(c.id));
    return { left, center, right, all: [...left, ...center, ...right] };
  }, [orderedColumns, view.hidden, view.pinLeft, view.pinRight]);

  const columnWidth = useCallback(
    (column: GridColumn<T>) => view.widths[column.id] ?? column.width ?? 160,
    [view.widths],
  );

  const viewActions = useMemo(
    () => ({
      toggleHidden: (columnId: string) =>
        setView((v) => ({
          ...v,
          hidden: v.hidden.includes(columnId) ? v.hidden.filter((x) => x !== columnId) : [...v.hidden, columnId],
        })),
      setOrder: (order: string[]) => setView((v) => ({ ...v, order })),
      pin: (columnId: string, side: "left" | "right" | null) =>
        setView((v) => ({
          ...v,
          pinLeft: side === "left" ? [...v.pinLeft.filter((x) => x !== columnId), columnId] : v.pinLeft.filter((x) => x !== columnId),
          pinRight: side === "right" ? [...v.pinRight.filter((x) => x !== columnId), columnId] : v.pinRight.filter((x) => x !== columnId),
        })),
      setWidth: (columnId: string, width: number | null) =>
        setView((v) => {
          const widths = { ...v.widths };
          if (width === null) delete widths[columnId];
          else widths[columnId] = width;
          return { ...v, widths };
        }),
      setDensity: (density: Density) => setView((v) => ({ ...v, density })),
      setPresentation: (presentation: Presentation) => setView((v) => ({ ...v, presentation })),
      reset: resetView,
    }),
    [setView, resetView],
  );

  return {
    props,
    query,
    defaults,
    searchInput,
    setSearch,
    toggleSort,
    setSort,
    setFilter,
    clearRefinements,
    setPage: (page: number) => update({ page }, { resetPage: false }),
    setPageSize: (pageSize: number) => update({ pageSize }),
    rows,
    total,
    loading,
    initialLoading: loading && !serverState && !clientResult,
    error,
    reload,
    getChildren,
    findRow,
    openId,
    openRow,
    openItem,
    mutate,
    selection: { isSelected, toggleRow, togglePage, pageState, selectAllMatching, clear: clearSelection, count: selectedCount, all: selection.all, resolve: resolveSelection },
    expansion: { isExpanded, toggle: toggleExpanded },
    view,
    viewActions,
    orderedColumns,
    visibleColumns,
    columnWidth,
  };
}

export type DataGridController<T> = ReturnType<typeof useDataGrid<T>>;
