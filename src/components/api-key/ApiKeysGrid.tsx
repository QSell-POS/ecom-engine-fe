"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Trash2 } from "lucide-react";
import { DataGrid, type ActionOutcome, type BulkAction, type RowAction } from "@/components/data-grid";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { deleteApiKeyAction } from "@/lib/api/api-key/action";
import { apiKeyColumns } from "@/lib/api/api-key/grid";
import type { ApiKey } from "@/lib/api/api-key/types";
import { clientSource } from "@/lib/data-grid";
import { CreateApiKeyButton } from "./ApiKeyDialog";

type SafeResult = { data?: unknown; serverError?: string } | undefined;

async function settle(results: Promise<SafeResult>[], message: string): Promise<ActionOutcome> {
  const settled = await Promise.all(results);
  const failed = settled.filter((result) => !result?.data);
  if (failed.length === 0) return { ok: true, message };
  return { ok: false, error: failed[0]?.serverError ?? `${failed.length} of ${settled.length} failed. Please try again.` };
}

export function ApiKeysGrid({ keys }: { keys: ApiKey[] }) {
  const router = useRouter();
  const source = useMemo(() => clientSource(keys), [keys]);

  const rowActions: RowAction<ApiKey>[] = [
    {
      id: "revoke", permission: "api_keys:manage",
      label: "Revoke",
      icon: Trash2,
      tone: "destructive",
      swipe: "trailing",
      confirm: (key) => ({
        title: `Revoke ${key.name}?`,
        description: "Any storefront using this key stops working immediately. Issue a new key first if you need no downtime.",
        confirmLabel: "Revoke key",
      }),
      optimistic: "remove",
      run: (key) => settle([deleteApiKeyAction({ id: key.id })], `${key.name} revoked`),
    },
  ];

  const bulkActions: BulkAction<ApiKey>[] = [
    {
      id: "revoke", permission: "api_keys:manage",
      label: "Revoke",
      icon: Trash2,
      tone: "destructive",
      confirm: (count) => ({ title: `Revoke ${count} ${count === 1 ? "key" : "keys"}?`, description: "Storefronts using them stop working.", confirmLabel: "Revoke" }),
      optimistic: "remove",
      run: ({ rows }) => settle(rows.map((key) => deleteApiKeyAction({ id: key.id })), `${rows.length} keys revoked`),
    },
  ];

  return (
    <DataGrid<ApiKey>
      id="api-keys"
      noun={["key", "keys"]}
      columns={apiKeyColumns}
      source={source}
      getRowId={(key) => key.id}
      rowActions={rowActions}
      bulkActions={bulkActions}
      onMutated={() => router.refresh()}
      cells={{
        name: (key) => <span className="font-medium">{key.name}</span>,
        keyPrefix: (key) => <span className="font-mono text-[13px] text-muted-foreground">{key.keyPrefix}…</span>,
      }}
      emptyState={
        <Empty className="border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <KeyRound />
            </EmptyMedia>
            <EmptyTitle>No API keys</EmptyTitle>
            <EmptyDescription>A storefront needs a key to read your catalog.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CreateApiKeyButton />
          </EmptyContent>
        </Empty>
      }
    />
  );
}
