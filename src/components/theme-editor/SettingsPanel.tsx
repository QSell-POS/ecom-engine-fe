"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, Copy, MousePointerClick, Palette, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getSectionSchema, THEME_SETTINGS_GROUPS } from "@/lib/theme-engine/schema";
import type { BlockInstance, SectionSchema, SettingField, SettingValues } from "@/lib/theme-engine/types";
import { SectionIcon } from "./section-icons";
import { SettingInput } from "./SettingInput";
import { useEditor, useEditorStore } from "./store";

/** A short human label for a section/block row, from its first non-empty text setting. */
export function previewLabel(fields: SettingField[], values: SettingValues) {
  for (const field of fields) {
    if ((field.type === "text" || field.type === "textarea") && String(values[field.id] ?? "").trim()) {
      return String(values[field.id]).slice(0, 48);
    }
  }
  return "";
}

function useUndoToast() {
  const store = useEditorStore();
  return (message: string) =>
    toast(message, {
      action: { label: "Undo", onClick: () => store.getState().undo() },
    });
}

function PanelHeader({ icon, title, description, back }: { icon?: ReactNode; title: string; description?: string; back?: ReactNode }) {
  return (
    <div className="border-b px-4 pt-3 pb-4">
      {back}
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

function Fields({
  fields,
  values,
  idPrefix,
  onChange,
}: {
  fields: SettingField[];
  values: SettingValues;
  idPrefix: string;
  onChange: (key: string, value: SettingValues[string]) => void;
}) {
  return (
    <div className="space-y-5">
      {fields.map((field) => (
        <SettingInput
          key={field.id}
          field={field}
          value={values[field.id]}
          idPrefix={idPrefix}
          onChange={(value) => onChange(field.id, value)}
        />
      ))}
    </div>
  );
}

// Moves keyboard focus to the first field of something the user just added,
// so they can start typing immediately.
function useFocusOnInsert(targetId: string, containerRef: React.RefObject<HTMLDivElement | null>) {
  const lastInserted = useEditor((s) => s.lastInserted);
  useEffect(() => {
    if (!lastInserted) return;
    const insertedId = lastInserted.blockId ?? lastInserted.sectionId;
    if (insertedId !== targetId || Date.now() - lastInserted.at > 1500) return;
    const input = containerRef.current?.querySelector<HTMLElement>("input:not([type=color]), textarea");
    input?.focus({ preventScroll: true });
    if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) input.select();
  }, [lastInserted, targetId, containerRef]);
}

function ThemeSettings() {
  const settings = useEditor((s) => s.doc.settings);
  const update = useEditor((s) => s.updateThemeSetting);
  return (
    <>
      <PanelHeader
        icon={<Palette className="size-4 text-muted-foreground" />}
        title="Theme settings"
        description="Colors, type and layout shared by every section."
      />
      <div className="divide-y">
        {THEME_SETTINGS_GROUPS.map((group) => (
          <div key={group.name} className="space-y-4 px-4 py-5">
            <h3 className="text-xs font-medium text-muted-foreground">{group.name}</h3>
            <Fields fields={group.settings} values={settings} idPrefix="theme" onChange={update} />
          </div>
        ))}
      </div>
    </>
  );
}

function IconAction({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label={label} disabled={disabled} onClick={onClick} className="text-muted-foreground">
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function BlockList({ sectionId, schema, blocks }: { sectionId: string; schema: SectionSchema; blocks: BlockInstance[] }) {
  const select = useEditor((s) => s.select);
  const addBlock = useEditor((s) => s.addBlock);
  const moveBlock = useEditor((s) => s.moveBlock);
  const removeBlock = useEditor((s) => s.removeBlock);
  const undoToast = useUndoToast();
  const atMax = schema.maxBlocks !== undefined && blocks.length >= schema.maxBlocks;

  return (
    <div className="space-y-3 px-4 py-5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-xs font-medium text-muted-foreground">Blocks</h3>
        {schema.maxBlocks !== undefined && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {blocks.length} of {schema.maxBlocks}
          </span>
        )}
      </div>
      {blocks.length > 0 && (
        <ul className="overflow-hidden rounded-lg border">
          {blocks.map((block, index) => {
            const blockSchema = schema.blocks?.find((b) => b.type === block.type);
            const label = (blockSchema && previewLabel(blockSchema.settings, block.settings)) || blockSchema?.name;
            return (
              <li key={block.id} className="group flex items-center gap-1 border-b pr-1 last:border-b-0 hover:bg-muted/50">
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate py-2 pl-3 text-left text-sm outline-none focus-visible:underline"
                  onClick={() => select({ kind: "block", sectionId, blockId: block.id })}
                >
                  {label}
                </button>
                <div className="flex opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                  <IconAction label="Move up" disabled={index === 0} onClick={() => moveBlock(sectionId, index, index - 1)}>
                    <ArrowUp />
                  </IconAction>
                  <IconAction label="Move down" disabled={index === blocks.length - 1} onClick={() => moveBlock(sectionId, index, index + 1)}>
                    <ArrowDown />
                  </IconAction>
                  <IconAction
                    label="Remove"
                    onClick={() => {
                      removeBlock(sectionId, block.id);
                      undoToast(`${blockSchema?.name ?? "Block"} removed`);
                    }}
                  >
                    <Trash2 />
                  </IconAction>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {schema.blocks?.map((blockSchema) => (
        <Button
          key={blockSchema.type}
          variant="outline"
          className="w-full justify-start border-dashed text-muted-foreground hover:text-foreground"
          disabled={atMax}
          onClick={() => addBlock(sectionId, blockSchema.type)}
        >
          <Plus /> Add {blockSchema.name.toLowerCase()}
        </Button>
      ))}
      {atMax && <p className="text-xs text-muted-foreground">This section has the maximum number of blocks.</p>}
    </div>
  );
}

function SectionSettings({ sectionId }: { sectionId: string }) {
  const section = useEditor((s) => s.doc.sections.find((sec) => sec.id === sectionId));
  const update = useEditor((s) => s.updateSectionSetting);
  const duplicate = useEditor((s) => s.duplicateSection);
  const remove = useEditor((s) => s.removeSection);
  const undoToast = useUndoToast();
  const fieldsRef = useRef<HTMLDivElement>(null);
  useFocusOnInsert(sectionId, fieldsRef);
  const schema = section && getSectionSchema(section.type);
  if (!section || !schema) return null;

  return (
    <>
      <PanelHeader icon={<SectionIcon type={section.type} className="size-4 text-muted-foreground" />} title={schema.name} description={schema.description} />
      <div ref={fieldsRef} className="px-4 py-5">
        <Fields
          fields={schema.settings}
          values={section.settings}
          idPrefix={section.id}
          onChange={(key, value) => update(section.id, key, value)}
        />
      </div>
      {schema.blocks && (
        <>
          <Separator />
          <BlockList sectionId={section.id} schema={schema} blocks={section.blocks} />
        </>
      )}
      <Separator />
      <div className="flex flex-col items-start gap-1 px-2 py-3">
        {!schema.singleton && (
          <Button variant="ghost" className="text-muted-foreground" onClick={() => duplicate(section.id)}>
            <Copy /> Duplicate section
          </Button>
        )}
        <Button
          variant="ghost"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => {
            remove(section.id);
            undoToast(`${schema.name} removed`);
          }}
        >
          <Trash2 /> Remove section
        </Button>
      </div>
    </>
  );
}

function BlockSettings({ sectionId, blockId }: { sectionId: string; blockId: string }) {
  const section = useEditor((s) => s.doc.sections.find((sec) => sec.id === sectionId));
  const select = useEditor((s) => s.select);
  const update = useEditor((s) => s.updateBlockSetting);
  const duplicate = useEditor((s) => s.duplicateBlock);
  const remove = useEditor((s) => s.removeBlock);
  const undoToast = useUndoToast();
  const fieldsRef = useRef<HTMLDivElement>(null);
  useFocusOnInsert(blockId, fieldsRef);
  const block = section?.blocks.find((b) => b.id === blockId);
  const sectionSchema = section && getSectionSchema(section.type);
  const blockSchema = sectionSchema?.blocks?.find((b) => b.type === block?.type);
  if (!section || !block || !sectionSchema || !blockSchema) return null;
  const atMax = sectionSchema.maxBlocks !== undefined && section.blocks.length >= sectionSchema.maxBlocks;

  return (
    <>
      <PanelHeader
        title={blockSchema.name}
        back={
          <button
            type="button"
            className="-ml-1 mb-2 flex items-center gap-0.5 rounded px-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            onClick={() => select({ kind: "section", sectionId })}
          >
            <ChevronLeft className="size-4" /> {sectionSchema.name}
          </button>
        }
      />
      <div ref={fieldsRef} className="px-4 py-5">
        <Fields
          fields={blockSchema.settings}
          values={block.settings}
          idPrefix={block.id}
          onChange={(key, value) => update(sectionId, blockId, key, value)}
        />
      </div>
      <Separator />
      <div className="flex flex-col items-start gap-1 px-2 py-3">
        <Button variant="ghost" className="text-muted-foreground" disabled={atMax} onClick={() => duplicate(sectionId, blockId)}>
          <Copy /> Duplicate {blockSchema.name.toLowerCase()}
        </Button>
        <Button
          variant="ghost"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => {
            remove(sectionId, blockId);
            select({ kind: "section", sectionId });
            undoToast(`${blockSchema.name} removed`);
          }}
        >
          <Trash2 /> Remove {blockSchema.name.toLowerCase()}
        </Button>
      </div>
    </>
  );
}

export function SettingsPanel() {
  const selection = useEditor((s) => s.selection);
  const select = useEditor((s) => s.select);

  return (
    <aside aria-label="Settings" className="flex w-80 shrink-0 flex-col overflow-y-auto border-l bg-background">
      {selection?.kind === "theme" && <ThemeSettings />}
      {selection?.kind === "section" && <SectionSettings key={selection.sectionId} sectionId={selection.sectionId} />}
      {selection?.kind === "block" && (
        <BlockSettings key={selection.blockId} sectionId={selection.sectionId} blockId={selection.blockId} />
      )}
      {!selection && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <span className="flex size-10 items-center justify-center rounded-md border bg-background text-muted-foreground">
            <MousePointerClick className="size-5" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium">Nothing selected</p>
            <p className="text-sm text-muted-foreground">Click any section on the page to edit its content and style.</p>
          </div>
          <Button variant="outline" onClick={() => select({ kind: "theme" })}>
            <Palette /> Theme settings
          </Button>
        </div>
      )}
    </aside>
  );
}
