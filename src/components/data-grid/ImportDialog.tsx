"use client";

import { useRef, useState } from "react";
import { FileUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { csvToRecords } from "@/lib/data-grid";
import { cn } from "@/lib/utils";
import type { DataGridController } from "./use-data-grid";

type Parsed = { fileName: string; headers: string[]; records: Record<string, string>[] };

export function ImportDialog<T>({
  grid,
  open,
  onOpenChange,
}: {
  grid: DataGridController<T>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { onImport, importColumns, noun } = grid.props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  function reset() {
    setParsed(null);
    setError(null);
    setBusy(false);
  }

  async function readFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Choose a .csv file.");
      return;
    }
    const { headers, records } = csvToRecords(await file.text());
    if (records.length === 0) {
      setError("That file has no rows to import.");
      return;
    }
    setParsed({ fileName: file.name, headers, records });
  }

  async function submit() {
    if (!parsed || !onImport) return;
    setBusy(true);
    const outcome = await grid.mutate([], undefined, () => onImport(parsed.records));
    setBusy(false);
    if (outcome) {
      onOpenChange(false);
      reset();
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import {noun[1]}</DialogTitle>
          <DialogDescription>
            Upload a CSV file with a header row.
            {importColumns && (
              <>
                {" "}
                Expected columns: <span className="font-medium text-foreground">{importColumns.join(", ")}</span>.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {!parsed ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void readFile(e.dataTransfer.files[0]);
            }}
            className={cn(
              "flex h-36 flex-col items-center justify-center gap-2 rounded-md border border-dashed text-sm transition-colors",
              dragging ? "border-selection bg-selection/5" : "hover:bg-muted/50",
            )}
          >
            <FileUp className="size-5 text-muted-foreground" />
            <span className="font-medium">Drop a CSV file or click to browse</span>
            <input ref={inputRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => void readFile(e.target.files?.[0])} />
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">{parsed.fileName}</span>
              <span className="text-muted-foreground">
                {" "}
                · {parsed.records.length} {parsed.records.length === 1 ? "row" : "rows"}
              </span>
            </p>
            <div className="max-h-56 overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    {parsed.headers.map((header) => (
                      <th key={header} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.records.slice(0, 5).map((record, index) => (
                    <tr key={index} className="border-t">
                      {Object.values(record).map((value, i) => (
                        <td key={i} className="max-w-48 truncate px-3 py-2 whitespace-nowrap">
                          {value || <span className="text-muted-foreground">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsed.records.length > 5 && <p className="text-xs text-muted-foreground">Showing the first 5 rows.</p>}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          {parsed && (
            <Button variant="ghost" className="mr-auto" disabled={busy} onClick={reset}>
              Choose another file
            </Button>
          )}
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!parsed || busy} onClick={submit}>
            {busy && <Spinner />}
            {parsed ? `Import ${parsed.records.length} ${parsed.records.length === 1 ? noun[0] : noun[1]}` : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
