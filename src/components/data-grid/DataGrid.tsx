"use client";

import { useEffect, useRef, useState } from "react";
import { isRefined } from "@/lib/data-grid";
import { BulkBar } from "./BulkBar";
import { GridCommandMenu, ShortcutsDialog } from "./CommandMenu";
import { ConfirmProvider } from "./ConfirmDialog";
import { useMediaQuery } from "./hooks";
import { ImportDialog } from "./ImportDialog";
import { ListView } from "./ListView";
import { Pagination } from "./Pagination";
import { TableView } from "./TableView";
import { Toolbar } from "./Toolbar";
import type { DataGridProps } from "./types";
import { useGridUi } from "./ui-state";
import { useDataGrid } from "./use-data-grid";
import { Workspace } from "./Workspace";

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return Boolean(el?.closest("input, textarea, select, [contenteditable=true], [role=dialog], [role=menu]"));
}

function Grid<T>(props: DataGridProps<T>) {
  const grid = useDataGrid(props);
  const ui = useGridUi();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const presentation = grid.view.presentation === "auto" ? (isDesktop ? "table" : "list") : grid.view.presentation;
  const [selectModeOn, setSelectMode] = useState(false);
  const selectMode = selectModeOn || (presentation === "list" && grid.selection.count > 0);
  const searchRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLElement>(null);

  const { query, total, loading, error, setPage, selection } = grid;
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
  const { setCommandOpen, setShortcutsOpen } = ui;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      const withinGrid = rootRef.current?.contains(document.activeElement) ?? false;
      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      } else if (event.key === "?") {
        event.preventDefault();
        setShortcutsOpen(true);
      } else if (event.key === "Escape" && selection.count > 0) {
        selection.clear();
      } else if (withinGrid && event.key === "[" && query.page > 1) {
        setPage(query.page - 1);
      } else if (withinGrid && event.key === "]" && query.page < pageCount) {
        setPage(query.page + 1);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selection, query.page, pageCount, setPage, setCommandOpen, setShortcutsOpen]);

  // After paging, bring the top of the grid back into view if it scrolled away.
  const shownPage = useRef(query.page);
  useEffect(() => {
    if (shownPage.current === query.page) return;
    shownPage.current = query.page;
    const root = rootRef.current;
    const viewport = root?.closest<HTMLElement>("[data-slot=app-scroll-viewport]");
    if (!root || !viewport) return;
    // Scroll only the page's scroll area (scrollIntoView would also move the app shell).
    const offset = root.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
    if (offset < 0) viewport.scrollTo({ top: viewport.scrollTop + offset - 16 });
  }, [query.page]);

  // On-demand surfaces, reachable from the toolbar, the command menu or the keyboard.
  const surfaces = (
    <>
      <GridCommandMenu grid={grid} ui={ui} />
      <ShortcutsDialog ui={ui} />
      {props.onImport && <ImportDialog grid={grid} open={ui.importOpen} onOpenChange={ui.setImportOpen} />}
    </>
  );

  // Nothing exists yet: show the product's empty state instead of an empty table.
  if (props.emptyState && total === 0 && !loading && !error && !isRefined(query)) {
    return <>{props.emptyState}</>;
  }

  if (props.workspace && grid.openId) {
    return (
      <>
        <Workspace grid={grid} ui={ui} openId={grid.openId} rootRef={rootRef} searchRef={searchRef} />
        {surfaces}
      </>
    );
  }

  const showBulk = selection.count > 0 && Boolean(props.bulkActions?.length);

  return (
    // Open layout, no card: toolbar, table, pages. Rows carry the borders.
    <section ref={rootRef} aria-label={props.noun[1]}>
      {showBulk && presentation === "table" ? (
        <BulkBar grid={grid} floating={false} />
      ) : (
        <Toolbar
          grid={grid}
          ui={ui}
          compact={!isDesktop}
          searchRef={searchRef}
          selectMode={selectMode}
          onToggleSelectMode={() => {
            if (selectMode) selection.clear();
            setSelectMode(!selectMode);
          }}
        />
      )}
      {presentation === "table" ? (
        <TableView grid={grid} />
      ) : (
        <ListView grid={grid} selectMode={selectMode} onSelectModeChange={setSelectMode} />
      )}
      <Pagination grid={grid} compact={!isDesktop} />
      {showBulk && presentation === "list" && <BulkBar grid={grid} floating />}
      {surfaces}
      <p aria-live="polite" className="sr-only">
        {loading ? "Loading" : `${total} ${total === 1 ? props.noun[0] : props.noun[1]}`}
      </p>
    </section>
  );
}

/**
 * One grid for every list in the app.
 *
 * ```tsx
 * <DataGrid id="products" noun={["product", "products"]} columns={productColumns}
 *   source={clientSource(rows)} getRowId={(p) => p.id}
 *   rowActions={[...]} bulkActions={[...]} />
 * ```
 */
export function DataGrid<T>(props: DataGridProps<T>) {
  return (
    <ConfirmProvider>
      <Grid {...props} />
    </ConfirmProvider>
  );
}
