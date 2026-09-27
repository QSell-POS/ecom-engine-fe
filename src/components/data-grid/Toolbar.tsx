"use client";

import { useState, type RefObject } from "react";
import { Command as CommandIcon, Download, Keyboard, MoreHorizontal, Search, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { applyQuery, toCsv } from "@/lib/data-grid";
import { cn } from "@/lib/utils";
import { ActiveFilters, FilterMenu } from "./Filters";
import { SortMenu } from "./SortMenu";
import type { GridUi } from "./ui-state";
import type { DataGridController } from "./use-data-grid";
import { ViewOptions } from "./ViewOptions";

function download(fileName: string, csv: string) {
  const url = URL.createObjectURL(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: `${fileName}.csv` });
  link.click();
  URL.revokeObjectURL(url);
}

export type ExportScope = "page" | "matching" | "selected";

/** CSV export of the visible columns, shared by the menu and the command menu. */
export function useExport<T>(grid: DataGridController<T>) {
  const [busy, setBusy] = useState(false);
  const { source, exportFileName, noun } = grid.props;

  async function exportRows(scope: ExportScope) {
    try {
      setBusy(true);
      let rows: T[];
      if (scope === "page") rows = grid.rows;
      else if (scope === "selected") rows = grid.selection.resolve().rows;
      else if (source.mode === "client") rows = applyQuery(source.rows, grid.props.columns, grid.query, { paginate: false }).rows;
      else rows = (await source.load({ ...grid.query, page: 1, pageSize: Math.min(grid.total, 10_000) })).rows;
      download(exportFileName ?? noun[1], toCsv(rows, grid.visibleColumns.all));
      toast.success(`Downloaded ${rows.length} ${rows.length === 1 ? noun[0] : noun[1]}`);
    } catch {
      toast.error("Download failed", { description: "Please try again." });
    } finally {
      setBusy(false);
    }
  }

  const canExportSelected = grid.selection.count > 0 && (source.mode === "client" || !grid.selection.all);
  return { busy, exportRows, canExportSelected };
}

/** Debounced search with a clear button; Enter searches now, Esc clears, "/" focuses. */
export function SearchField<T>({
  grid,
  searchRef,
  className,
}: {
  grid: DataGridController<T>;
  searchRef: RefObject<HTMLInputElement | null>;
  className?: string;
}) {
  const { searchPlaceholder, noun } = grid.props;
  const placeholder = searchPlaceholder ?? `Search ${noun[1]}`;
  return (
    <InputGroup className={className}>
      <InputGroupAddon>{grid.loading && grid.searchInput ? <Spinner /> : <Search />}</InputGroupAddon>
      <InputGroupInput
        ref={searchRef}
        value={grid.searchInput}
        onChange={(e) => grid.setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") grid.setSearch(grid.searchInput, { immediate: true });
          if (e.key === "Escape" && grid.searchInput) {
            e.stopPropagation();
            grid.setSearch("", { immediate: true });
          }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        type="search"
        className="[&::-webkit-search-cancel-button]:hidden"
      />
      {grid.searchInput && (
        <InputGroupAddon align="inline-end">
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => grid.setSearch("", { immediate: true })}
            className="flex size-5 items-center justify-center rounded-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}

const mod = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl";

/** Less frequent tasks: import, download, the command menu and shortcuts. */
function MoreMenu<T>({ grid, ui, compact, selectMode, onToggleSelectMode }: { grid: DataGridController<T>; ui: GridUi; compact: boolean; selectMode: boolean; onToggleSelectMode: () => void }) {
  const { busy, exportRows, canExportSelected } = useExport(grid);
  const { onImport, bulkActions, noun } = grid.props;

  return (
    <DropdownMenu modal={false}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="More actions" disabled={busy}>
              {busy ? <Spinner /> : <MoreHorizontal />}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>More actions</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-60">
        {compact && bulkActions?.length ? (
          <>
            <DropdownMenuItem onSelect={onToggleSelectMode}>{selectMode ? "Done selecting" : `Select ${noun[1]}`}</DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
        {onImport && (
          <DropdownMenuItem onSelect={() => ui.setImportOpen(true)}>
            <Upload /> Import from a CSV file…
          </DropdownMenuItem>
        )}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Download /> Download as CSV
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56">
            <DropdownMenuItem onSelect={() => exportRows("page")}>
              This page <span className="ml-auto text-muted-foreground tabular-nums">{grid.rows.length}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => exportRows("matching")}>
              {grid.total === grid.rows.length ? `All ${noun[1]}` : `All ${grid.total} ${noun[1]}`}
            </DropdownMenuItem>
            {canExportSelected && (
              <DropdownMenuItem onSelect={() => exportRows("selected")}>
                Selected <span className="ml-auto text-muted-foreground tabular-nums">{grid.selection.count}</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {!compact && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => ui.setCommandOpen(true)}>
              <CommandIcon /> Find an action…
              <DropdownMenuShortcut>{mod} K</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => ui.setShortcutsOpen(true)}>
              <Keyboard /> Keyboard shortcuts
              <DropdownMenuShortcut>?</DropdownMenuShortcut>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Toolbar<T>({
  grid,
  ui,
  compact,
  selectMode,
  onToggleSelectMode,
  searchRef,
}: {
  grid: DataGridController<T>;
  ui: GridUi;
  compact: boolean;
  selectMode: boolean;
  onToggleSelectMode: () => void;
  searchRef: RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="space-y-2.5 pb-3">
      <div className={cn("flex items-center gap-2", compact && "flex-wrap")}>
        <SearchField grid={grid} searchRef={searchRef} className={compact ? "h-9 w-full" : "h-9 w-80"} />
        <FilterMenu grid={grid} ui={ui} />
        <SortMenu grid={grid} />
        <div className="ml-auto flex items-center gap-0.5">
          <ViewOptions grid={grid} compact={compact} />
          <MoreMenu grid={grid} ui={ui} compact={compact} selectMode={selectMode} onToggleSelectMode={onToggleSelectMode} />
        </div>
      </div>
      <ActiveFilters grid={grid} ui={ui} />
    </div>
  );
}
