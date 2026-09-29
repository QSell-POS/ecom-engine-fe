"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useDndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  GripVertical,
  LayoutTemplate,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { StoreFrame } from "@/components/storefront/overlay";
import { StoreChrome } from "@/components/storefront/shell";
import {
  StoreProvider,
  type StoreInfo,
} from "@/components/storefront/store-context";
import { ThemeRenderer } from "@/components/storefront/ThemeRenderer";
import { EditorBridgeProvider } from "@/components/storefront/editor-bridge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { HomeData } from "@/lib/storefront/types";
import { getSectionSchema } from "@/lib/theme-engine/schema";
import type { Device, SectionInstance } from "@/lib/theme-engine/types";
import { cn } from "@/lib/utils";
import type { DragData, DropData } from "./dnd";
import { SectionIcon } from "./section-icons";
import { useEditor, useEditorStore } from "./store";

export const DEVICE_WIDTHS: Record<Device, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 390,
};

// Editor chrome rendered inside the scaled frame is counter-scaled so it
// always appears at its true size, whatever the device zoom.
const ScaleContext = createContext(1);

function Unscaled({
  children,
  origin,
  className,
}: {
  children: ReactNode;
  origin: string;
  className?: string;
}) {
  const scale = useContext(ScaleContext);
  return (
    <div
      className={className}
      style={{ transform: `scale(${1 / scale})`, transformOrigin: origin }}
    >
      {children}
    </div>
  );
}

function DropIndicator({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-50 -translate-y-1/2">
      <div className="h-0.5 bg-selection" />
      <Unscaled
        origin="top right"
        className="absolute top-0 right-3 -translate-y-1/2"
      >
        <span className="block rounded-sm bg-selection px-2 py-0.5 text-xs font-medium whitespace-nowrap text-white shadow-sm">
          {label}
        </span>
      </Unscaled>
    </div>
  );
}

function useDropLabel() {
  const { active } = useDndContext();
  const data = active?.data.current as DragData | undefined;
  if (data?.kind === "palette") return `Add ${data.label} here`;
  return "Move here";
}

function ToolbarButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            onClick();
          }}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

function CanvasSection({
  section,
  index,
  count,
  node,
  showDropLine,
}: {
  section: SectionInstance;
  index: number;
  count: number;
  node: ReactNode;
  showDropLine: boolean;
}) {
  const store = useEditorStore();
  const schema = getSectionSchema(section.type);
  const name = schema?.name ?? section.type;
  const selection = useEditor((s) => s.selection);
  const lastInserted = useEditor((s) => s.lastInserted);
  const dropLabel = useDropLabel();
  const ref = useRef<HTMLDivElement | null>(null);

  const dropData: DropData = { kind: "canvas-section", index };
  const { setNodeRef: setDropRef } = useDroppable({
    id: `canvas-drop:${section.id}`,
    data: dropData,
  });
  const dragData: DragData = {
    kind: "section",
    zone: "canvas",
    sectionId: section.id,
    sectionType: section.type,
    index,
    label: name,
  };
  const {
    setNodeRef: setDragRef,
    attributes,
    listeners,
    isDragging,
  } = useDraggable({ id: `canvas-drag:${section.id}`, data: dragData });

  const isSelected =
    selection?.kind === "section" && selection.sectionId === section.id;
  const hasSelectedBlock =
    selection?.kind === "block" && selection.sectionId === section.id;

  // Reveal newly inserted/duplicated sections.
  useEffect(() => {
    if (
      lastInserted?.sectionId === section.id &&
      !lastInserted.blockId &&
      Date.now() - lastInserted.at < 1500
    ) {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [lastInserted, section.id]);

  function run(action: () => void, message?: string) {
    action();
    if (message)
      toast(message, {
        action: { label: "Undo", onClick: () => store.getState().undo() },
      });
  }

  return (
    <div
      ref={(element) => {
        setDropRef(element);
        ref.current = element;
      }}
      className={cn("group/section relative", isDragging && "opacity-40")}
      onClick={(event) => {
        event.stopPropagation();
        store.getState().select({ kind: "section", sectionId: section.id });
      }}
    >
      {showDropLine && <DropIndicator label={dropLabel} />}
      {node}

      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 z-30 transition-[outline-color] duration-150",
          isSelected
            ? "outline-2 -outline-offset-2 outline-selection"
            : hasSelectedBlock
              ? "outline-1 -outline-offset-1 outline-selection/40"
              : "outline-1 -outline-offset-1 outline-transparent group-hover/section:outline-selection/60",
        )}
      />

      <Unscaled
        origin="top left"
        className={cn(
          "absolute top-0 left-0 z-40",
          isSelected ? "block" : "hidden group-hover/section:block",
        )}
      >
        <button
          type="button"
          ref={setDragRef}
          {...attributes}
          {...listeners}
          aria-label={`Drag ${name} to move it`}
          onClick={(event) => {
            event.stopPropagation();
            store.getState().select({ kind: "section", sectionId: section.id });
          }}
          className={cn(
            "flex h-6 cursor-grab items-center gap-1 rounded-br-md pr-2 pl-1 text-xs font-medium whitespace-nowrap active:cursor-grabbing",
            isSelected
              ? "bg-selection text-white"
              : "bg-selection/85 text-white",
          )}
        >
          <GripVertical className="size-3.5 opacity-80" />
          <SectionIcon type={section.type} className="size-3.5" />
          {name}
        </button>
      </Unscaled>

      {isSelected && (
        <Unscaled origin="top right" className="absolute top-2 right-2 z-40">
          <div
            className="flex items-center gap-0.5 rounded-lg border bg-background p-0.5 shadow-md"
            onClick={(event) => event.stopPropagation()}
          >
            <ToolbarButton
              label="Move up"
              disabled={index === 0}
              onClick={() => store.getState().moveSection(index, index - 1)}
            >
              <ArrowUp className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              label="Move down"
              disabled={index === count - 1}
              onClick={() => store.getState().moveSection(index, index + 1)}
            >
              <ArrowDown className="size-4" />
            </ToolbarButton>
            {!schema?.singleton && (
              <ToolbarButton
                label="Duplicate"
                onClick={() => store.getState().duplicateSection(section.id)}
              >
                <Copy className="size-4" />
              </ToolbarButton>
            )}
            <div className="mx-0.5 h-4 w-px bg-border" />
            <ToolbarButton
              label="Remove"
              onClick={() =>
                run(
                  () => store.getState().removeSection(section.id),
                  `${name} removed`,
                )
              }
            >
              <Trash2 className="size-4" />
            </ToolbarButton>
          </div>
        </Unscaled>
      )}
    </div>
  );
}

