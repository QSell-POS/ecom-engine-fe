"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, GripVertical, Palette, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSectionSchema, SECTION_SCHEMAS } from "@/lib/theme-engine/schema";
import type { BlockInstance, BlockSchema, SectionInstance, SectionSchema } from "@/lib/theme-engine/types";
import { cn } from "@/lib/utils";
import type { DragData } from "./dnd";
import { SectionIcon } from "./section-icons";
import { previewLabel } from "./SettingsPanel";
import { useEditor, useEditorStore } from "./store";

const CATEGORY_LABELS: Record<SectionSchema["category"], string> = {
  hero: "Banners",
  products: "Products",
  content: "Content",
  social: "Marketing",
};

function useRemoveWithUndo() {
  const store = useEditorStore();
  return (label: string, remove: () => void) => {
    remove();
    toast(`${label} removed`, { action: { label: "Undo", onClick: () => store.getState().undo() } });
  };
}

const rowBase =
  "group relative flex h-8 items-center gap-1.5 rounded-md pr-1 text-sm transition-colors duration-150";

function OutlineBlock({ sectionId, block, index, blockSchema }: { sectionId: string; block: BlockInstance; index: number; blockSchema: BlockSchema | undefined }) {
  const selected = useEditor((s) => s.selection?.kind === "block" && s.selection.blockId === block.id);
  const select = useEditor((s) => s.select);
  const removeBlock = useEditor((s) => s.removeBlock);
  const removeWithUndo = useRemoveWithUndo();
  const blockName = blockSchema?.name ?? block.type;
  const data: DragData = { kind: "block", sectionId, blockId: block.id, index, label: blockName };
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `outline-block:${block.id}`, data });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(rowBase, "pl-1", selected ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground", isDragging && "z-10 opacity-50")}
    >
      <button type="button" {...attributes} {...listeners} aria-label={`Reorder ${blockName}`} className="cursor-grab rounded p-0.5 text-muted-foreground/0 group-hover:text-muted-foreground focus-visible:text-muted-foreground active:cursor-grabbing">
        <GripVertical className="size-3.5" />
      </button>
      <button type="button" className="min-w-0 flex-1 truncate text-left outline-none" onClick={() => select({ kind: "block", sectionId, blockId: block.id })}>
        {(blockSchema && previewLabel(blockSchema.settings, block.settings)) || blockName}
      </button>
      <button
        type="button"
        aria-label={`Remove ${blockName}`}
        className="rounded p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
        onClick={() => removeWithUndo(blockName, () => removeBlock(sectionId, block.id))}
      >
        <Trash2 className="size-3.5" />
      </button>
    </li>
  );
}

