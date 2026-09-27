"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, ListFilter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  activeFilterCount,
  deriveOptions,
  formatValue,
  isActiveFilter,
  type DateRangeValue,
  type FilterOption,
  type FilterValue,
  type GridColumn,
  type RangeValue,
} from "@/lib/data-grid";
import { cn } from "@/lib/utils";
import type { GridUi } from "./ui-state";
import type { DataGridController } from "./use-data-grid";

// Filtering in two familiar steps: pick what to filter by, then pick the
// values. Applied filters read as plain sentences ("Status is Draft").

function optionsFor<T>(grid: DataGridController<T>, column: GridColumn<T>): FilterOption[] {
  if (column.filter?.type !== "multiselect") return [];
  if (column.filter.options) return column.filter.options;
  const { source } = grid.props;
  if (source.mode === "server") return source.facets?.[column.id] ?? [];
  return deriveOptions(column, source.rows);
}

const dayFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const day = (value: string) => dayFormat.format(new Date(`${value}T00:00`));

/** "is Draft or Active", "$50 or more", "after Sep 1, 2026"… */
function describe<T>(grid: DataGridController<T>, column: GridColumn<T>, value: FilterValue): string {
  switch (column.filter?.type) {
    case "multiselect": {
      const options = optionsFor(grid, column);
      const labels = (value as string[]).map((v) => options.find((o) => o.value === v)?.label ?? v);
      return `is ${labels.length > 2 ? `${labels.slice(0, 2).join(", ")} or ${labels.length - 2} more` : labels.join(" or ")}`;
    }
    case "range": {
      const { min, max } = value as RangeValue;
      const fmt = (n: number) => formatValue({ ...column, accessor: () => n, format: undefined }, {} as T);
      if (min !== undefined && max !== undefined) return `from ${fmt(min)} to ${fmt(max)}`;
      return min !== undefined ? `${fmt(min)} or more` : `up to ${fmt(max!)}`;
    }
    case "date-range": {
      const { from, to } = value as DateRangeValue;
      if (from && to) return `between ${day(from)} and ${day(to)}`;
      return from ? `after ${day(from)}` : `before ${day(to!)}`;
    }
    case "boolean":
      return `is ${value ? (column.filter.trueLabel ?? "Yes") : (column.filter.falseLabel ?? "No")}`;
    default:
      return `contains “${String(value)}”`;
  }
}

/** Numeric/text/date inputs apply on blur or Enter, so server grids don't fetch per keystroke. */
function CommitInput({
  value,
  onCommit,
  ...props
}: { value: string; onCommit: (value: string) => void } & Omit<React.ComponentProps<typeof Input>, "value" | "onChange">) {
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  if (synced !== value) {
    setSynced(value);
    setDraft(value);
  }
  return (
    <Input
      {...props}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => draft !== value && onCommit(draft)}
      onKeyDown={(e) => e.key === "Enter" && onCommit(draft)}
      className={cn("h-8", props.className)}
    />
  );
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-xs text-muted-foreground">
      {label}
      {children}
    </label>
  );
}

