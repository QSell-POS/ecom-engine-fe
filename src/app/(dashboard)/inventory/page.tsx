import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { InventoryGrid } from "@/components/inventory/InventoryGrid";
import { getInventory } from "@/lib/api/inventory/service";

export const metadata: Metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const { data: items } = await getInventory({ limit: 500 });

  return (
    <>
      <PageHeader title="Inventory" description="What is sellable, what is held by open orders, and what needs reordering." />
      <InventoryGrid items={items} />
    </>
  );
}
