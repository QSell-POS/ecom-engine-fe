"use client";

import { createContext, useContext } from "react";
import type { Ref } from "@/lib/storefront/types";

/** The store's own categories and brands, for settings whose options aren't fixed (product sources). */
export type EditorCatalog = { categories: Ref[]; brands: Ref[] };

export const EditorCatalogContext = createContext<EditorCatalog>({ categories: [], brands: [] });

export function useEditorCatalog() {
  return useContext(EditorCatalogContext);
}
