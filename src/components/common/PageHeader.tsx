import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// One consistent answer to "where am I / what can I do here": title,
// one line of context, and the page's actions (primary action last).
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    // Hidden while the page shows a master–detail workspace, which has its own header.
    <div className={cn("mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 group-has-data-workspace/page:hidden", className)}>
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="space-y-0.5">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
