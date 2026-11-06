import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { PageHeader, SectionHeader } from "@/components/common/PageHeader";
import { StatusLabel } from "@/components/common/StatusLabel";
import { DetailStats } from "@/components/data-grid";
import { InventoryTransactions } from "@/components/inventory/InventoryTransactions";
import { getProductBatches, getProductInventory, getProductTransactions } from "@/lib/api/inventory/service";
import { availableStock, itemName, stockState } from "@/lib/api/inventory/types";
import { stockStates } from "@/lib/api/inventory/grid";
import { formatMoney } from "@/lib/constants/money";
import { toAmount } from "@/lib/api/shared/types";
import { denyUnless } from "@/lib/api/rbac/access";

export const metadata: Metadata = { title: "Stock history" };

const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export default async function ProductInventoryPage({ params }: { params: Promise<{ productId: string }> }) {
  const denied = await denyUnless("inventory:view");
  if (denied) return denied;

  const { productId } = await params;

  let item;
  try {
    item = await getProductInventory(productId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  // Batches and the log are independent reads, so fetch them together.
  const [batches, transactions] = await Promise.all([
    getProductBatches(productId, { limit: 100 }),
    getProductTransactions(productId, { limit: 100 }),
  ]);

  const state = stockStates[stockState(item)];

  return (
    <>
      <PageHeader title={itemName(item)} description="Every stock movement for this product, newest first." />

      <div className="space-y-12">
        <DetailStats
          items={[
            { label: "Available", value: availableStock(item) },
            { label: "Reserved", value: item.quantityReserved },
            { label: "On hand", value: item.quantityOnHand },
            { label: "Stock", value: <StatusLabel tone={state.tone}>{state.label}</StatusLabel> },
          ]}
        />

        <section>
          <SectionHeader title="Batches" description="Each receipt of stock, oldest first — the order it sells in." />
          {batches.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No batches recorded.</p>
          ) : (
            <ul className="divide-y border-y text-sm">
              {batches.data.map((batch) => (
                <li key={batch.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-2.5">
                  <span className="font-medium">{batch.batchNumber ?? `Batch ${batch.id.slice(0, 8)}`}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {batch.remaining} of {batch.quantity} left
                    {batch.costPrice && ` · ${formatMoney(toAmount(batch.costPrice))} cost`}
                    {batch.createdAt && ` · received ${date.format(new Date(batch.createdAt))}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <SectionHeader title="Movements" />
          <InventoryTransactions transactions={transactions.data} />
        </section>
      </div>
    </>
  );
}