function OutlineSection({ section, index }: { section: SectionInstance; index: number }) {
  const schema = getSectionSchema(section.type);
  const selection = useEditor((s) => s.selection);
  const select = useEditor((s) => s.select);
  const addBlock = useEditor((s) => s.addBlock);
  const removeSection = useEditor((s) => s.removeSection);
  const removeWithUndo = useRemoveWithUndo();
  const [expandedByUser, setExpandedByUser] = useState<boolean | null>(null);

  const isSelected = selection?.kind === "section" && selection.sectionId === section.id;
  const containsSelection = selection?.kind === "block" && selection.sectionId === section.id;
  const expanded = expandedByUser ?? (isSelected || containsSelection);

  const data: DragData = { kind: "section", zone: "outline", sectionId: section.id, sectionType: section.type, index, label: schema?.name ?? section.type };
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `outline:${section.id}`, data });

  if (!schema) return null;
  const hasBlocks = Boolean(schema.blocks?.length);
  const atMax = schema.maxBlocks !== undefined && section.blocks.length >= schema.maxBlocks;

  return (
    <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className={cn(isDragging && "relative z-10 opacity-50")}>
      <div className={cn(rowBase, "pl-0.5", isSelected ? "bg-accent text-foreground" : "text-foreground/85 hover:bg-accent/60")}>
        <button
          type="button"
          aria-label={expanded ? `Collapse ${schema.name}` : `Expand ${schema.name}`}
          aria-expanded={hasBlocks ? expanded : undefined}
          className={cn("rounded p-0.5 text-muted-foreground", !hasBlocks && "invisible")}
          onClick={() => setExpandedByUser(!expanded)}
        >
          <ChevronRight className={cn("size-3.5 transition-transform duration-150", expanded && "rotate-90")} />
        </button>
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${schema.name}`}
          className="cursor-grab rounded text-muted-foreground active:cursor-grabbing"
        >
          <SectionIcon type={section.type} className="size-4" />
        </button>
        <button type="button" className={cn("min-w-0 flex-1 truncate text-left outline-none", isSelected && "font-medium")} onClick={() => select({ kind: "section", sectionId: section.id })}>
          {schema.name}
        </button>
        <button
          type="button"
          aria-label={`Remove ${schema.name}`}
          className="rounded p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
          onClick={() => removeWithUndo(schema.name, () => removeSection(section.id))}
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {expanded && hasBlocks && (
        <div className="ml-[18px] border-l pl-2">
          <SortableContext items={section.blocks.map((b) => `outline-block:${b.id}`)} strategy={verticalListSortingStrategy}>
            <ul className="py-0.5">
              {section.blocks.map((block, blockIndex) => (
                <OutlineBlock
                  key={block.id}
                  sectionId={section.id}
                  block={block}
                  index={blockIndex}
                  blockSchema={schema.blocks?.find((b) => b.type === block.type)}
                />
              ))}
            </ul>
          </SortableContext>
          {!atMax &&
            schema.blocks?.map((blockSchema) => (
              <button
                key={blockSchema.type}
                type="button"
                className="mb-1 flex h-8 w-full items-center gap-1.5 rounded-md px-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
                onClick={() => addBlock(section.id, blockSchema.type)}
              >
                <Plus className="size-3.5" /> Add {blockSchema.name.toLowerCase()}
              </button>
            ))}
        </div>
      )}
    </li>
  );
}

function LibraryItem({ schema, disabled, onAdd }: { schema: SectionSchema; disabled: boolean; onAdd: () => void }) {
  const data: DragData = { kind: "palette", sectionType: schema.type, label: schema.name };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `palette:${schema.type}`, data, disabled });

  return (
    <button
      type="button"
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      disabled={disabled}
      onClick={onAdd}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg p-2 text-left transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring",
        disabled ? "cursor-not-allowed opacity-45" : "cursor-grab hover:bg-accent active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
        <SectionIcon type={schema.type} className="size-4" />
      </span>
      <span className="min-w-0 pt-0.5">
        <span className="block text-sm font-medium">{schema.name}</span>
        <span className="block text-xs leading-relaxed text-muted-foreground">
          {disabled ? "Already on this page" : schema.description}
        </span>
      </span>
    </button>
  );
}

function SectionLibrary() {
  const sections = useEditor((s) => s.doc.sections);
  const selection = useEditor((s) => s.selection);
  const addSection = useEditor((s) => s.addSection);

  // Click-to-add inserts after the selected section, else before the footer.
  function insertIndex() {
    if (selection && selection.kind !== "theme") {
      const index = sections.findIndex((s) => s.id === selection.sectionId);
      if (index !== -1) return index + 1;
    }
    const footer = sections.findIndex((s) => s.type === "footer");
    return footer === -1 ? sections.length : footer;
  }

  const categories = Object.keys(CATEGORY_LABELS) as SectionSchema["category"][];
  return (
    <div className="space-y-5 px-2 pt-1 pb-4">
      <p className="px-2 text-sm text-muted-foreground">Drag a section onto the page, or click to add it below the selection.</p>
      {categories.map((category) => {
        const items = SECTION_SCHEMAS.filter((schema) => schema.category === category);
        if (items.length === 0) return null;
        return (
          <div key={category} className="space-y-0.5">
            <h3 className="px-2 pb-1 text-xs font-medium text-muted-foreground">{CATEGORY_LABELS[category]}</h3>
            {items.map((schema) => (
              <LibraryItem
                key={schema.type}
                schema={schema}
                disabled={Boolean(schema.singleton && sections.some((s) => s.type === schema.type))}
                onAdd={() => addSection(schema.type, insertIndex())}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function LeftPanel() {
  const [tab, setTab] = useState("layers");
  const sections = useEditor((s) => s.doc.sections);
  const themeSelected = useEditor((s) => s.selection?.kind === "theme");
  const select = useEditor((s) => s.select);

  return (
    <aside aria-label="Page structure" className="flex w-72 shrink-0 flex-col border-r bg-background">
      <Tabs value={tab} onValueChange={setTab} className="min-h-0 flex-1 gap-0">
        <div className="border-b px-3 py-2.5">
          <TabsList className="w-full">
            <TabsTrigger value="layers">Layers</TabsTrigger>
            <TabsTrigger value="add">Add section</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="layers" className="min-h-0 overflow-y-auto px-2 py-2">
          {sections.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-sm font-medium">No sections yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Your page&apos;s sections will be listed here.</p>
            </div>
          ) : (
            <SortableContext items={sections.map((s) => `outline:${s.id}`)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-px">
                {sections.map((section, index) => (
                  <OutlineSection key={section.id} section={section} index={index} />
                ))}
              </ul>
            </SortableContext>
          )}
          <button
            type="button"
            onClick={() => setTab("add")}
            className="mt-1 flex h-8 w-full items-center gap-1.5 rounded-md px-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
          >
            <Plus className="size-4" /> Add section
          </button>
        </TabsContent>
        <TabsContent value="add" className="min-h-0 overflow-y-auto pt-2">
          <SectionLibrary />
        </TabsContent>
      </Tabs>

      <div className="border-t p-2">
        <button
          type="button"
          onClick={() => select({ kind: "theme" })}
          aria-pressed={themeSelected}
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-md px-2 text-sm transition-colors duration-150",
            themeSelected ? "bg-accent font-medium text-foreground" : "text-foreground/85 hover:bg-accent/60",
          )}
        >
          <Palette className="size-4 text-muted-foreground" /> Theme settings
        </button>
      </div>
    </aside>
  );
}
