"use client";

import { useState } from "react";

/**
 * Open/closed state for the grid's on-demand surfaces (filter popover,
 * command menu, shortcuts, import). Lives in DataGrid so any entry point
 * (toolbar, chips, command menu, keyboard) can open any surface.
 */
export function useGridUi() {
  const [filter, setFilter] = useState<{ open: boolean; field: string | null }>({ open: false, field: null });
  const [commandOpen, setCommandOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  return {
    filter,
    /** Open the filter popover, optionally straight to one field's editor. */
    openFilter: (field: string | null = null) => setFilter({ open: true, field }),
    setFilterField: (field: string | null) => setFilter((f) => ({ ...f, field })),
    closeFilter: () => setFilter({ open: false, field: null }),
    commandOpen,
    setCommandOpen,
    shortcutsOpen,
    setShortcutsOpen,
    importOpen,
    setImportOpen,
  };
}

export type GridUi = ReturnType<typeof useGridUi>;
