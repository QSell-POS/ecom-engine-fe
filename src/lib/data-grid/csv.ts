import { formatValue, getValue } from "./columns";
import type { GridColumn } from "./types";

function escape(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

/**
 * CSV of the given columns. Numbers/dates are written raw (machine-readable)
 * so the file round-trips into spreadsheets; everything else uses the
 * display format.
 */
export function toCsv<T>(rows: T[], columns: GridColumn<T>[]): string {
  const header = columns.map((c) => escape(c.header)).join(",");
  const lines = rows.map((row) =>
    columns
      .map((column) => {
        const raw = getValue(column, row);
        const machine = ["number", "currency", "percent", "date", "datetime"].includes(column.type ?? "");
        const text = machine ? (raw === null || raw === undefined ? "" : String(raw)) : formatValue(column, row);
        return escape(text);
      })
      .join(","),
  );
  return [header, ...lines].join("\r\n");
}

/** RFC 4180-ish parser: quoted fields, escaped quotes, CRLF/LF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/** Parses CSV into records keyed by normalized header ("Website URL" → "websiteurl"). */
export function csvToRecords(text: string): { headers: string[]; records: Record<string, string>[] } {
  const [headerRow = [], ...body] = parseCsv(text.replace(/^﻿/, ""));
  const headers = headerRow.map((h) => h.trim());
  const keys = headers.map(normalizeHeader);
  const records = body.map((cells) => Object.fromEntries(keys.map((key, i) => [key, (cells[i] ?? "").trim()])));
  return { headers, records };
}

export function normalizeHeader(header: string) {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}
