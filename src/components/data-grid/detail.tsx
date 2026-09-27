import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Building blocks for workspace record bodies. Whitespace and hairlines, not
// cards: the record is the page, not a box on it.

export function DetailSection({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

const EMPTY = <span className="text-muted-foreground/70">—</span>;

/** Label/value rows. Empty values render as a quiet dash. */
export function DetailFields({
  items,
  labelWidth = "9rem",
  className,
}: {
  items: [label: string, value: ReactNode][];
  labelWidth?: string;
  className?: string;
}) {
  return (
    <dl className={cn("divide-y border-y text-sm", className)}>
      {items.map(([label, value]) => (
        <div key={label} className="grid gap-4 py-2.5" style={{ gridTemplateColumns: `minmax(0, ${labelWidth}) minmax(0, 1fr)` }}>
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="min-w-0 wrap-break-word">{value === null || value === undefined || value === "" ? EMPTY : value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Headline numbers across the top of a record. */
export function DetailStats({ items }: { items: { label: string; value: ReactNode; hint?: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border bg-border xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="bg-background px-4 py-3.5">
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className="mt-1 text-xl font-semibold tracking-tight tabular-nums">{item.value}</dd>
          {item.hint && <dd className="mt-0.5 text-xs text-muted-foreground">{item.hint}</dd>}
        </div>
      ))}
    </dl>
  );
}
