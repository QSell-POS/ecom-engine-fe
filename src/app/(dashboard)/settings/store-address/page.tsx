import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { StoreAddressForm } from "@/components/settings/StoreAddressForm";
import { getStoreDomain } from "@/lib/api/store-domain";
import { denyUnless } from "@/lib/api/rbac/access";

export const metadata: Metadata = { title: "Store address" };

export default async function StoreAddressPage() {
  const denied = await denyUnless("settings:view");
  if (denied) return denied;

  const domain = await getStoreDomain();

  return (
    <>
      <PageHeader title="Store address" description="The address customers use to reach your storefront." />
      <StoreAddressForm domain={domain} />
    </>
  );
}
