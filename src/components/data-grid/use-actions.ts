"use client";

import { useConfirm } from "./ConfirmDialog";
import type { BulkAction, RowAction } from "./types";
import type { DataGridController } from "./use-data-grid";

export function useGridActions<T>(grid: DataGridController<T>) {
  const confirm = useConfirm();

  async function runRowAction(action: RowAction<T>, row: T) {
    if (action.confirm) {
      const spec = action.confirm(row);
      const ok = await confirm({ ...spec, destructive: action.tone === "destructive" });
      if (!ok) return false;
    }
    return grid.mutate([row], action.optimistic, () => action.run(row));
  }

  async function runBulkAction(action: BulkAction<T>) {
    const resolved = grid.selection.resolve();
    const count = grid.selection.count;
    if (action.confirm) {
      const ok = await confirm({ ...action.confirm(count), destructive: action.tone === "destructive" });
      if (!ok) return false;
    }
    const done = await grid.mutate(resolved.rows, action.optimistic, () => action.run(resolved));
    if (done) grid.selection.clear();
    return done;
  }

  return { runRowAction, runBulkAction };
}