const STARTER_SECTIONS = ["header", "hero", "featured-collection", "footer"];

function EmptyPage() {
  const addSection = useEditor((s) => s.addSection);
  const sections = useEditor((s) => s.doc.sections);
  return (
    <Unscaled origin="top center" className="flex justify-center px-6 py-24">
      <div
        className="flex max-w-sm flex-col items-center gap-4 text-center text-foreground"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <span className="flex size-10 items-center justify-center rounded-md border bg-background text-muted-foreground">
          <LayoutTemplate className="size-5" />
        </span>
        <div className="space-y-1">
          <p className="text-base font-semibold">This page is empty</p>
          <p className="text-sm text-muted-foreground">
            Drag sections here from{" "}
            <span className="font-medium text-foreground">Add section</span>, or
            start with the essentials:
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {STARTER_SECTIONS.map((type) => {
            const schema = getSectionSchema(type);
            if (!schema) return null;
            return (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  addSection(type, type === "header" ? 0 : sections.length);
                }}
              >
                <Plus /> {schema.name}
              </Button>
            );
          })}
        </div>
      </div>
    </Unscaled>
  );
}

function CanvasEnd({
  empty,
  showDropLine,
}: {
  empty: boolean;
  showDropLine: boolean;
}) {
  const { active } = useDndContext();
  const dropLabel = useDropLabel();
  const dropData: DropData = { kind: "canvas-end" };
  const { setNodeRef } = useDroppable({ id: "canvas-end", data: dropData });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative",
        empty ? "min-h-140 bg-background" : active ? "min-h-40" : "min-h-0",
      )}
    >
      {showDropLine && <DropIndicator label={dropLabel} />}
      {empty && !showDropLine && <EmptyPage />}
    </div>
  );
}

export function Canvas({
  data,
  store,
  dropIndex,
}: {
  data: HomeData;
  store: StoreInfo;
  dropIndex: number | null;
}) {
  const doc = useEditor((s) => s.doc);
  const device = useEditor((s) => s.device);
  const selection = useEditor((s) => s.selection);
  const select = useEditor((s) => s.select);

  const viewportRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(0);
  const [frameHeight, setFrameHeight] = useState(0);

  useEffect(() => {
    const viewport = viewportRef.current;
    const frame = frameRef.current;
    if (!viewport || !frame) return;
    const observer = new ResizeObserver(() => {
      setAvailable(viewport.clientWidth - 64);
      setFrameHeight(frame.offsetHeight);
    });
    observer.observe(viewport);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const width = DEVICE_WIDTHS[device];
  const scale = available > 0 ? Math.min(1, available / width) : 1;
  const selectedBlockId =
    selection?.kind === "block" ? selection.blockId : null;

  return (
    <div
      ref={viewportRef}
      role="region"
      aria-label="Page canvas"
      className="relative min-w-0 flex-1 overflow-auto bg-muted/70 px-8 py-8 scrollbar-gutter:stable"
      onClick={() => select(null)}
    >
      <div
        className="mx-auto overflow-hidden rounded-lg bg-background shadow-[0_0_0_1px_oklch(0_0_0/0.06),0_8px_24px_-8px_oklch(0_0_0/0.12)] transition-[width,height] duration-200 ease-out"
        style={{
          width: width * scale,
          height: frameHeight * scale,
          opacity: available > 0 ? 1 : 0,
        }}
      >
        <div
          ref={frameRef}
          style={{
            width,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
          // The canvas is a live storefront: stop links and forms from navigating away.
          onClickCapture={(event) => {
            if ((event.target as HTMLElement).closest("a"))
              event.preventDefault();
          }}
          onSubmitCapture={(event) => event.preventDefault()}
        >
          <ScaleContext.Provider value={scale}>
            <EditorBridgeProvider
              value={{
                selectedBlockId,
                selectBlock: (sectionId, blockId) =>
                  select({ kind: "block", sectionId, blockId }),
              }}
            >
              {/* The whole store (header, footer, drawers) with the draft's settings, so the canvas is exactly what customers get. */}
              <StoreProvider store={{ ...store, settings: doc.settings }}>
                <StoreFrame settings={doc.settings}>
                  <StoreChrome>
                    <ThemeRenderer
                      document={doc}
                      data={data}
                      renderSection={(section, index, node) => (
                        <CanvasSection
                          section={section}
                          index={index}
                          count={doc.sections.length}
                          node={node}
                          showDropLine={dropIndex === index}
                        />
                      )}
                      after={
                        <CanvasEnd
                          empty={doc.sections.length === 0}
                          showDropLine={dropIndex === doc.sections.length}
                        />
                      }
                    />
                  </StoreChrome>
                </StoreFrame>
              </StoreProvider>
            </EditorBridgeProvider>
          </ScaleContext.Provider>
        </div>
      </div>
    </div>
  );
}
