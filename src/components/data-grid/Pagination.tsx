"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DataGridController } from "./use-data-grid";

const number = new Intl.NumberFormat("en-US");

/** 1 … 4 5 6 … 12: first, last, and the pages around the current one. */
function pageWindow(page: number, count: number): (number | "gap")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const pages = new Set([1, count, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (page >= count - 2) [count - 3, count - 2, count - 1].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= count).sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? (["gap", p] as const) : [p]));
}

/** "Showing 1–25 of 180 products" and plain numbered pages. */
export function Pagination<T>({ grid, compact, className }: { grid: DataGridController<T>; compact: boolean; className?: string }) {
  const { page, pageSize } = grid.query;
  const { total } = grid;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const noun = total === 1 ? grid.props.noun[0] : grid.props.noun[1];
  if (grid.initialLoading) return <div className={cn("h-12", className)} />;
  if (total === 0) return null;

  const summary =
    pageCount === 1 ? (
      <span>
        {total === 1 ? "1" : `All ${number.format(total)}`} {noun}
      </span>
    ) : (
      <span>
        Showing{" "}
        <span className="font-medium text-foreground tabular-nums">
          {number.format(from)}–{number.format(to)}
        </span>{" "}
        of <span className="font-medium text-foreground tabular-nums">{number.format(total)}</span> {noun}
      </span>
    );

  return (
    <nav aria-label="Pages" className={cn("flex min-h-12 items-center justify-between gap-4 pt-3 text-sm text-muted-foreground", className)}>
      {compact && pageCount > 1 ? (
        <>
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => grid.setPage(page - 1)} aria-label="Previous page">
            <ChevronLeft /> Previous
          </Button>
          <span className="tabular-nums">
            Page <span className="font-medium text-foreground">{page}</span> of {pageCount}
          </span>
          <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => grid.setPage(page + 1)} aria-label="Next page">
            Next <ChevronRight />
          </Button>
        </>
      ) : (
        <>
          {summary}
          {pageCount > 1 && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => grid.setPage(page - 1)} aria-label="Previous page">
                <ChevronLeft /> Previous
              </Button>
              {pageWindow(page, pageCount).map((item, i) =>
                item === "gap" ? (
                  <span key={`gap-${i}`} aria-hidden className="w-6 text-center">
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={item === page ? "outline" : "ghost"}
                    size="icon-sm"
                    aria-label={`Page ${item}`}
                    aria-current={item === page ? "page" : undefined}
                    onClick={() => grid.setPage(item)}
                    className={cn("tabular-nums", item === page ? "font-semibold text-foreground" : "text-muted-foreground")}
                  >
                    {item}
                  </Button>
                ),
              )}
              <Button variant="ghost" size="sm" disabled={page >= pageCount} onClick={() => grid.setPage(page + 1)} aria-label="Next page">
                Next <ChevronRight />
              </Button>
            </div>
          )}
        </>
      )}
    </nav>
  );
}
