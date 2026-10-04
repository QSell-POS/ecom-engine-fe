"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Boxes, PackagePlus, Scale } from "lucide-react";
import { DataGrid, DetailFields, DetailSection, DetailStats, type RowAction } from "@/components/data-grid";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { StatusLabel } from "@/components/common/StatusLabel";
import { inventoryColumns, stockStates } from "@/lib/api/inventory/grid";
import { alertLevel, availableStock, itemName, stockState, type InventoryItem } from "@/lib/api/inventory/types";
import { clientSource } from "@/lib/data-grid";
import { StockDialog, type StockMode } from "./StockDialog";

function InventoryDetail({ item }: { item: InventoryItem }) {
  const state = stockStates[stockState(item)];
  return (
    <div className="max-w-2xl space-y-10">
      <DetailStats
        items={[
          { label: "Available", value: availableStock(item), hint: "Sellable right now" },
          { label: "Reserved", value: item.quantityReserved, hint: "Held by open orders" },
          { label: "On hand", value: item.quantityOnHand, hint: "Physically in stock" },
          { label: "Stock", value: <StatusLabel tone={state.tone}>{state.label}</StatusLabel> },
        ]}
      />
      <DetailSection
        title="Product"
        action={
          <span className="flex gap-3 text-sm">
            <Link href={`/inventory/${item.productId}`} className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              Stock history
            </Link>
            <Link href={`/products/${item.productId}/edit`} className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              Edit product
            </Link>
          </span>
        }
      >
        <DetailFields
          items={[
            ["Name", itemName(item)],
            ["SKU", item.product?.sku && <span className="font-mono text-[13px]">{item.product.sku}</span>],
            ["Low-stock alert at", alertLevel(item)],
          ]}
        />
      </DetailSection>
    </div>
  );
}

export function InventoryGrid({ items }: { items: InventoryItem[] }) {
  const router = useRouter();
  const [active, setActive] = useState<{ item: InventoryItem; mode: StockMode } | null>(null);
  const source = useMemo(() => clientSource(items), [items]);

  const rowActions: RowAction<InventoryItem>[] = [
    { id: "receive", label: "Receive stock", icon: PackagePlus, swipe: "leading", run: (item) => setActive({ item, mode: "receive" }) },
    { id: "adjust", label: "Adjust stock", icon: Scale, run: (item) => setActive({ item, mode: "adjust" }) },
  ];

  return (
    <>
      <DataGrid<InventoryItem>
        id="inventory"
        noun={["product", "products"]}
        columns={inventoryColumns}
        source={source}
        getRowId={(item) => item.productId}
        workspace={{ icon: Boxes, render: (item) => <InventoryDetail item={item} /> }}
        rowActions={rowActions}
        onMutated={() => router.refresh()}
        defaultQuery={{ sort: [{ id: "available", desc: false }] }}
        cells={{
          productName: (item) => <span className="font-medium">{itemName(item)}</span>,
          state: (item) => {
            const state = stockStates[stockState(item)];
            return <StatusLabel tone={state.tone}>{state.label}</StatusLabel>;
          },
        }}
        emptyState={
          <Empty className="border py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Boxes />
              </EmptyMedia>
              <EmptyTitle>Nothing tracked yet</EmptyTitle>
              <EmptyDescription>Receive stock against a product and it starts showing up here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        }
      />
      {active && (
        <StockDialog
          key={`${active.item.productId}-${active.mode}`}
          item={active.item}
          mode={active.mode}
          open
          onOpenChange={(open) => {
            if (!open) setActive(null);
          }}
        />
      )}
    </>
  );
}
