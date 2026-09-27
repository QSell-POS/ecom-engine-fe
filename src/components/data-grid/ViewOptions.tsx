"use client";

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, MoreHorizontal, Pin, PinOff, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PAGE_SIZE_OPTIONS, type GridColumn } from "@/lib/data-grid";
import { cn } from "@/lib/utils";
import type { DataGridController, Density, Presentation } from "./use-data-grid";

function ColumnRow<T>({ grid, column }: { grid: DataGridController<T>; column: GridColumn<T> }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.id });
  const visible = !grid.view.hidden.includes(column.id);
  const pinned = grid.view.pinLeft.includes(column.id) ? "left" : grid.view.pinRight.includes(column.id) ? "right" : null;
  const hideable = column.hideable !== false;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("group flex h-8 items-center gap-1 rounded-sm pr-1 pl-0.5 hover:bg-accent/60", isDragging && "relative z-10 bg-background shadow-sm")}
    >
      <button type="button" {...attributes} {...listeners} aria-label={`Reorder ${column.header}`} className="cursor-grab rounded-xs p-1 text-muted-foreground/60 active:cursor-grabbing">
        <GripVertical className="size-3.5" />
      </button>
      <button
        type="button"
        disabled={!hideable}
        onClick={() => grid.viewActions.toggleHidden(column.id)}
        aria-pressed={visible}
        className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm disabled:cursor-default"
      >
        <span className={cn("flex size-3.5 shrink-0 items-center justify-center rounded-xs border", visible ? "border-primary bg-primary text-primary-foreground" : "border-input", !hideable && "opacity-40")}>
          {visible && <Check className="size-3" strokeWidth={3} />}
        </span>
        <span className={cn("truncate", !visible && "text-muted-foreground")}>{column.header}</span>
      </button>
      {pinned && <Pin className="size-3 text-muted-foreground" aria-label={`Frozen on ${pinned}`} />}
      {column.pinnable !== false && (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label={`${column.header} options`} className="rounded-xs p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-open:opacity-100">
              <MoreHorizontal className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            {pinned !== "left" && (
              <DropdownMenuItem onSelect={() => grid.viewActions.pin(column.id, "left")}>
                <Pin /> Freeze on left
              </DropdownMenuItem>
            )}
            {pinned !== "right" && (
              <DropdownMenuItem onSelect={() => grid.viewActions.pin(column.id, "right")}>
                <Pin /> Freeze on right
              </DropdownMenuItem>
            )}
            {pinned && (
              <DropdownMenuItem onSelect={() => grid.viewActions.pin(column.id, null)}>
                <PinOff /> Unfreeze
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  );
}


function Setting({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      {children}
    </div>
  );
}

/** Everything about how the table looks, behind one "Customize" button. */
export function ViewOptions<T>({ grid, compact }: { grid: DataGridController<T>; compact: boolean }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = grid.orderedColumns.map((c) => c.id);

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    grid.viewActions.setOrder(arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  }

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Customize table">
              <Settings2 />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Customize table</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-[min(18rem,calc(100vw-2rem))] gap-0 p-0">
        <div className="border-b px-3 py-2.5">
          <p className="text-sm font-medium">Customize table</p>
          <p className="text-xs text-muted-foreground">Only you see these changes.</p>
        </div>
        <div className="border-b p-2">
          <p className="px-1.5 pb-1 text-xs text-muted-foreground">Columns · drag to reorder</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <ul className="max-h-56 overflow-y-auto">
                {grid.orderedColumns.map((column) => (
                  <ColumnRow key={column.id} grid={grid} column={column} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
        <div className="space-y-2.5 border-b p-3">
          <Setting label="Row height">
            <ToggleGroup type="single" variant="outline" size="sm" spacing={0} value={grid.view.density} onValueChange={(value) => value && grid.viewActions.setDensity(value as Density)}>
              <ToggleGroupItem value="comfortable">Roomy</ToggleGroupItem>
              <ToggleGroupItem value="compact">Compact</ToggleGroupItem>
            </ToggleGroup>
          </Setting>
          <Setting label="Rows per page">
            <ToggleGroup type="single" variant="outline" size="sm" spacing={0} value={String(grid.query.pageSize)} onValueChange={(value) => value && grid.setPageSize(Number(value))}>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <ToggleGroupItem key={size} value={String(size)} className="tabular-nums">
                  {size}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Setting>
          {!compact && (
            <Setting label="Show as">
              <ToggleGroup type="single" variant="outline" size="sm" spacing={0} value={grid.view.presentation} onValueChange={(value) => value && grid.viewActions.setPresentation(value as Presentation)}>
                <ToggleGroupItem value="auto" title="Table on large screens, cards on small ones">Auto</ToggleGroupItem>
                <ToggleGroupItem value="table">Table</ToggleGroupItem>
                <ToggleGroupItem value="list">Cards</ToggleGroupItem>
              </ToggleGroup>
            </Setting>
          )}
        </div>
        <div className="p-1">
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={grid.viewActions.reset}>
            Reset to default
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
