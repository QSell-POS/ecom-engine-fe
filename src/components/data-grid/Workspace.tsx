"use client";

import { useEffect, useEffectEvent, useRef, useState, type RefObject } from "react";
import { ArrowLeft, ChevronDown, ChevronRight, ChevronUp, MoreHorizontal, RotateCw, SearchX, Table2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatValue, isRefined } from "@/lib/data-grid";
import { cn } from "@/lib/utils";
import { renderCell } from "./cells";
import { ActiveFilters, FilterMenu } from "./Filters";
import { useMediaQuery } from "./hooks";
import { Pagination } from "./Pagination";
import { SortMenu } from "./SortMenu";
import { RowSummary, summaryRoles } from "./summary";
import { SearchField } from "./Toolbar";
import type { RowAction, WorkspaceContext } from "./types";
import type { GridUi } from "./ui-state";
import { useGridActions } from "./use-actions";
import type { DataGridController } from "./use-data-grid";

// Everything below the admin navbar (h-14): the panes scroll, the page doesn't.
const WORKSPACE_HEIGHT = "h-[calc(100dvh-3.5rem)]";
// Radix wraps viewport content in `display: table`; block keeps widths honest.
const SCROLL_BLOCK = "[&>[data-slot=scroll-area-viewport]>div]:block!";

const number = new Intl.NumberFormat("en-US");

type Item<T> = { row: T; depth: number; hasChildren: boolean };

function visibleItems<T>(grid: DataGridController<T>): Item<T>[] {
  const { getRowId, getSubRows } = grid.props;
  const items: Item<T>[] = [];
  const walk = (list: T[], depth: number) => {
    for (const row of list) {
      const children = getSubRows ? grid.getChildren(row) : [];
      items.push({ row, depth, hasChildren: children.length > 0 });
      if (children.length && grid.expansion.isExpanded(getRowId(row))) walk(children, depth + 1);
    }
  };
  walk(grid.rows, 0);
  return items;
}

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return Boolean(el?.closest("input, textarea, select, [contenteditable=true], [role=dialog], [role=menu]"));
}

// ---------------------------------------------------------------- master list

