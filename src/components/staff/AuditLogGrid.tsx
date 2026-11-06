"use client";

import { useMemo } from "react";
import { History } from "lucide-react";
import { DataGrid } from "@/components/data-grid";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { auditColumns, auditDetails } from "@/lib/api/rbac/grid";
import type { AuditEntry } from "@/lib/api/rbac/types";
import { clientSource } from "@/lib/data-grid";

export function AuditLogGrid({ entries }: { entries: AuditEntry[] }) {
  const source = useMemo(() => clientSource(entries), [entries]);
  return (
    <DataGrid<AuditEntry>
      id="audit-log"
      noun={["entry", "entries"]}
      columns={auditColumns}
      source={source}
      getRowId={(entry) => entry.id}
      defaultQuery={{ sort: [{ id: "createdAt", desc: true }] }}
      cells={{
        details: (entry) => <span className="text-muted-foreground">{auditDetails(entry) || "—"}</span>,
      }}
      emptyState={
        <Empty className="border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <History />
            </EmptyMedia>
            <EmptyTitle>Nothing recorded yet</EmptyTitle>
            <EmptyDescription>Adding staff, changing roles and permissions, and password changes appear here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      }
    />
  );
}
