"use client";

import { useRef, useState, type ReactNode } from "react";
import { ChevronRight, RotateCw, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { isRefined } from "@/lib/data-grid";
import { cn } from "@/lib/utils";
import { RowSummary, summaryRoles } from "./summary";
import { RowActionsMenu } from "./TableView";
import type { RowAction } from "./types";
import { useGridActions } from "./use-actions";
import type { DataGridController } from "./use-data-grid";

const ACTION_WIDTH = 76;
const LONG_PRESS_MS = 450;

type SwipeProps<T> = {
  grid: DataGridController<T>;
  row: T;
  leading: RowAction<T>[];
  trailing: RowAction<T>[];
  open: "leading" | "trailing" | null;
  onOpenChange: (side: "leading" | "trailing" | null) => void;
  onTap: () => void;
  onLongPress: () => void;
  children: ReactNode;
};

/** Horizontal swipe reveals actions; vertical movement is left to the page scroll. */
function SwipeRow<T>({ grid, row, leading, trailing, open, onOpenChange, onTap, onLongPress, children }: SwipeProps<T>) {
  const { runRowAction } = useGridActions(grid);
  const start = useRef<{ x: number; y: number; base: number; axis: "x" | "y" | null; moved: boolean } | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [dragX, setDragX] = useState<number | null>(null);

  const leadingWidth = leading.length * ACTION_WIDTH;
  const trailingWidth = trailing.length * ACTION_WIDTH;
  const restX = open === "leading" ? leadingWidth : open === "trailing" ? -trailingWidth : 0;
  const x = dragX ?? restX;

  function end() {
    clearTimeout(pressTimer.current);
    const state = start.current;
    start.current = null;
    if (!state) return;
    if (!state.moved) {
      if (open) onOpenChange(null);
      else onTap();
      return;
    }
    if (dragX !== null) {
      if (dragX > leadingWidth * 0.45 && leading.length) onOpenChange("leading");
      else if (dragX < -trailingWidth * 0.45 && trailing.length) onOpenChange("trailing");
      else onOpenChange(null);
    }
    setDragX(null);
  }

  const actionButton = (action: RowAction<T>) => (
    <button
      key={action.id}
      type="button"
      onClick={() => {
        onOpenChange(null);
        void runRowAction(action, row);
      }}
      style={{ width: ACTION_WIDTH }}
      className={cn(
        "flex h-full flex-col items-center justify-center gap-1 text-xs font-medium text-white",
        action.tone === "destructive" ? "bg-destructive" : "bg-foreground/80",
      )}
    >
      {action.icon && <action.icon className="size-4" />}
      {action.label}
    </button>
  );

  return (
    <div className="relative overflow-hidden">
      {leading.length > 0 && <div className="absolute inset-y-0 left-0 flex">{leading.map(actionButton)}</div>}
      {trailing.length > 0 && <div className="absolute inset-y-0 right-0 flex">{trailing.map(actionButton)}</div>}
      <div
        className={cn("relative bg-background touch-pan-y select-none", dragX === null && "transition-transform duration-200 ease-out")}
        style={{ transform: `translateX(${x}px)` }}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button, a, [role=checkbox]")) return;
          start.current = { x: e.clientX, y: e.clientY, base: restX, axis: null, moved: false };
          pressTimer.current = setTimeout(() => {
            if (start.current && !start.current.moved) {
              start.current = null;
              navigator.vibrate?.(10);
              onLongPress();
            }
          }, LONG_PRESS_MS);
        }}
        onPointerMove={(e) => {
          const state = start.current;
          if (!state) return;
          const dx = e.clientX - state.x;
          const dy = e.clientY - state.y;
          if (!state.axis && Math.hypot(dx, dy) > 8) {
            state.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
            state.moved = true;
            clearTimeout(pressTimer.current);
            if (state.axis === "x") e.currentTarget.setPointerCapture(e.pointerId);
          }
          if (state.axis !== "x") return;
          const next = state.base + dx;
          const min = trailing.length ? -trailingWidth - 24 : 0;
          const max = leading.length ? leadingWidth + 24 : 0;
          setDragX(Math.max(min, Math.min(max, next)));
        }}
        onPointerUp={end}
        onPointerCancel={() => {
          clearTimeout(pressTimer.current);
          start.current = null;
          setDragX(null);
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function ListView<T>({ grid, selectMode, onSelectModeChange }: { grid: DataGridController<T>; selectMode: boolean; onSelectModeChange: (on: boolean) => void }) {
  const { props, rows, selection, expansion } = grid;
  const { getRowId, rowActions = [], getSubRows, bulkActions } = props;
  const [openSwipe, setOpenSwipe] = useState<{ id: string; side: "leading" | "trailing" } | null>(null);
  const selectable = Boolean(bulkActions?.length);
  const roles = summaryRoles(grid);
  const open = grid.openItem;

  if (grid.initialLoading) {
    return (
      <ul className="divide-y border-y">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-3">
            {roles.media && <Skeleton className="size-10 rounded-md" />}
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (grid.error && rows.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm font-medium">Couldn&apos;t load {props.noun[1]}</p>
        <p className="mt-1 text-sm text-muted-foreground">{grid.error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={grid.reload}>
          <RotateCw /> Try again
        </Button>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <SearchX className="mx-auto mb-3 size-5 text-muted-foreground" />
        <p className="text-sm font-medium">No {props.noun[1]} match</p>
        {isRefined(grid.query) && (
          <Button variant="outline" size="sm" className="mt-4" onClick={grid.clearRefinements}>
            Clear search and filters
          </Button>
        )}
      </div>
    );
  }

  const items: { row: T; depth: number; hasChildren: boolean }[] = [];
  const walk = (list: T[], depth: number) => {
    for (const row of list) {
      const children = getSubRows ? grid.getChildren(row) : [];
      items.push({ row, depth, hasChildren: children.length > 0 });
      if (children.length && expansion.isExpanded(getRowId(row))) walk(children, depth + 1);
    }
  };
  walk(rows, 0);

  return (
    <ul className={cn("divide-y border-y transition-opacity duration-150", grid.loading && "opacity-60 delay-150")}>
      {items.map(({ row, depth, hasChildren }) => {
        const rowId = getRowId(row);
        const selected = selection.isSelected(row);
        const available = rowActions.filter((a) => !a.hidden?.(row));

        return (
          <li key={rowId} data-selected={selected} className="data-[selected=true]:bg-selection/5">
            <SwipeRow
              grid={grid}
              row={row}
              leading={selectMode ? [] : available.filter((a) => a.swipe === "leading")}
              trailing={selectMode ? [] : available.filter((a) => a.swipe === "trailing")}
              open={openSwipe?.id === rowId ? openSwipe.side : null}
              onOpenChange={(side) => setOpenSwipe(side ? { id: rowId, side } : null)}
              onTap={() => (selectMode ? selection.toggleRow(row) : open(row))}
              onLongPress={() => {
                if (!selectable) return;
                onSelectModeChange(true);
                selection.toggleRow(row, true);
              }}
            >
              <div className={cn("flex items-center gap-3 py-3 pr-2", selected && "bg-[color-mix(in_oklch,var(--selection)_6%,var(--background))]")} style={{ paddingLeft: 16 + depth * 16 }}>
                {selectMode && (
                  <Checkbox checked={selected} onCheckedChange={(v) => selection.toggleRow(row, v === true)} aria-label="Select" />
                )}
                {hasChildren && (
                  <button
                    type="button"
                    aria-label={expansion.isExpanded(rowId) ? "Collapse" : "Expand"}
                    onClick={() => expansion.toggle(rowId)}
                    className="-ml-1 flex size-6 shrink-0 items-center justify-center rounded-xs text-muted-foreground"
                  >
                    <ChevronRight className={cn("size-4 transition-transform duration-150", expansion.isExpanded(rowId) && "rotate-90")} />
                  </button>
                )}
                <RowSummary grid={grid} row={row} roles={roles} />
                {!selectMode && available.length > 0 && <RowActionsMenu grid={grid} row={row} actions={available} />}
              </div>
            </SwipeRow>
          </li>
        );
      })}
    </ul>
  );
}
