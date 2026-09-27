"use client";

import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, EyeOff, MoreHorizontal, Pin, PinOff, RotateCw, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { defaultAlign, isRefined, isSortable, type GridColumn } from "@/lib/data-grid";
import { cn } from "@/lib/utils";
import { renderCell } from "./cells";
import { directionLabels } from "./SortMenu";
import type { RowAction } from "./types";
import { useGridActions } from "./use-actions";
import type { DataGridController } from "./use-data-grid";

const SELECT_WIDTH = 40;
const ACTIONS_WIDTH = 48;
const INTERACTIVE = "a, button, input, select, textarea, label, [role=checkbox], [role=menuitem], [data-no-row-click]";

// Opaque surfaces so pinned (sticky) cells never show content scrolling beneath.
const HEAD_BG = "bg-[color-mix(in_oklch,var(--muted)_70%,var(--background))]";
const CELL_BG = "bg-background group-hover/row:bg-muted group-data-[selected=true]/row:bg-[color-mix(in_oklch,var(--selection)_7%,var(--background))]";

export function RowActionsMenu<T>({ grid, row, actions }: { grid: DataGridController<T>; row: T; actions: RowAction<T>[] }) {
  const { runRowAction } = useGridActions(grid);
  const available = actions.filter((action) => !action.hidden?.(row));
  if (available.length === 0) return null;
  const regular = available.filter((a) => a.tone !== "destructive");
  const destructive = available.filter((a) => a.tone === "destructive");

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Row actions" className="text-muted-foreground data-open:bg-accent">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {regular.map((action) => (
          <DropdownMenuItem key={action.id} onSelect={() => void runRowAction(action, row)}>
            {action.icon && <action.icon />} {action.label}
          </DropdownMenuItem>
        ))}
        {regular.length > 0 && destructive.length > 0 && <DropdownMenuSeparator />}
        {destructive.map((action) => (
          <DropdownMenuItem key={action.id} variant="destructive" onSelect={() => void runRowAction(action, row)}>
            {action.icon && <action.icon />} {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function HeaderCell<T>({
  grid,
  column,
  style,
  className,
  width,
  onResize,
  onResizeEnd,
}: {
  grid: DataGridController<T>;
  column: GridColumn<T>;
  style: CSSProperties;
  className: string;
  width: number;
  onResize: (width: number) => void;
  onResizeEnd: (width: number | null) => void;
}) {
  const sortIndex = grid.query.sort.findIndex((s) => s.id === column.id);
  const sort = sortIndex >= 0 ? grid.query.sort[sortIndex] : null;
  const sortable = isSortable(column);
  const align = defaultAlign(column);
  const pinned = grid.view.pinLeft.includes(column.id) || grid.view.pinRight.includes(column.id);
  const words = directionLabels(column);
  const drag = useRef<{ x: number; width: number } | null>(null);

  const label = <span className="truncate">{column.header}</span>;

  // Click to sort. Everything else about a column is one right-click away
  // (or in "Customize table"), so the header itself stays quiet.
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <th
          scope="col"
          role="columnheader"
          style={style}
          aria-sort={sort ? (sort.desc ? "descending" : "ascending") : undefined}
          className={cn("group/th relative h-10 border-y px-3 text-xs font-medium text-muted-foreground select-none", HEAD_BG, className)}
        >
          <div className={cn("flex items-center", align === "right" && "flex-row-reverse", align === "center" && "justify-center")}>
            {sortable ? (
              <button
                type="button"
                onClick={(e) => grid.toggleSort(column.id, e.shiftKey)}
                aria-label={`Sort by ${column.header}`}
                className={cn(
                  "-mx-1 flex min-w-0 items-center gap-1 rounded-xs px-1 py-0.5 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  sort && "text-foreground",
                  align === "right" && "flex-row-reverse",
                )}
              >
                {column.description ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{label}</TooltipTrigger>
                    <TooltipContent>{column.description}</TooltipContent>
                  </Tooltip>
                ) : (
                  label
                )}
                {sort ? (
                  sort.desc ? <ArrowDown className="size-3 shrink-0" /> : <ArrowUp className="size-3 shrink-0" />
                ) : (
                  <ArrowUpDown className="size-3 shrink-0 opacity-0 transition-opacity group-hover/th:opacity-60" />
                )}
                {sort && grid.query.sort.length > 1 && <span className="text-[10px] tabular-nums">{sortIndex + 1}</span>}
              </button>
            ) : (
              label
            )}
          </div>

          {column.resizable !== false && (
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label={`Resize ${column.header}`}
              title="Drag to resize · double-click to reset"
              onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                drag.current = { x: e.clientX, width };
              }}
              onPointerMove={(e) => {
                if (!drag.current) return;
                const next = Math.round(drag.current.width + e.clientX - drag.current.x);
                onResize(Math.min(column.maxWidth ?? 640, Math.max(column.minWidth ?? 72, next)));
              }}
              onPointerUp={(e) => {
                if (!drag.current) return;
                drag.current = null;
                e.currentTarget.releasePointerCapture(e.pointerId);
                onResizeEnd(width);
              }}
              onDoubleClick={() => onResizeEnd(null)}
              className="absolute top-0 -right-1 z-10 h-full w-2 cursor-col-resize touch-none after:absolute after:inset-y-2 after:left-1/2 after:w-px after:bg-transparent after:transition-colors hover:after:bg-border active:after:bg-selection"
            />
          )}
        </th>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        {sortable && (
          <>
            <ContextMenuItem onSelect={() => grid.setSort([{ id: column.id, desc: false }])}>
              <ArrowUp /> {words.asc}
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => grid.setSort([{ id: column.id, desc: true }])}>
              <ArrowDown /> {words.desc}
            </ContextMenuItem>
            {sort && (
              <ContextMenuItem onSelect={() => grid.setSort(grid.query.sort.filter((s) => s.id !== column.id))}>
                <ArrowUpDown /> Reset sort
              </ContextMenuItem>
            )}
            <ContextMenuSeparator />
          </>
        )}
        {column.pinnable !== false && (
          <ContextMenuItem onSelect={() => grid.viewActions.pin(column.id, pinned ? null : "left")}>
            {pinned ? <PinOff /> : <Pin />} {pinned ? "Unfreeze column" : "Freeze column"}
          </ContextMenuItem>
        )}
        {column.hideable !== false && (
          <ContextMenuItem onSelect={() => grid.viewActions.toggleHidden(column.id)}>
            <EyeOff /> Hide column
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function TableView<T>({ grid }: { grid: DataGridController<T> }) {
  const { props, visibleColumns, rows, selection, expansion } = grid;
  const { getRowId, rowActions, bulkActions, renderDetail, getSubRows, rowHref, onRowOpen, cells } = props;
  const selectable = Boolean(bulkActions?.length);
  const hasActions = Boolean(rowActions?.length);
  const expandable = Boolean(renderDetail || getSubRows);
  const compact = grid.view.density === "compact";
  const [live, setLive] = useState<{ id: string; width: number } | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(0);

  // The header lives in its own sticky strip (sticky can't escape the body's
  // horizontal scroller), so both strips share one horizontal position.
  function syncScroll(from: HTMLDivElement | null, to: HTMLDivElement | null) {
    if (from && to && to.scrollLeft !== from.scrollLeft) to.scrollLeft = from.scrollLeft;
  }

  // Full-width rows (detail panels) stay within the visible area while the table scrolls sideways.
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setViewportWidth(element.clientWidth));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const widthOf = (column: GridColumn<T>) => (live?.id === column.id ? live.width : grid.columnWidth(column));

  // Sticky offsets for pinned columns.
  const leftOffsets = new Map<string, number>();
  let left = selectable ? SELECT_WIDTH : 0;
  for (const column of visibleColumns.left) {
    leftOffsets.set(column.id, left);
    left += widthOf(column);
  }
  const rightOffsets = new Map<string, number>();
  let right = hasActions ? ACTIONS_WIDTH : 0;
  for (const column of [...visibleColumns.right].reverse()) {
    rightOffsets.set(column.id, right);
    right += widthOf(column);
  }
  const lastLeft = visibleColumns.left.at(-1)?.id;
  const firstRight = visibleColumns.right[0]?.id;

  function pinStyle(column: GridColumn<T>): { style: CSSProperties; className: string } {
    if (leftOffsets.has(column.id)) {
      return {
        style: { position: "sticky", left: leftOffsets.get(column.id), zIndex: 2 },
        className: cn(column.id === lastLeft && "shadow-[inset_-1px_0_0_var(--border)]"),
      };
    }
    if (rightOffsets.has(column.id)) {
      return {
        style: { position: "sticky", right: rightOffsets.get(column.id), zIndex: 2 },
        className: cn(column.id === firstRight && "shadow-[inset_1px_0_0_var(--border)]"),
      };
    }
    return { style: {}, className: "" };
  }

  const tableWidth =
    visibleColumns.all.reduce((sum, c) => sum + widthOf(c), 0) + (selectable ? SELECT_WIDTH : 0) + (hasActions ? ACTIONS_WIDTH : 0);
  const colSpan = visibleColumns.all.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0);
  const cellPad = compact ? "py-1" : "py-2";

  // Shared by the header and body tables so their columns line up exactly.
  const colgroup = (
    <colgroup>
      {selectable && <col style={{ width: SELECT_WIDTH }} />}
      {visibleColumns.all.map((column) => (
        <col key={column.id} style={{ width: widthOf(column) }} />
      ))}
      {hasActions && <col style={{ width: ACTIONS_WIDTH }} />}
    </colgroup>
  );

  // Flatten visible tree rows for rendering + keyboard indexing.
  type Flat = { row: T; depth: number; hasChildren: boolean };
  const flat: Flat[] = [];
  const walk = (list: T[], depth: number) => {
    for (const row of list) {
      const children = getSubRows ? grid.getChildren(row) : [];
      flat.push({ row, depth, hasChildren: children.length > 0 });
      if (children.length && expansion.isExpanded(getRowId(row))) walk(children, depth + 1);
    }
  };
  walk(rows, 0);

  const open = grid.openItem;

  function focusRow(index: number) {
    const rowsEls = bodyRef.current?.querySelectorAll<HTMLTableRowElement>("tr[data-row]");
    if (!rowsEls?.length) return;
    const clamped = Math.max(0, Math.min(rowsEls.length - 1, index));
    rowsEls[clamped].focus();
    setActiveIndex(clamped);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTableSectionElement>) {
    const target = event.target as HTMLElement;
    const rowEl = target.closest<HTMLTableRowElement>("tr[data-row]");
    if (!rowEl || target !== rowEl) return;
    const all = [...(bodyRef.current?.querySelectorAll<HTMLTableRowElement>("tr[data-row]") ?? [])];
    const index = all.indexOf(rowEl);
    const row = flat[index];
    switch (event.key) {
      case "ArrowDown":
      case "j":
        event.preventDefault();
        focusRow(index + 1);
        break;
      case "ArrowUp":
      case "k":
        event.preventDefault();
        focusRow(index - 1);
        break;
      case "Home":
        event.preventDefault();
        focusRow(0);
        break;
      case "End":
        event.preventDefault();
        focusRow(all.length - 1);
        break;
      case "Enter":
        if (row) open(row.row);
        break;
      case "x":
      case " ":
        if (selectable && row) {
          event.preventDefault();
          selection.toggleRow(row.row);
        }
        break;
      case "ArrowRight":
        if (row && expandable && !expansion.isExpanded(getRowId(row.row))) expansion.toggle(getRowId(row.row));
        break;
      case "ArrowLeft":
        if (row && expandable && expansion.isExpanded(getRowId(row.row))) expansion.toggle(getRowId(row.row));
        break;
    }
  }


  const showSelectAllBanner = selectable && (selection.all || (selection.pageState === "all" && grid.total > rows.length));

  let body: ReactNode;
  if (grid.initialLoading) {
    body = Array.from({ length: Math.min(grid.query.pageSize, 10) }, (_, i) => (
      <tr key={i} role="row">
        {selectable && <td role="cell" className="px-3" />}
        {visibleColumns.all.map((column, c) => (
          <td key={column.id} role="cell" className={cn("px-3", cellPad)}>
            <Skeleton className={cn("h-4", c === 0 ? "w-3/4" : "w-1/2", defaultAlign(column) === "right" && "ml-auto")} />
          </td>
        ))}
        {hasActions && <td role="cell" />}
      </tr>
    ));
  } else if (grid.error && rows.length === 0) {
    body = (
      <tr role="row">
        <td role="cell" colSpan={colSpan} className="px-6 py-14 text-center">
          <p className="text-sm font-medium">Couldn&apos;t load {props.noun[1]}</p>
          <p className="mt-1 text-sm text-muted-foreground">{grid.error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={grid.reload}>
            <RotateCw /> Try again
          </Button>
        </td>
      </tr>
    );
  } else if (rows.length === 0) {
    body = (
      <tr role="row">
        <td role="cell" colSpan={colSpan} className="px-6 py-14 text-center">
          <SearchX className="mx-auto mb-3 size-5 text-muted-foreground" />
          <p className="text-sm font-medium">No {props.noun[1]} match</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isRefined(grid.query) ? "Try a different search or remove some filters." : `There are no ${props.noun[1]} on this page.`}
          </p>
          {isRefined(grid.query) && (
            <Button variant="outline" size="sm" className="mt-4" onClick={grid.clearRefinements}>
              Clear search and filters
            </Button>
          )}
        </td>
      </tr>
    );
  } else {
    body = flat.map(({ row, depth, hasChildren }, index) => {
      const rowId = getRowId(row);
      const selected = selection.isSelected(row);
      const isOpen = expansion.isExpanded(rowId);
      const canExpand = hasChildren || Boolean(renderDetail);
      const clickable = Boolean(props.workspace || rowHref || onRowOpen);
      return (
        <Fragment key={rowId}>
          <tr
            data-row
            role="row"
            data-selected={selected}
            tabIndex={index === activeIndex ? 0 : -1}
            aria-selected={selectable ? selected : undefined}
            onFocus={() => setActiveIndex(index)}
            onClick={(event) => {
              if (!clickable || (event.target as HTMLElement).closest(INTERACTIVE)) return;
              if (window.getSelection()?.toString()) return;
              open(row);
            }}
            className={cn(
              // scroll-mt keeps keyboard-focused rows clear of the sticky header.
              "group/row scroll-mt-10 transition-colors duration-100 outline-none focus-visible:shadow-[inset_2px_0_0_var(--selection)]",
              clickable && "cursor-pointer",
            )}
          >
            {selectable && (
              <td role="cell" style={{ position: "sticky", left: 0, zIndex: 2 }} className={cn("px-3", cellPad, CELL_BG)}>
                <div className={cn("flex h-7 items-center transition-opacity duration-100", selection.count === 0 && !selected && "opacity-0 group-hover/row:opacity-100 focus-within:opacity-100")}>
                  <Checkbox
                    checked={selected}
                    onCheckedChange={(value) => selection.toggleRow(row, value === true)}
                    aria-label="Select row"
                  />
                </div>
              </td>
            )}
            {visibleColumns.all.map((column, c) => {
              const pin = pinStyle(column);
              const align = defaultAlign(column);
              return (
                <td
                  key={column.id}
                  role="cell"
                  style={pin.style}
                  className={cn(
                    "overflow-hidden px-3 text-sm whitespace-nowrap",
                    cellPad,
                    CELL_BG,
                    pin.className,
                    align === "right" && "text-right",
                    align === "center" && "text-center",
                  )}
                >
                  {c === 0 && expandable ? (
                    <div className="flex min-w-0 items-center gap-1" style={{ paddingLeft: depth * 20 }}>
                      {canExpand ? (
                        <button
                          type="button"
                          aria-label={isOpen ? "Collapse row" : "Expand row"}
                          aria-expanded={isOpen}
                          onClick={() => expansion.toggle(rowId)}
                          className="-ml-1 flex size-5 shrink-0 items-center justify-center rounded-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <ChevronRight className={cn("size-3.5 transition-transform duration-150", isOpen && "rotate-90")} />
                        </button>
                      ) : (
                        <span className="w-4 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1 truncate">{renderCell(column, row, cells)}</div>
                    </div>
                  ) : (
                    <div className="truncate">{renderCell(column, row, cells)}</div>
                  )}
                </td>
              );
            })}
            {hasActions && (
              <td role="cell" style={{ position: "sticky", right: 0, zIndex: 2 }} className={cn("px-2 text-right", cellPad, CELL_BG)}>
                <div className="opacity-0 transition-opacity duration-100 group-hover/row:opacity-100 group-focus-visible/row:opacity-100 focus-within:opacity-100 has-data-[state=open]:opacity-100">
                  <RowActionsMenu grid={grid} row={row} actions={rowActions ?? []} />
                </div>
              </td>
            )}
          </tr>
          {renderDetail && isOpen && (
            <tr role="row" className="bg-muted/30">
              <td role="cell" colSpan={colSpan} className="p-0">
                <div
                  className="sticky left-0 py-4 pr-4"
                  style={{ width: viewportWidth || undefined, paddingLeft: (selectable ? SELECT_WIDTH : 0) + 36 }}
                >
                  {renderDetail(row)}
                </div>
              </td>
            </tr>
          )}
        </Fragment>
      );
    });
  }

  const banner = showSelectAllBanner && (
    <div className="mb-3 rounded-sm bg-muted/60 px-4 py-2 text-center text-sm">
      {selection.all ? (
        <>
          All <span className="font-medium tabular-nums">{selection.count}</span> {props.noun[1]} are selected.{" "}
          <button type="button" onClick={selection.clear} className="font-medium text-selection hover:underline">
            Clear selection
          </button>
        </>
      ) : (
        <>
          The {rows.length} {props.noun[1]} on this page are selected.{" "}
          <button type="button" onClick={selection.selectAllMatching} className="font-medium text-selection hover:underline">
            Select all {grid.total} {props.noun[1]}
          </button>
        </>
      )}
    </div>
  );

  return (
    <>
    {banner}
    {/* The page (AppScrollArea) scrolls vertically; the table only ever scrolls sideways. */}
    <div role="table" aria-label={props.noun[1]} aria-busy={grid.loading} aria-rowcount={grid.total}>
    <div className="sticky top-0 z-10">
    <div
      ref={headRef}
      onScroll={() => syncScroll(headRef.current, scrollRef.current)}
      onWheel={(e) => {
        if (scrollRef.current && e.deltaX) scrollRef.current.scrollLeft += e.deltaX;
      }}
      className="overflow-hidden"
    >
      <table role="presentation" className="w-full table-fixed border-separate border-spacing-0" style={{ minWidth: tableWidth }}>
        {colgroup}
        <thead role="rowgroup">
          <tr role="row" className="group/head">
            {selectable && (
              <th role="columnheader" style={{ position: "sticky", left: 0, zIndex: 3 }} className={cn("h-10 border-y px-3 text-left", HEAD_BG)}>
                <div className={cn("flex items-center transition-opacity duration-100", selection.count === 0 && "opacity-0 group-hover/head:opacity-100 focus-within:opacity-100")}>
                  <Checkbox
                    checked={selection.pageState === "all" ? true : selection.pageState === "some" ? "indeterminate" : false}
                    onCheckedChange={selection.togglePage}
                    disabled={rows.length === 0}
                    aria-label="Select all rows on this page"
                  />
                </div>
              </th>
            )}
            {visibleColumns.all.map((column) => {
              const pin = pinStyle(column);
              return (
                <HeaderCell
                  key={column.id}
                  grid={grid}
                  column={column}
                  width={widthOf(column)}
                  style={{ ...pin.style, zIndex: pin.style.position ? 3 : undefined }}
                  className={pin.className}
                  onResize={(width) => setLive({ id: column.id, width })}
                  onResizeEnd={(width) => {
                    setLive(null);
                    grid.viewActions.setWidth(column.id, width);
                  }}
                />
              );
            })}
            {hasActions && (
              <th role="columnheader" style={{ position: "sticky", right: 0, zIndex: 3 }} className={cn("h-10 border-y", HEAD_BG)}>
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
      </table>
    </div>
    {/* Deferred so fast responses never flash a loading bar. */}
    {grid.loading && !grid.initialLoading && (
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden opacity-0 [animation:fade-in_150ms_150ms_forwards]">
        <div className="h-full w-1/3 animate-[grid-progress_1s_ease-in-out_infinite] bg-selection" />
      </div>
    )}
    </div>
    <div ref={scrollRef} onScroll={() => syncScroll(scrollRef.current, headRef.current)} className="relative overflow-x-auto overflow-y-hidden">
      <table role="presentation" className="w-full table-fixed border-separate border-spacing-0" style={{ minWidth: tableWidth }}>
        {colgroup}
        <tbody role="rowgroup" ref={bodyRef} onKeyDown={onKeyDown} className={cn("transition-opacity duration-150 [&>tr>td]:border-b", grid.loading && !grid.initialLoading && "opacity-60 delay-150")}>
          {body}
        </tbody>
      </table>
    </div>
    </div>
    </>
  );
}
