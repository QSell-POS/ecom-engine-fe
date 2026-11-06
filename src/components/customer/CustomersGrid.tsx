"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, CircleSlash, ShieldBan, Trash2, Users } from "lucide-react";
import { DataGrid, type ActionOutcome, type BulkAction, type RowAction } from "@/components/data-grid";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { StatusLabel } from "@/components/common/StatusLabel";
import { deleteCustomerAction, updateCustomerStatusAction } from "@/lib/api/customer/action";
import { customerColumns, customerStatuses } from "@/lib/api/customer/grid";
import { customerName, type Customer, type CustomerStatus } from "@/lib/api/customer/types";
import { clientSource } from "@/lib/data-grid";
import { CustomerDetail } from "./CustomerDetail";
import { CreateCustomerButton } from "./CustomerFormDialog";

type SafeResult = { data?: unknown; serverError?: string } | undefined;

async function settle(results: Promise<SafeResult>[], message: string): Promise<ActionOutcome> {
  const settled = await Promise.all(results);
  const failed = settled.filter((result) => !result?.data);
  if (failed.length === 0) return { ok: true, message };
  return { ok: false, error: failed[0]?.serverError ?? `${failed.length} of ${settled.length} failed. Please try again.` };
}

const setStatus = (customer: Customer, status: CustomerStatus) => updateCustomerStatusAction({ id: customer.id, status });

export function CustomersGrid({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const source = useMemo(() => clientSource(customers), [customers]);

  const rowActions: RowAction<Customer>[] = [
    {
      id: "activate", permission: "customers:update",
      label: "Activate",
      icon: CircleCheck,
      swipe: "leading",
      hidden: (customer) => customer.status === "active",
      optimistic: () => ({ status: "active" as CustomerStatus }),
      run: (customer) => settle([setStatus(customer, "active")], `${customerName(customer)} activated`),
    },
    {
      id: "deactivate", permission: "customers:update",
      label: "Deactivate",
      icon: CircleSlash,
      hidden: (customer) => customer.status !== "active",
      optimistic: () => ({ status: "inactive" as CustomerStatus }),
      run: (customer) => settle([setStatus(customer, "inactive")], `${customerName(customer)} deactivated`),
    },
    {
      id: "ban", permission: "customers:update",
      label: "Ban",
      icon: ShieldBan,
      tone: "destructive",
      hidden: (customer) => customer.status === "banned",
      confirm: (customer) => ({
        title: `Ban ${customerName(customer)}?`,
        description: "Their session ends on their next request, and they cannot sign in or order until you reactivate them.",
        confirmLabel: "Ban customer",
      }),
      optimistic: () => ({ status: "banned" as CustomerStatus }),
      run: (customer) => settle([setStatus(customer, "banned")], `${customerName(customer)} banned`),
    },
    {
      id: "delete", permission: "customers:delete",
      label: "Delete",
      icon: Trash2,
      tone: "destructive",
      swipe: "trailing",
      confirm: (customer) => ({
        title: `Delete ${customerName(customer)}?`,
        description: "Only possible while they have no orders — otherwise ban them instead.",
        confirmLabel: "Delete customer",
      }),
      optimistic: "remove",
      run: (customer) => settle([deleteCustomerAction({ id: customer.id })], `${customerName(customer)} deleted`),
    },
  ];

  const bulkActions: BulkAction<Customer>[] = [
    {
      id: "activate", permission: "customers:update",
      label: "Activate",
      icon: CircleCheck,
      optimistic: () => ({ status: "active" as CustomerStatus }),
      run: ({ rows }) => settle(rows.map((customer) => setStatus(customer, "active")), `${rows.length} customers activated`),
    },
    {
      id: "ban", permission: "customers:update",
      label: "Ban",
      icon: ShieldBan,
      tone: "destructive",
      confirm: (count) => ({ title: `Block ${count} ${count === 1 ? "customer" : "customers"}?`, confirmLabel: "Block" }),
      optimistic: () => ({ status: "banned" as CustomerStatus }),
      run: ({ rows }) => settle(rows.map((customer) => setStatus(customer, "banned")), `${rows.length} customers banned`),
    },
    {
      id: "delete", permission: "customers:delete",
      label: "Delete",
      icon: Trash2,
      tone: "destructive",
      confirm: (count) => ({ title: `Delete ${count} ${count === 1 ? "customer" : "customers"}?`, description: "This cannot be undone.", confirmLabel: "Delete" }),
      optimistic: "remove",
      run: ({ rows }) => settle(rows.map((customer) => deleteCustomerAction({ id: customer.id })), `${rows.length} customers deleted`),
    },
  ];

  return (
    <DataGrid<Customer>
      id="customers"
      noun={["customer", "customers"]}
      columns={customerColumns}
      source={source}
      getRowId={(customer) => customer.id}
      workspace={{ icon: Users, render: (customer) => <CustomerDetail customer={customer} /> }}
      rowActions={rowActions}
      bulkActions={bulkActions}
      onMutated={() => router.refresh()}
      cells={{
        name: (customer) => <span className="font-medium">{customerName(customer)}</span>,
        status: (customer) => {
          const status = customerStatuses[customer.status];
          return <StatusLabel tone={status.tone}>{status.label}</StatusLabel>;
        },
      }}
      emptyState={
        <Empty className="border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>No customers yet</EmptyTitle>
            <EmptyDescription>Shoppers appear here when they register, or you can add one yourself.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CreateCustomerButton />
          </EmptyContent>
        </Empty>
      }
    />
  );
}