function ChoiceEditor<T>({ grid, column }: { grid: DataGridController<T>; column: GridColumn<T> }) {
  const options = useMemo(() => optionsFor(grid, column), [grid, column]);
  const selected = (grid.query.filters[column.id] as string[] | undefined) ?? [];
  const toggle = (value: string) => {
    const next = selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value];
    grid.setFilter(column.id, next.length ? next : undefined);
  };
  return (
    <Command className="rounded-none! p-0">
      {options.length > 7 && <CommandInput autoFocus placeholder={`Search ${column.header.toLowerCase()}`} />}
      <CommandList>
        <CommandEmpty>Nothing found</CommandEmpty>
        <CommandGroup>
          {options.map((option) => (
            <CommandItem
              key={option.value}
              value={option.label}
              data-checked={selected.includes(option.value)}
              onSelect={() => toggle(option.value)}
            >
              {option.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

function FieldEditor<T>({ grid, column, onBack }: { grid: DataGridController<T>; column: GridColumn<T>; onBack: () => void }) {
  const current = grid.query.filters[column.id];
  const active = isActiveFilter(current);
  let editor: ReactNode = null;

  switch (column.filter?.type) {
    case "multiselect":
      editor = <ChoiceEditor grid={grid} column={column} />;
      break;
    case "boolean": {
      const labels = { true: column.filter.trueLabel ?? "Yes", false: column.filter.falseLabel ?? "No" };
      editor = (
        <Command className="rounded-none! p-0">
          <CommandList>
            <CommandGroup>
              {(["true", "false"] as const).map((key) => (
                <CommandItem key={key} value={labels[key]} data-checked={current === (key === "true")} onSelect={() => grid.setFilter(column.id, current === (key === "true") ? undefined : key === "true")}>
                  {labels[key]}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      );
      break;
    }
    case "range": {
      const value = (current as RangeValue | undefined) ?? {};
      const parse = (text: string) => (text.trim() === "" || !Number.isFinite(Number(text)) ? undefined : Number(text));
      const set = (patch: RangeValue) => {
        const next = { ...value, ...patch };
        grid.setFilter(column.id, next.min === undefined && next.max === undefined ? undefined : next);
      };
      editor = (
        <div className="grid grid-cols-2 gap-2 p-2">
          <Labeled label="At least">
            <CommitInput autoFocus type="number" inputMode="decimal" placeholder="Any" aria-label={`${column.header} minimum`} value={value.min?.toString() ?? ""} onCommit={(t) => set({ min: parse(t) })} />
          </Labeled>
          <Labeled label="At most">
            <CommitInput type="number" inputMode="decimal" placeholder="Any" aria-label={`${column.header} maximum`} value={value.max?.toString() ?? ""} onCommit={(t) => set({ max: parse(t) })} />
          </Labeled>
        </div>
      );
      break;
    }
    case "date-range": {
      const value = (current as DateRangeValue | undefined) ?? {};
      const set = (patch: DateRangeValue) => {
        const next = { ...value, ...patch };
        grid.setFilter(column.id, !next.from && !next.to ? undefined : next);
      };
      editor = (
        <div className="grid gap-2 p-2">
          <Labeled label="From">
            <CommitInput autoFocus type="date" aria-label={`${column.header} from`} value={value.from ?? ""} onCommit={(t) => set({ from: t || undefined })} />
          </Labeled>
          <Labeled label="To">
            <CommitInput type="date" aria-label={`${column.header} to`} value={value.to ?? ""} onCommit={(t) => set({ to: t || undefined })} />
          </Labeled>
        </div>
      );
      break;
    }
    case "text":
      editor = (
        <div className="p-2">
          <CommitInput
            autoFocus
            placeholder={column.filter.placeholder ?? "Contains…"}
            aria-label={column.header}
            value={String(current ?? "")}
            onCommit={(t) => grid.setFilter(column.id, t.trim() || undefined)}
          />
        </div>
      );
      break;
  }

  return (
    <div>
      <div className="flex h-10 items-center gap-1 border-b pr-2 pl-1">
        <Button variant="ghost" size="icon-sm" aria-label="All filters" onClick={onBack}>
          <ChevronLeft />
        </Button>
        <span className="flex-1 truncate text-sm font-medium">{column.header}</span>
        {active && (
          <button type="button" onClick={() => grid.setFilter(column.id, undefined)} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
            Clear
          </button>
        )}
      </div>
      <div className="p-1">{editor}</div>
    </div>
  );
}

/** "Filter" button → searchable list of fields → that field's values. */
export function FilterMenu<T>({ grid, ui, iconOnly = false }: { grid: DataGridController<T>; ui: GridUi; iconOnly?: boolean }) {
  const count = activeFilterCount(grid.query);
  const filterable = grid.orderedColumns.filter((c) => c.filter);
  if (filterable.length === 0) return null;
  const column = filterable.find((c) => c.id === ui.filter.field);

  return (
    <Popover open={ui.filter.open} onOpenChange={(open) => (open ? ui.openFilter(ui.filter.field) : ui.closeFilter())}>
      <PopoverTrigger asChild>
        <Button variant="outline" size={iconOnly ? "icon" : "default"} className="relative" aria-label={iconOnly ? `Filter${count ? ` (${count} applied)` : ""}` : undefined}>
          <ListFilter />
          {!iconOnly && "Filter"}
          {count > 0 && (
            <span className={cn("rounded-xs bg-primary px-1 text-[11px] leading-4 font-medium text-primary-foreground tabular-nums", iconOnly && "absolute -top-1 -right-1")}>
              {count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(18rem,calc(100vw-2rem))] gap-0 p-0">
        {column ? (
          <FieldEditor grid={grid} column={column} onBack={() => ui.setFilterField(null)} />
        ) : (
          <Command className="rounded-none!">
            <CommandInput autoFocus placeholder="Filter by…" />
            <CommandList>
              <CommandEmpty>Nothing to filter by that name</CommandEmpty>
              <CommandGroup>
                {filterable.map((c) => {
                  const value = grid.query.filters[c.id];
                  const active = isActiveFilter(value);
                  return (
                    <CommandItem key={c.id} value={c.header} onSelect={() => ui.setFilterField(c.id)} className="*:last:hidden">
                      <span className="flex-1 truncate">{c.header}</span>
                      {active ? (
                        <span className="max-w-32 truncate text-xs text-muted-foreground">{describe(grid, c, value as FilterValue)}</span>
                      ) : (
                        <ChevronRight className="text-muted-foreground" />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
            {count > 0 && (
              <div className="border-t p-1">
                <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={grid.clearRefinements}>
                  Clear all filters
                </Button>
              </div>
            )}
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Applied filters as sentences. Click one to change it, × to remove it. */
export function ActiveFilters<T>({ grid, ui, className }: { grid: DataGridController<T>; ui: GridUi; className?: string }) {
  const entries = grid.orderedColumns
    .filter((c) => c.filter && isActiveFilter(grid.query.filters[c.id]))
    .map((column) => ({ column, value: grid.query.filters[column.id] as FilterValue }));
  if (entries.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {entries.map(({ column, value }) => (
        <span key={column.id} className="inline-flex h-7 items-center rounded-sm border bg-background text-xs">
          <button
            type="button"
            onClick={() => ui.openFilter(column.id)}
            className="flex h-full max-w-72 items-center gap-1 truncate rounded-l-sm pr-1 pl-2.5 transition-colors hover:bg-muted"
          >
            <span className="text-muted-foreground">{column.header}</span>
            <span className="truncate font-medium">{describe(grid, column, value)}</span>
          </button>
          <button
            type="button"
            aria-label={`Remove ${column.header} filter`}
            onClick={() => grid.setFilter(column.id, undefined)}
            className="flex h-full w-6 items-center justify-center rounded-r-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <button type="button" onClick={grid.clearRefinements} className="ml-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
        Clear all
      </button>
    </div>
  );
}
