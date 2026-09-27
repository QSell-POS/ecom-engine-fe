"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { ArrowLeft, Eye, Monitor, Redo2, Smartphone, Tablet, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { StatusLabel } from "@/components/common/StatusLabel";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { publishThemeAction, saveThemeDraftAction } from "@/lib/api/theme/action";
import { THEME_ROUTES } from "@/lib/api/theme/constants";
import type { Theme } from "@/lib/api/theme/types";
import type { StoreInfo } from "@/components/storefront/store-context";
import type { HomeData } from "@/lib/storefront/types";
import type { Device } from "@/lib/theme-engine/types";
import { Canvas } from "./Canvas";
import { collisionDetection, sectionInsertIndex, type DragData, type DropData } from "./dnd";
import { LeftPanel } from "./LeftPanel";
import { SectionIcon } from "./section-icons";
import { SettingsPanel } from "./SettingsPanel";
import {
  createEditorStore,
  EditorStoreContext,
  selectHasUnpublished,
  selectIsDirty,
  useEditor,
  useEditorStore,
} from "./store";

type Busy = "saving" | "publishing" | null;

const DEVICES: { id: Device; label: string; icon: typeof Monitor }[] = [
  { id: "desktop", label: "Desktop", icon: Monitor },
  { id: "tablet", label: "Tablet", icon: Tablet },
  { id: "mobile", label: "Mobile", icon: Smartphone },
];

const MOD = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl";

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return Boolean(el?.closest("input, textarea, select, [contenteditable=true]"));
}

