import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONES = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  info: "bg-selection",
  neutral: "bg-muted-foreground/40",
} as const;

export type StatusTone = keyof typeof TONES;

/** Quiet status: a small dot plus a word. Color only carries meaning. */
export function StatusLabel({ tone, children, className }: { tone: StatusTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm whitespace-nowrap text-foreground/80", className)}>
      <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", TONES[tone])} />
      {children}
    </span>
  );
}
