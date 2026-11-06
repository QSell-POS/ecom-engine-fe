import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { SeedCatalogPanel } from "@/components/seed/SeedCatalogPanel";
import { getSeedStatus } from "@/lib/api/seed/service";
import { denyUnless } from "@/lib/api/rbac/access";

export const metadata: Metadata = { title: "Demo data" };

export default async function DemoDataPage() {
  const denied = await denyUnless("owner");
  if (denied) return denied;

  const status = await getSeedStatus();

  return (
    <>
      <PageHeader title="Demo data" description="Fill this store with a demo catalog, or remove what's been seeded." />
      <SeedCatalogPanel status={status} />
    </>
  );
}