function HintTooltip({ label, keys, children }: { label: string; keys?: string[]; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="flex items-center gap-2">
        {label}
        {keys && (
          <KbdGroup>
            {keys.map((key) => (
              <Kbd key={key}>{key}</Kbd>
            ))}
          </KbdGroup>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

function SaveStatus({ busy, isDirty, isLive, hasUnpublished }: { busy: Busy; isDirty: boolean; isLive: boolean; hasUnpublished: boolean }) {
  let content: ReactNode;
  if (busy) {
    content = (
      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <Spinner className="size-3" /> {busy === "publishing" ? "Publishing…" : "Saving…"}
      </span>
    );
  } else if (isDirty) {
    content = <StatusLabel tone="warning" className="text-muted-foreground">Unsaved changes</StatusLabel>;
  } else if (isLive && !hasUnpublished) {
    content = <StatusLabel tone="success" className="text-muted-foreground">Live</StatusLabel>;
  } else if (isLive) {
    content = <StatusLabel tone="info" className="text-muted-foreground">Saved · not published</StatusLabel>;
  } else {
    content = <StatusLabel tone="neutral" className="text-muted-foreground">Draft saved</StatusLabel>;
  }
  return (
    <span role="status" aria-live="polite" className="min-w-0 truncate">
      {content}
    </span>
  );
}

function EditorShell({
  themeId,
  tenant,
  data,
  storeInfo,
}: {
  themeId: string;
  tenant: { name: string; slug: string };
  data: HomeData;
  storeInfo: StoreInfo;
}) {
  const store = useEditorStore();
  const name = useEditor((s) => s.name);
  const setName = useEditor((s) => s.setName);
  const device = useEditor((s) => s.device);
  const setDevice = useEditor((s) => s.setDevice);
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const isDirty = useEditor(selectIsDirty);
  const hasUnpublished = useEditor(selectHasUnpublished);
  const isLive = useEditor((s) => s.isLive);

  const [busy, setBusy] = useState<Busy>(null);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  async function save(publish: boolean) {
    const { doc, name: currentName } = store.getState();
    setBusy(publish ? "publishing" : "saving");
    const payload = { themeId, document: doc, name: currentName };
    const result = await (publish ? publishThemeAction(payload) : saveThemeDraftAction(payload)).catch(() => undefined);
    setBusy(null);

    if (!result?.data) {
      toast.error(publish ? "Couldn't publish" : "Couldn't save", {
        description: result?.serverError ?? "Check your connection and try again.",
        action: { label: "Try again", onClick: () => void save(publish) },
      });
      return;
    }
    store.getState().markSaved(doc, currentName, result.data.document, publish);
    if (publish) {
      toast.success(`${currentName} is live`, {
        action: { label: "View store", onClick: () => window.open(THEME_ROUTES.storefront(tenant.slug), "_blank") },
      });
    } else {
      toast.success("Draft saved");
    }
  }

  // Shortcuts: undo/redo (outside text fields), save, deselect.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      if (mod && key === "s") {
        event.preventDefault();
        if (!busy && selectIsDirty(store.getState())) void save(false);
      } else if (mod && key === "z" && !isTypingTarget(event.target)) {
        event.preventDefault();
        if (event.shiftKey) store.getState().redo();
        else store.getState().undo();
      } else if (mod && key === "y" && !isTypingTarget(event.target)) {
        event.preventDefault();
        store.getState().redo();
      } else if (key === "escape" && !isTypingTarget(event.target)) {
        store.getState().select(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragStart(event: DragStartEvent) {
    setActiveDrag((event.active.data.current as DragData) ?? null);
  }

  function onDragMove(event: DragMoveEvent) {
    const active = event.active.data.current as DragData | undefined;
    const overCanvas = (event.over?.data.current as DropData | undefined)?.kind?.startsWith("canvas");
    if (active?.kind === "block" || !overCanvas) {
      setDropIndex(null);
      return;
    }
    const index = sectionInsertIndex(event, store.getState().doc.sections.length);
    // Hide the indicator where a move would be a no-op (directly above/below itself).
    if (active?.kind === "section") {
      const from = store.getState().doc.sections.findIndex((s) => s.id === active.sectionId);
      if (index === from || index === from + 1) {
        setDropIndex(null);
        return;
      }
    }
    setDropIndex(index);
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    setDropIndex(null);
    const active = event.active.data.current as DragData | undefined;
    const over = event.over?.data.current as DropData | undefined;
    if (!active || !over) return;
    const state = store.getState();

    if (active.kind === "block") {
      if (over.kind === "block" && over.sectionId === active.sectionId) {
        state.moveBlock(active.sectionId, active.index, over.index);
      }
      return;
    }

    const index = sectionInsertIndex(event, state.doc.sections.length);
    if (index === null) return;

    if (active.kind === "palette") {
      state.addSection(active.sectionType, index);
      return;
    }

    const from = state.doc.sections.findIndex((s) => s.id === active.sectionId);
    if (over.kind === "section") {
      state.moveSection(from, over.index);
    } else {
      state.moveSection(from, index > from ? index - 1 : index);
    }
    state.select({ kind: "section", sectionId: active.sectionId });
  }


  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActiveDrag(null);
        setDropIndex(null);
      }}
    >
      <div className="flex h-svh flex-col bg-background">
        <header className="grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b px-3">
          <div className="flex min-w-0 items-center gap-2">
            <HintTooltip label="Back to themes">
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="text-muted-foreground"
              >
                <Link
                  href={THEME_ROUTES.list}
                  aria-label="Back to themes"
                  onClick={(event) => {
                    if (isDirty && !window.confirm("You have unsaved changes. Leave without saving?")) event.preventDefault();
                  }}
                >
                  <ArrowLeft />
                </Link>
              </Button>
            </HintTooltip>
            <Separator orientation="vertical" className="h-5!" />
            <input
              aria-label="Theme name"
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              className="field-sizing-content max-w-56 min-w-12 truncate rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-semibold transition-colors hover:border-input focus:border-ring focus:ring-3 focus:ring-ring/30 focus:outline-none"
            />
            <SaveStatus busy={busy} isDirty={isDirty} isLive={isLive} hasUnpublished={hasUnpublished} />
          </div>

          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            spacing={0}
            value={device}
            onValueChange={(value) => value && setDevice(value as Device)}
            aria-label="Preview device"
          >
            {DEVICES.map(({ id, label, icon: Icon }) => (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value={id} aria-label={`${label} preview`} className="px-2.5">
                    <Icon />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
              </Tooltip>
            ))}
          </ToggleGroup>

          <div className="flex items-center justify-end gap-1.5">
            <HintTooltip label="Undo" keys={[MOD, "Z"]}>
              <Button variant="ghost" size="icon" aria-label="Undo" disabled={!canUndo} onClick={undo} className="text-muted-foreground">
                <Undo2 />
              </Button>
            </HintTooltip>
            <HintTooltip label="Redo" keys={[MOD, "⇧", "Z"]}>
              <Button variant="ghost" size="icon" aria-label="Redo" disabled={!canRedo} onClick={redo} className="text-muted-foreground">
                <Redo2 />
              </Button>
            </HintTooltip>
            <Separator orientation="vertical" className="mx-1 h-5!" />
            <HintTooltip label="Preview the last saved version">
              <Button variant="ghost" asChild>
                <Link href={THEME_ROUTES.preview(themeId)} target="_blank">
                  <Eye /> Preview
                </Link>
              </Button>
            </HintTooltip>
            <HintTooltip label="Save draft" keys={[MOD, "S"]}>
              <Button variant="outline" disabled={Boolean(busy) || !isDirty} onClick={() => save(false)}>
                Save
              </Button>
            </HintTooltip>
            <Button disabled={Boolean(busy) || (!isDirty && !hasUnpublished && isLive)} onClick={() => setConfirmPublish(true)}>
              {busy === "publishing" && <Spinner />}
              Publish
            </Button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <LeftPanel />
          <Canvas data={data} store={storeInfo} dropIndex={dropIndex} />
          <SettingsPanel />
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDrag && (
          <div className="pointer-events-none inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium shadow-lg">
            {activeDrag.kind !== "block" && (
              <SectionIcon type={activeDrag.sectionType} className="size-4 text-muted-foreground" />
            )}
            {activeDrag.label}
          </div>
        )}
      </DragOverlay>

      <AlertDialog open={confirmPublish} onOpenChange={setConfirmPublish}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish “{name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {isLive
                ? `Your changes will be visible on the ${tenant.name} storefront right away.`
                : `“${name}” will replace your current theme on the ${tenant.name} storefront right away.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => save(true)}>Publish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DndContext>
  );
}

export function ThemeEditor({
  theme,
  tenant,
  isLive,
  data,
  storeInfo,
}: {
  theme: Theme;
  tenant: { name: string; slug: string };
  isLive: boolean;
  /** Catalog data the home sections render (demo catalog in mock mode). */
  data: HomeData;
  storeInfo: StoreInfo;
}) {
  const [store] = useState(() =>
    createEditorStore({ doc: theme.draft, name: theme.name, published: theme.published, isLive }),
  );

  return (
    <EditorStoreContext.Provider value={store}>
      <EditorShell themeId={theme.id} tenant={tenant} data={data} storeInfo={storeInfo} />
    </EditorStoreContext.Provider>
  );
}
