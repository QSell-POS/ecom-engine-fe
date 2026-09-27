"use client";

import { ArrowDownUp, Download, Eye, EyeOff, Keyboard, ListFilter, Rows3, RotateCcw, SearchX, Upload } from "lucide-react";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { isSortable } from "@/lib/data-grid";
import { directionLabels } from "./SortMenu";
import { useExport } from "./Toolbar";
import type { GridUi } from "./ui-state";
import type { DataGridController } from "./use-data-grid";

// Lower-case for mid-sentence use, but keep acronyms ("SKU") intact.
const lower = (text: string) => (text === text.toUpperCase() ? text : text.toLowerCase());

/**
 * "Find an action" (⌘K / Ctrl K): every advanced capability, searchable in
 * plain words, without adding a single button to the table.
 */
export function GridCommandMenu<T>({ grid, ui }: { grid: DataGridController<T>; ui: GridUi }) {
  const { exportRows } = useExport(grid);
  const { noun, onImport } = grid.props;
  const run = (action: () => void) => {
    ui.setCommandOpen(false);
    action();
  };
  const filterable = grid.orderedColumns.filter((c) => c.filter);
  const sortable = grid.orderedColumns.filter(isSortable);
  const hideable = grid.orderedColumns.filter((c) => c.hideable !== false);

  return (
    <CommandDialog open={ui.commandOpen} onOpenChange={ui.setCommandOpen} title="Find an action" description={`Search actions for ${noun[1]}`}>
      <Command>
      <CommandInput placeholder="What do you want to do?" />
      <CommandList className="max-h-96">
        <CommandEmpty>No matching actions</CommandEmpty>
        {filterable.length > 0 && (
          <CommandGroup heading="Filter">
            {filterable.map((column) => (
              <CommandItem key={column.id} value={`filter by ${column.header}`} onSelect={() => run(() => ui.openFilter(column.id))}>
                <ListFilter /> Filter by {lower(column.header)}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {sortable.length > 0 && (
          <CommandGroup heading="Sort">
            {sortable.flatMap((column) => {
              const words = directionLabels(column);
              return (["asc", "desc"] as const).map((direction) => (
                <CommandItem
                  key={`${column.id}-${direction}`}
                  value={`sort by ${column.header} ${words[direction]}`}
                  onSelect={() => run(() => grid.setSort([{ id: column.id, desc: direction === "desc" }]))}
                >
                  <ArrowDownUp /> Sort by {lower(column.header)}: {words[direction].toLowerCase()}
                </CommandItem>
              ));
            })}
          </CommandGroup>
        )}
        <CommandGroup heading="Columns">
          {hideable.map((column) => {
            const hidden = grid.view.hidden.includes(column.id);
            return (
              <CommandItem key={column.id} value={`${hidden ? "show" : "hide"} column ${column.header}`} onSelect={() => run(() => grid.viewActions.toggleHidden(column.id))}>
                {hidden ? <Eye /> : <EyeOff />} {hidden ? "Show" : "Hide"} {lower(column.header)} column
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandGroup heading="View">
          <CommandItem
            value={grid.view.density === "compact" ? "roomy rows row height" : "compact rows row height dense"}
            onSelect={() => run(() => grid.viewActions.setDensity(grid.view.density === "compact" ? "comfortable" : "compact"))}
          >
            <Rows3 /> {grid.view.density === "compact" ? "Use roomy rows" : "Use compact rows"}
          </CommandItem>
          <CommandItem value="reset table view default columns" onSelect={() => run(grid.viewActions.reset)}>
            <RotateCcw /> Reset table to default
          </CommandItem>
          <CommandItem value="clear search filters" disabled={!grid.query.search && Object.keys(grid.query.filters).length === 0} onSelect={() => run(grid.clearRefinements)}>
            <SearchX /> Clear search and filters
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Data">
          <CommandItem value="download export csv this page" onSelect={() => run(() => void exportRows("page"))}>
            <Download /> Download this page as CSV
          </CommandItem>
          <CommandItem value="download export csv all matching" onSelect={() => run(() => void exportRows("matching"))}>
            <Download /> Download all {grid.total} {noun[1]} as CSV
          </CommandItem>
          {onImport && (
            <CommandItem value="import upload csv" onSelect={() => run(() => ui.setImportOpen(true))}>
              <Upload /> Import from a CSV file
            </CommandItem>
          )}
        </CommandGroup>
        <CommandGroup heading="Help">
          <CommandItem value="keyboard shortcuts help" onSelect={() => run(() => ui.setShortcutsOpen(true))}>
            <Keyboard /> Keyboard shortcuts
          </CommandItem>
        </CommandGroup>
      </CommandList>
      </Command>
    </CommandDialog>
  );
}

const SHORTCUTS: [keys: string[], label: string][] = [
  [["/"], "Search"],
  [["↑", "↓"], "Move between rows"],
  [["Enter"], "Open the selected row"],
  [["X"], "Select or unselect a row"],
  [["Shift", "Click"], "Sort by more than one column"],
  [["[", "]"], "Previous or next page"],
  [["Esc"], "Clear selection · close"],
  [["Ctrl", "K"], "Find an action"],
  [["?"], "Show these shortcuts"],
];

export function ShortcutsDialog({ ui }: { ui: GridUi }) {
  return (
    <Dialog open={ui.shortcutsOpen} onOpenChange={ui.setShortcutsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Work faster without the mouse. None of these are required.</DialogDescription>
        </DialogHeader>
        <dl className="divide-y border-y">
          {SHORTCUTS.map(([keys, label]) => (
            <div key={label} className="flex items-center justify-between py-2 text-sm">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="flex gap-1">
                {keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
