import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { InventoryGrid } from "@/components/inventory/InventoryGrid";
import { getInventory } from "@/lib/api/inventory/service";
import { loadAllPages } from "@/lib/api/shared/types";
import { denyUnless } from "@/lib/api/rbac/access";

export const metadata: Metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const denied = await denyUnless("inventory:view");
  if (denied) return denied;

  const items = await loadAllPages(getInventory);

  return (
    <>
      <PageHeader title="Inventory" description="What is sellable, what is held by open orders, and what needs reordering." />
      <InventoryGrid items={items} />
    </>
  );
}
