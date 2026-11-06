import type { Metadata } from "next";
import { CreateCustomerButton } from "@/components/customer/CustomerFormDialog";
import { CustomersGrid } from "@/components/customer/CustomersGrid";
import { PageHeader } from "@/components/common/PageHeader";
import { getCustomers } from "@/lib/api/customer/service";
import { loadAllPages } from "@/lib/api/shared/types";
import { denyUnless } from "@/lib/api/rbac/access";
import { Can } from "@/components/auth/PermissionsProvider";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage() {
  const denied = await denyUnless("customers:view");
  if (denied) return denied;

  const customers = await loadAllPages(getCustomers);

  return (
    <>
      <PageHeader title="Customers" description="Everyone who shops with you, and what they have spent." actions={<Can I="customers:create"><CreateCustomerButton /></Can>} />
      <CustomersGrid customers={customers} />
    </>
  );
}
