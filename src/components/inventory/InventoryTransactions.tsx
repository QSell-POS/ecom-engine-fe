"use client";

import { useMemo } from "react";
import { History } from "lucide-react";
import { DataGrid } from "@/components/data-grid";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { StatusLabel } from "@/components/common/StatusLabel";
import { inventoryTransactionColumns, transactionTypes } from "@/lib/api/inventory/grid";
import type { InventoryTransaction } from "@/lib/api/inventory/types";
import { clientSource } from "@/lib/data-grid";

export function InventoryTransactions({ transactions }: { transactions: InventoryTransaction[] }) {
  const source = useMemo(() => clientSource(transactions), [transactions]);

  return (
    <DataGrid<InventoryTransaction>
      id="inventory-transactions"
      noun={["movement", "movements"]}
      columns={inventoryTransactionColumns}
      source={source}
      getRowId={(transaction) => transaction.id}
      defaultQuery={{ sort: [{ id: "createdAt", desc: true }] }}
      cells={{
        type: (transaction) => {
          const type = transactionTypes[transaction.type];
          return type ? <StatusLabel tone={type.tone}>{type.label}</StatusLabel> : <span>{transaction.type}</span>;
        },
      }}
      emptyState={
        <Empty className="border py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <History />
            </EmptyMedia>
            <EmptyTitle>No movements yet</EmptyTitle>
            <EmptyDescription>Receiving, reserving and fulfilling stock all leave a line here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      }
    />
  );
}
