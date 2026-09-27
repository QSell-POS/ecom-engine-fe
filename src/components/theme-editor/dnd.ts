import {
  closestCenter,
  pointerWithin,
  type CollisionDetection,
  type DragMoveEvent,
} from "@dnd-kit/core";

// One DndContext drives three kinds of drags:
//  - palette -> canvas/outline : add a new section at the drop position
//  - section (outline or canvas handle) : reorder sections
//  - block (outline) : reorder blocks within their section
export type DragData =
  | { kind: "palette"; sectionType: string; label: string }
  | { kind: "section"; zone: "outline" | "canvas"; sectionId: string; sectionType: string; index: number; label: string }
  | { kind: "block"; sectionId: string; blockId: string; index: number; label: string };

export type DropData =
  | { kind: "canvas-section"; index: number }
  | { kind: "canvas-end" }
  | Extract<DragData, { kind: "section" | "block" }>;

export const collisionDetection: CollisionDetection = (args) => {
  const active = args.active.data.current as DragData | undefined;
  const fromOutline = active?.kind === "section" && active.zone === "outline";

  const droppableContainers = args.droppableContainers.filter((container) => {
    const drop = container.data.current as DropData | undefined;
    if (!drop || !active) return false;
    if (active.kind === "block") return drop.kind === "block" && drop.sectionId === active.sectionId;
    if (fromOutline) return drop.kind === "section" && drop.zone === "outline";
    return drop.kind === "canvas-section" || drop.kind === "canvas-end" || (drop.kind === "section" && drop.zone === "outline");
  });

  const filtered = { ...args, droppableContainers };
  return active?.kind === "block" || fromOutline ? closestCenter(filtered) : pointerWithin(filtered);
};

/** Insertion index for a new/moved section, based on where the pointer is over the canvas. */
export function sectionInsertIndex(event: Pick<DragMoveEvent, "over" | "activatorEvent" | "delta">, sectionCount: number) {
  const { over, activatorEvent, delta } = event;
  const drop = over?.data.current as DropData | undefined;
  if (!over || !drop) return null;
  if (drop.kind === "canvas-end") return sectionCount;
  if (drop.kind === "section" && drop.zone === "outline") return drop.index;
  if (drop.kind !== "canvas-section") return null;

  const pointerY = "clientY" in activatorEvent ? (activatorEvent as PointerEvent).clientY + delta.y : over.rect.top;
  return pointerY < over.rect.top + over.rect.height / 2 ? drop.index : drop.index + 1;
}