function MasterList<T>({
  grid,
  items,
  openId,
  onOpen,
  onEnter,
}: {
  grid: DataGridController<T>;
  items: Item<T>[];
  openId: string;
  onOpen: (rowId: string) => void;
  onEnter: () => void;
}) {
  const { props, expansion } = grid;
  const { getRowId, noun } = props;
  const roles = summaryRoles(grid);
  const listRef = useRef<HTMLDivElement>(null);
  const activeIndex = items.findIndex((item) => getRowId(item.row) === openId);

  // Keep the open record in view (and focused, if the list has focus).
  useEffect(() => {
    const list = listRef.current;
    const element = list?.querySelector<HTMLElement>(`[data-id="${CSS.escape(openId)}"]`);
    if (!list || !element) return;
    if (list.contains(document.activeElement)) element.focus({ preventScroll: true });
    // Scroll only the list pane, never the app shell.
    const viewport = list.closest<HTMLElement>("[data-slot=scroll-area-viewport]");
    if (!viewport) return;
    const box = element.getBoundingClientRect();
    const view = viewport.getBoundingClientRect();
    if (box.top < view.top) viewport.scrollTop -= view.top - box.top;
    else if (box.bottom > view.bottom) viewport.scrollTop += box.bottom - view.bottom;
  }, [openId, items.length]);

  if (grid.initialLoading) {
    return (
      <div aria-busy className="divide-y">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="space-y-2 px-4 py-3.5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (grid.error && items.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm font-medium">Couldn&apos;t load {noun[1]}</p>
        <p className="mt-1 text-sm text-muted-foreground">{grid.error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={grid.reload}>
          <RotateCw /> Try again
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <SearchX className="mx-auto mb-3 size-5 text-muted-foreground" />
        <p className="text-sm font-medium">No {noun[1]} match</p>
        {isRefined(grid.query) && (
          <Button variant="outline" size="sm" className="mt-4" onClick={grid.clearRefinements}>
            Clear search and filters
          </Button>
        )}
      </div>
    );
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const at = activeIndex === -1 ? 0 : activeIndex;
    let target: number | null = null;
    if (event.key === "ArrowDown" || event.key === "j") target = activeIndex === -1 ? 0 : at + 1;
    else if (event.key === "ArrowUp" || event.key === "k") target = at - 1;
    else if (event.key === "Home") target = 0;
    else if (event.key === "End") target = items.length - 1;
    else if (event.key === "Enter") {
      event.preventDefault();
      onEnter();
      return;
    } else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      const item = items[at];
      const rowId = item && getRowId(item.row);
      if (item?.hasChildren && expansion.isExpanded(rowId) === (event.key === "ArrowLeft")) {
        event.preventDefault();
        expansion.toggle(rowId);
      }
      return;
    }
    if (target === null) return;
    event.preventDefault();
    const item = items[Math.max(0, Math.min(items.length - 1, target))];
    if (item) onOpen(getRowId(item.row));
  }

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label={noun[1]}
      onKeyDown={onKeyDown}
      className={cn("divide-y transition-opacity duration-150", grid.loading && "opacity-60 delay-150")}
    >
      {items.map(({ row, depth, hasChildren }, index) => {
        const rowId = getRowId(row);
        const active = rowId === openId;
        const expanded = expansion.isExpanded(rowId);
        return (
          <div
            key={rowId}
            data-id={rowId}
            role="option"
            aria-selected={active}
            tabIndex={active || (activeIndex === -1 && index === 0) ? 0 : -1}
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("button")) return;
              onOpen(rowId);
            }}
            style={{ paddingLeft: 16 + depth * 16 }}
            className={cn(
              "relative flex cursor-pointer items-center gap-3 py-3 pr-4 outline-none transition-colors duration-100",
              "hover:bg-muted/60 focus-visible:bg-muted",
              active && "bg-[color-mix(in_oklch,var(--selection)_7%,var(--background))] hover:bg-[color-mix(in_oklch,var(--selection)_9%,var(--background))]",
            )}
          >
            {active && <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-selection" />}
            {hasChildren ? (
              <button
                type="button"
                tabIndex={-1}
                aria-label={expanded ? "Collapse" : "Expand"}
                onClick={() => expansion.toggle(rowId)}
                className="-ml-1 flex size-5 shrink-0 items-center justify-center rounded-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <ChevronRight className={cn("size-3.5 transition-transform duration-150", expanded && "rotate-90")} />
              </button>
            ) : (
              props.getSubRows && <span className="w-4 shrink-0" />
            )}
            <RowSummary grid={grid} row={row} roles={roles} />
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------- record actions

function RecordActions<T>({
  grid,
  row,
  compact,
  onRun,
}: {
  grid: DataGridController<T>;
  row: T;
  compact: boolean;
  onRun: (action: RowAction<T>) => void;
}) {
  const available = (grid.props.rowActions ?? []).filter((action) => !action.hidden?.(row));
  const regular = available.filter((a) => a.tone !== "destructive");
  const destructive = available.filter((a) => a.tone === "destructive");
  const inline = regular.slice(0, compact ? 1 : 2);
  const overflow = regular.slice(inline.length);
  if (available.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      {inline.map((action) => (
        <Button key={action.id} variant="outline" size="sm" onClick={() => onRun(action)}>
          {action.icon && <action.icon />}
          {action.label}
        </Button>
      ))}
      {overflow.length + destructive.length > 0 && (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon-sm" aria-label="More actions">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {overflow.map((action) => (
              <DropdownMenuItem key={action.id} onSelect={() => onRun(action)}>
                {action.icon && <action.icon />} {action.label}
              </DropdownMenuItem>
            ))}
            {overflow.length > 0 && destructive.length > 0 && <DropdownMenuSeparator />}
            {destructive.map((action) => (
              <DropdownMenuItem key={action.id} variant="destructive" onSelect={() => onRun(action)}>
                {action.icon && <action.icon />} {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

function IconTooltip({ label, shortcut, children }: { label: string; shortcut?: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>
        {label}
        {shortcut && <Kbd className="ml-1.5">{shortcut}</Kbd>}
      </TooltipContent>
    </Tooltip>
  );
}

// ------------------------------------------------------------------ workspace

export function Workspace<T>({
  grid,
  ui,
  openId,
  rootRef,
  searchRef,
}: {
  grid: DataGridController<T>;
  ui: GridUi;
  openId: string;
  rootRef: RefObject<HTMLElement | null>;
  searchRef: RefObject<HTMLInputElement | null>;
}) {
  const { props, query, total } = grid;
  const { getRowId, noun } = props;
  const workspace = props.workspace!;
  const wide = useMediaQuery("(min-width: 1024px)");
  const { runRowAction } = useGridActions(grid);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const items = visibleItems(grid);
  const index = items.findIndex((item) => getRowId(item.row) === openId);
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
  const isTree = Boolean(props.getSubRows);
  const plural = noun[1].charAt(0).toUpperCase() + noun[1].slice(1);

  // Resolve the open record: loaded data first, then the last copy we showed
  // (keeps it steady while the list refetches or filters it out), then
  // `loadRow` for records that aren't loaded (deep links, other pages).
  const listRow = grid.findRow(openId);
  const [known, setKnown] = useState<{ id: string; row: T } | null>(null);
  if (listRow && known?.row !== listRow) setKnown({ id: openId, row: listRow });
  const [loaded, setLoaded] = useState<{ id: string; row: T | null; error?: string } | null>(null);
  const row = listRow ?? (known?.id === openId ? known.row : undefined) ?? (loaded?.id === openId ? (loaded.row ?? undefined) : undefined);
  const needsLoad = !row && Boolean(workspace.loadRow) && loaded?.id !== openId;

  const load = useEffectEvent((rowId: string, signal: AbortSignal) => workspace.loadRow!(rowId, signal));
  useEffect(() => {
    if (!needsLoad) return;
    const controller = new AbortController();
    load(openId, controller.signal)
      .then((result) => setLoaded({ id: openId, row: result }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoaded({ id: openId, row: null, error: error instanceof Error ? error.message : "Something went wrong" });
      });
    return () => controller.abort();
  }, [needsLoad, openId]);

  // Opening a nested record (e.g. a subcategory link) reveals it in the list.
  function revealAncestors(rowId: string) {
    const path = (list: T[], trail: T[]): T[] | null => {
      for (const row of list) {
        if (getRowId(row) === rowId) return trail;
        const found = path(grid.getChildren(row), [...trail, row]);
        if (found) return found;
      }
      return null;
    };
    for (const ancestor of path(grid.rows, []) ?? []) {
      const ancestorId = getRowId(ancestor);
      if (!grid.expansion.isExpanded(ancestorId)) grid.expansion.toggle(ancestorId);
    }
  }
  const open = (rowId: string) => {
    if (isTree) revealAncestors(rowId);
    grid.openRow(rowId);
  };
  const close = () => grid.openRow(null);
  const context: WorkspaceContext = { open, close };

  // ------------------------------------------------ previous / next (across pages)
  const pending = useRef<{ page: number; edge: "first" | "last" } | null>(null);
  const canPrevious = index > 0 || (index !== -1 && !isTree && query.page > 1);
  const canNext = index === -1 ? items.length > 0 : index < items.length - 1 || (!isTree && query.page < pageCount);

  function step(delta: 1 | -1) {
    const target = index === -1 ? (delta === 1 ? items[0] : undefined) : items[index + delta];
    if (target) {
      open(getRowId(target.row));
      return;
    }
    const page = query.page + delta;
    if (index === -1 || isTree || page < 1 || page > pageCount) return;
    pending.current = { page, edge: delta === 1 ? "first" : "last" };
    grid.setPage(page);
  }

  useEffect(() => {
    const target = pending.current;
    if (!target || grid.loading || query.page !== target.page) return;
    pending.current = null;
    const item = target.edge === "first" ? items[0] : items.at(-1);
    if (item) grid.openRow(getRowId(item.row));
  }, [grid, items, query.page, getRowId]);

  // After deleting the open record, carry on with its neighbour.
  async function runAction(action: RowAction<T>) {
    if (!row) return;
    const neighbour = index === -1 ? undefined : (items[index + 1] ?? items[index - 1]);
    const done = await runRowAction(action, row);
    if (done && action.optimistic === "remove") {
      if (neighbour) open(getRowId(neighbour.row));
      else close();
    }
  }

  // ------------------------------------------------------------- keyboard
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
    if (event.key === "j") step(1);
    else if (event.key === "k") step(-1);
    else if (event.key === "Escape" && grid.selection.count === 0) close();
    else return;
    event.preventDefault();
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  // ------------------------------------------------------------------ render
  const roles = summaryRoles(grid);
  const position =
    index === -1 ? null : isTree ? `${index + 1} of ${items.length}` : `${number.format((query.page - 1) * query.pageSize + index + 1)} of ${number.format(total)}`;

  const navigation = (
    <div className="flex items-center gap-1">
      <IconTooltip label="Previous" shortcut="K">
        <Button variant="ghost" size="icon-sm" aria-label={`Previous ${noun[0]}`} disabled={!canPrevious} onClick={() => step(-1)}>
          <ChevronUp />
        </Button>
      </IconTooltip>
      <IconTooltip label="Next" shortcut="J">
        <Button variant="ghost" size="icon-sm" aria-label={`Next ${noun[0]}`} disabled={!canNext} onClick={() => step(1)}>
          <ChevronDown />
        </Button>
      </IconTooltip>
      {position && <span className="ml-1 text-sm text-muted-foreground tabular-nums">{position}</span>}
    </div>
  );

  const Icon = workspace.icon;
  let body: React.ReactNode;
  if (row) {
    const subtitle = roles.subtitle.map((c) => formatValue(c, row)).filter(Boolean).join(" · ");
    body = (
      <article key={openId} className="animate-[fade-in_180ms_ease-out_forwards] opacity-0">
        <header className="mb-8 flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40 text-muted-foreground">
            {roles.media ? renderCell(roles.media, row, props.cells) : Icon ? <Icon className="size-5" /> : (
              <span className="text-lg font-semibold">{formatValue(roles.title, row).charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold tracking-tight outline-none">
              {formatValue(roles.title, row)}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {roles.status && renderCell(roles.status, row, props.cells)}
              {subtitle && <span className="truncate">{subtitle}</span>}
            </div>
          </div>
        </header>
        {workspace.render(row, context)}
      </article>
    );
  } else if (needsLoad || (!loaded && grid.loading)) {
    body = (
      <div aria-busy aria-label={`Loading ${noun[0]}`} className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
        <Skeleton className="h-20 w-full" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  } else if (loaded?.error) {
    body = (
      <div className="py-16 text-center">
        <p className="text-sm font-medium">Couldn&apos;t load this {noun[0]}</p>
        <p className="mt-1 text-sm text-muted-foreground">{loaded.error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setLoaded(null)}>
          <RotateCw /> Try again
        </Button>
      </div>
    );
  } else {
    body = (
      <div className="py-16 text-center">
        <SearchX className="mx-auto mb-3 size-5 text-muted-foreground" />
        <p className="text-sm font-medium">This {noun[0]} isn&apos;t available</p>
        <p className="mt-1 text-sm text-muted-foreground">It may have been deleted, or the link is out of date.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={close}>
          Back to {noun[1]}
        </Button>
      </div>
    );
  }

  return (
    <section
      ref={rootRef}
      data-workspace
      aria-label={`${plural} workspace`}
      className={cn("flex min-h-0 bg-background", WORKSPACE_HEIGHT)}
    >
      {wide && (
        <aside aria-label={plural} className="flex w-84 shrink-0 flex-col border-r xl:w-92">
          <div className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <h1 className="text-sm font-semibold">{plural}</h1>
            <span className="text-sm text-muted-foreground tabular-nums">{grid.initialLoading ? "" : number.format(total)}</span>
            <div className="ml-auto">
              <IconTooltip label="Back to table" shortcut="Esc">
                <Button variant="ghost" size="icon-sm" aria-label="Back to table" onClick={close}>
                  <Table2 />
                </Button>
              </IconTooltip>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 border-b px-3 py-2.5">
            <SearchField grid={grid} searchRef={searchRef} className="h-8 min-w-0 flex-1" />
            <FilterMenu grid={grid} ui={ui} iconOnly />
            <SortMenu grid={grid} iconOnly />
          </div>
          <ActiveFilters grid={grid} ui={ui} className="shrink-0 border-b px-3 py-2" />
          <ScrollArea className={cn("min-h-0 flex-1", SCROLL_BLOCK)}>
            <MasterList grid={grid} items={items} openId={openId} onOpen={open} onEnter={() => headingRef.current?.focus()} />
          </ScrollArea>
          <Pagination grid={grid} compact className="shrink-0 border-t px-3 py-2" />
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center gap-3 border-b px-4 lg:px-6">
          {!wide && (
            <Button variant="ghost" size="sm" className="-ml-2" onClick={close}>
              <ArrowLeft /> {plural}
            </Button>
          )}
          {navigation}
          <div className="ml-auto flex items-center gap-1.5">
            {row && <RecordActions grid={grid} row={row} compact={!wide} onRun={(action) => void runAction(action)} />}
            {wide && (
              <IconTooltip label="Close" shortcut="Esc">
                <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={close} className="ml-1">
                  <X />
                </Button>
              </IconTooltip>
            )}
          </div>
        </div>
        <ScrollArea key={openId} className={cn("min-h-0 flex-1", SCROLL_BLOCK)}>
          <div className="mx-auto w-full max-w-5xl px-5 py-8 lg:px-10 lg:py-10">{body}</div>
        </ScrollArea>
      </div>
    </section>
  );
}
