import type { Metadata } from "next";
import { CreateCustomerButton } from "@/components/customer/CustomerFormDialog";
import { CustomersGrid } from "@/components/customer/CustomersGrid";
import { PageHeader } from "@/components/common/PageHeader";
import { getCustomers } from "@/lib/api/customer/service";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage() {
  const { data: customers } = await getCustomers({ limit: 500 });

  return (
    <>
      <PageHeader title="Customers" description="Everyone who shops with you, and what they have spent." actions={<CreateCustomerButton />} />
      <CustomersGrid customers={customers} />
    </>
  );
}
