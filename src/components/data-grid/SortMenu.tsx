"use client";

import { ArrowDownUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isSortable, type GridColumn } from "@/lib/data-grid";
import type { DataGridController } from "./use-data-grid";

/** Everyday words for a sort direction, by what the column holds. */
export function directionLabels<T>(column: GridColumn<T>): { asc: string; desc: string } {
  switch (column.type) {
    case "number":
    case "currency":
    case "percent":
      return { asc: "Low to high", desc: "High to low" };
    case "date":
    case "datetime":
      return { asc: "Oldest first", desc: "Newest first" };
    default:
      return { asc: "A to Z", desc: "Z to A" };
  }
}

/** "Sort" button. Shows what the list is sorted by in plain words ("Price: High to low"). */
export function SortMenu<T>({ grid, iconOnly = false }: { grid: DataGridController<T>; iconOnly?: boolean }) {
  const sortable = grid.orderedColumns.filter(isSortable);
  if (sortable.length === 0) return null;
  const primary = grid.query.sort[0];
  const column = primary ? sortable.find((c) => c.id === primary.id) : undefined;
  const words = column && directionLabels(column);
  const summary = column && words ? `${column.header}: ${primary.desc ? words.desc : words.asc}` : undefined;
  const more = grid.query.sort.length - 1;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={iconOnly ? "icon" : "default"}
          aria-label={summary ? `Sorted by ${summary}` : "Sort"}
          title={iconOnly ? (summary ? `Sorted by ${summary}` : "Sort") : undefined}
          className="max-w-64"
        >
          <ArrowDownUp />
          {!iconOnly && <span className="truncate">{summary ?? "Sort"}</span>}
          {!iconOnly && more > 0 && <span className="text-muted-foreground">+{more}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Sort by</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={primary?.id ?? ""}
          onValueChange={(id) => {
            const next = sortable.find((c) => c.id === id);
            // Numbers and dates start with the most useful end: highest / newest.
            const numericOrDate = next && ["number", "currency", "percent", "date", "datetime"].includes(next.type ?? "");
            grid.setSort([{ id, desc: primary?.id === id ? primary.desc : Boolean(numericOrDate) }]);
          }}
        >
          {sortable.map((c) => (
            <DropdownMenuRadioItem key={c.id} value={c.id}>
              {c.header}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {primary && words && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={primary.desc ? "desc" : "asc"}
              onValueChange={(direction) => grid.setSort([{ id: primary.id, desc: direction === "desc" }])}
            >
              <DropdownMenuRadioItem value="asc">{words.asc}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="desc">{words.desc}</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => grid.setSort([])}>Reset sort</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
