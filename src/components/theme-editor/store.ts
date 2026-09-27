"use client";

import { createContext, useContext } from "react";
import { createStore, type StoreApi } from "zustand/vanilla";
import { useStore } from "zustand";
import { arrayMove } from "@dnd-kit/sortable";
import { cloneSection, createBlock, createSection, MAX_SECTIONS, newId } from "@/lib/theme-engine/document";
import { getSectionSchema } from "@/lib/theme-engine/schema";
import type { Device, Selection, SettingValue, ThemeDocument } from "@/lib/theme-engine/types";

const HISTORY_LIMIT = 100;
const COALESCE_MS = 1000;

export type EditorState = {
  doc: ThemeDocument;
  name: string;
  savedSnapshot: string;
  publishedSnapshot: string | null;
  isLive: boolean;
  selection: Selection | null;
  device: Device;
  past: ThemeDocument[];
  future: ThemeDocument[];
  lastEdit: { key: string; at: number } | null;
  /** Set when a section/block is inserted so the canvas can reveal it and the settings panel can focus it. */
  lastInserted: { sectionId: string; blockId?: string; at: number } | null;

  select: (selection: Selection | null) => void;
  setDevice: (device: Device) => void;
  setName: (name: string) => void;
  undo: () => void;
  redo: () => void;

  addSection: (type: string, index: number) => void;
  moveSection: (from: number, to: number) => void;
  removeSection: (sectionId: string) => void;
  duplicateSection: (sectionId: string) => void;
  updateSectionSetting: (sectionId: string, key: string, value: SettingValue) => void;

  addBlock: (sectionId: string, blockType: string) => void;
  removeBlock: (sectionId: string, blockId: string) => void;
  moveBlock: (sectionId: string, from: number, to: number) => void;
  duplicateBlock: (sectionId: string, blockId: string) => void;
  updateBlockSetting: (sectionId: string, blockId: string, key: string, value: SettingValue) => void;

  updateThemeSetting: (key: string, value: SettingValue) => void;

  /** Called after a successful save/publish with the document that was sent and the server's sanitised copy. */
  markSaved: (sent: ThemeDocument, name: string, fromServer: ThemeDocument, published: boolean) => void;
};

const snapshot = (doc: ThemeDocument, name: string) => JSON.stringify({ doc, name });

export const selectIsDirty = (s: EditorState) => snapshot(s.doc, s.name) !== s.savedSnapshot;
export const selectHasUnpublished = (s: EditorState) => JSON.stringify(s.doc) !== s.publishedSnapshot;

function validSelection(doc: ThemeDocument, selection: Selection | null): Selection | null {
  if (!selection || selection.kind === "theme") return selection;
  const section = doc.sections.find((s) => s.id === selection.sectionId);
  if (!section) return null;
  if (selection.kind === "block" && !section.blocks.some((b) => b.id === selection.blockId)) {
    return { kind: "section", sectionId: section.id };
  }
  return selection;
}

