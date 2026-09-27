"use client";

import { useState } from "react";
import { ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useGridActions } from "./use-actions";
import type { DataGridController } from "./use-data-grid";

export function BulkBar<T>({ grid, floating }: { grid: DataGridController<T>; floating: boolean }) {
  const { runBulkAction } = useGridActions(grid);
  const [running, setRunning] = useState<string | null>(null);
  const { selection, props } = grid;
  const actions = props.bulkActions ?? [];

  async function run(id: string) {
    const action = actions.find((a) => a.id === id);
    if (!action) return;
    setRunning(id);
    await runBulkAction(action);
    setRunning(null);
  }

  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className={cn(
        "flex items-center gap-2",
        floating
          ? "fixed inset-x-3 bottom-3 z-40 rounded-md border bg-background p-2 shadow-lg"
          : "mb-3 h-11 rounded-sm border border-selection/25 bg-[color-mix(in_oklch,var(--selection)_6%,var(--background))] px-3",
      )}
    >
      {!floating && (
        <Checkbox
          checked={selection.pageState === "all" ? true : selection.pageState === "some" ? "indeterminate" : false}
          onCheckedChange={selection.togglePage}
          aria-label="Select all rows on this page"
          className="mr-1"
        />
      )}
      <span className="text-sm font-medium tabular-nums">
        {selection.all ? `All ${selection.count}` : selection.count} selected
      </span>
      {floating ? (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button className="ml-auto" disabled={running !== null}>
              {running ? <Spinner /> : null}
              Actions <ChevronUp />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-48">
            {actions
              .filter((a) => a.tone !== "destructive")
              .map((action) => (
                <DropdownMenuItem key={action.id} onSelect={() => void run(action.id)}>
                  {action.icon && <action.icon />} {action.label}
                </DropdownMenuItem>
              ))}
            {actions.some((a) => a.tone === "destructive") && <DropdownMenuSeparator />}
            {actions
              .filter((a) => a.tone === "destructive")
              .map((action) => (
                <DropdownMenuItem key={action.id} variant="destructive" onSelect={() => void run(action.id)}>
                  {action.icon && <action.icon />} {action.label}
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
      <div className="ml-3 flex items-center gap-1.5">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant={action.tone === "destructive" ? "destructive" : "outline"}
            size={floating ? "default" : "sm"}
            disabled={running !== null}
            onClick={() => run(action.id)}
          >
            {running === action.id ? <Spinner /> : action.icon && <action.icon />}
            {action.label}
          </Button>
        ))}
      </div>
      )}
      <Button
        variant="ghost"
        size={floating ? "icon" : "sm"}
        className={cn("text-muted-foreground", !floating && "ml-auto")}
        onClick={selection.clear}
        aria-label="Clear selection"
      >
        {floating ? <X /> : "Clear"}
      </Button>
    </div>
  );
}