export function createEditorStore(init: {
  doc: ThemeDocument;
  name: string;
  published: ThemeDocument | null;
  isLive: boolean;
}) {
  return createStore<EditorState>()((set, get) => {
    // Applies an undoable mutation. Consecutive edits to the same field within
    // COALESCE_MS share one history entry so typing doesn't flood undo.
    const commit = (mutate: (doc: ThemeDocument) => void, editKey?: string) =>
      set((state) => {
        const doc = structuredClone(state.doc);
        mutate(doc);
        const now = Date.now();
        const coalesce =
          editKey !== undefined && state.lastEdit?.key === editKey && now - state.lastEdit.at < COALESCE_MS;
        return {
          doc,
          past: coalesce ? state.past : [...state.past, state.doc].slice(-HISTORY_LIMIT),
          future: [],
          lastEdit: editKey ? { key: editKey, at: now } : null,
          selection: validSelection(doc, state.selection),
        };
      });

    const findSection = (doc: ThemeDocument, sectionId: string) => doc.sections.find((s) => s.id === sectionId);

    return {
      doc: init.doc,
      name: init.name,
      savedSnapshot: snapshot(init.doc, init.name),
      publishedSnapshot: init.published ? JSON.stringify(init.published) : null,
      isLive: init.isLive,
      selection: null,
      device: "desktop",
      past: [],
      future: [],
      lastEdit: null,
      lastInserted: null,

      select: (selection) => set({ selection }),
      setDevice: (device) => set({ device }),
      setName: (name) => set({ name }),

      undo: () =>
        set((state) => {
          const previous = state.past.at(-1);
          if (!previous) return state;
          return {
            doc: previous,
            past: state.past.slice(0, -1),
            future: [state.doc, ...state.future],
            lastEdit: null,
            selection: validSelection(previous, state.selection),
          };
        }),
      redo: () =>
        set((state) => {
          const next = state.future[0];
          if (!next) return state;
          return {
            doc: next,
            past: [...state.past, state.doc],
            future: state.future.slice(1),
            lastEdit: null,
            selection: validSelection(next, state.selection),
          };
        }),

      addSection: (type, index) => {
        const schema = getSectionSchema(type);
        const { doc } = get();
        if (!schema || doc.sections.length >= MAX_SECTIONS) return;
        if (schema.singleton && doc.sections.some((s) => s.type === type)) return;
        const section = createSection(type);
        commit((d) => d.sections.splice(Math.max(0, Math.min(index, d.sections.length)), 0, section));
        set({
          selection: { kind: "section", sectionId: section.id },
          lastInserted: { sectionId: section.id, at: Date.now() },
        });
      },
      moveSection: (from, to) => {
        if (from === to || from < 0 || to < 0) return;
        commit((d) => {
          d.sections = arrayMove(d.sections, from, Math.min(to, d.sections.length - 1));
        });
      },
      removeSection: (sectionId) => commit((d) => {
        d.sections = d.sections.filter((s) => s.id !== sectionId);
      }),
      duplicateSection: (sectionId) => {
        const source = findSection(get().doc, sectionId);
        if (!source || getSectionSchema(source.type)?.singleton) return;
        const copy = cloneSection(source);
        commit((d) => {
          const index = d.sections.findIndex((s) => s.id === sectionId);
          d.sections.splice(index + 1, 0, copy);
        });
        set({
          selection: { kind: "section", sectionId: copy.id },
          lastInserted: { sectionId: copy.id, at: Date.now() },
        });
      },
      updateSectionSetting: (sectionId, key, value) =>
        commit((d) => {
          const section = findSection(d, sectionId);
          if (section) section.settings[key] = value;
        }, `s:${sectionId}:${key}`),

      addBlock: (sectionId, blockType) => {
        const section = findSection(get().doc, sectionId);
        const schema = section && getSectionSchema(section.type);
        if (!section || !schema) return;
        if (schema.maxBlocks !== undefined && section.blocks.length >= schema.maxBlocks) return;
        const block = createBlock(section.type, blockType);
        commit((d) => findSection(d, sectionId)?.blocks.push(block));
        set({
          selection: { kind: "block", sectionId, blockId: block.id },
          lastInserted: { sectionId, blockId: block.id, at: Date.now() },
        });
      },
      removeBlock: (sectionId, blockId) =>
        commit((d) => {
          const section = findSection(d, sectionId);
          if (section) section.blocks = section.blocks.filter((b) => b.id !== blockId);
        }),
      moveBlock: (sectionId, from, to) => {
        if (from === to || from < 0 || to < 0) return;
        commit((d) => {
          const section = findSection(d, sectionId);
          if (section) section.blocks = arrayMove(section.blocks, from, Math.min(to, section.blocks.length - 1));
        });
      },
      duplicateBlock: (sectionId, blockId) => {
        const section = findSection(get().doc, sectionId);
        const schema = section && getSectionSchema(section.type);
        const source = section?.blocks.find((b) => b.id === blockId);
        if (!section || !schema || !source) return;
        if (schema.maxBlocks !== undefined && section.blocks.length >= schema.maxBlocks) return;
        const copy = { ...structuredClone(source), id: newId("blk") };
        commit((d) => {
          const target = findSection(d, sectionId);
          if (!target) return;
          const index = target.blocks.findIndex((b) => b.id === blockId);
          target.blocks.splice(index + 1, 0, copy);
        });
        set({ selection: { kind: "block", sectionId, blockId: copy.id } });
      },
      updateBlockSetting: (sectionId, blockId, key, value) =>
        commit((d) => {
          const block = findSection(d, sectionId)?.blocks.find((b) => b.id === blockId);
          if (block) block.settings[key] = value;
        }, `b:${blockId}:${key}`),

      updateThemeSetting: (key, value) =>
        commit((d) => {
          d.settings[key] = value;
        }, `t:${key}`),

      markSaved: (sent, name, fromServer, published) =>
        set((state) => {
          // Adopt the server's sanitised copy only if nothing changed while saving.
          const doc = state.doc === sent ? fromServer : state.doc;
          return {
            doc,
            savedSnapshot: snapshot(fromServer, name),
            publishedSnapshot: published ? JSON.stringify(fromServer) : state.publishedSnapshot,
            isLive: published || state.isLive,
            selection: validSelection(doc, state.selection),
          };
        }),
    };
  });
}

export type EditorStore = StoreApi<EditorState>;

export const EditorStoreContext = createContext<EditorStore | null>(null);

export function useEditorStore() {
  const store = useContext(EditorStoreContext);
  if (!store) throw new Error("useEditorStore must be used inside <ThemeEditor>");
  return store;
}

export function useEditor<T>(selector: (state: EditorState) => T): T {
  return useStore(useEditorStore(), selector);
}
