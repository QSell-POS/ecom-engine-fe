"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, CircleSlash, Pencil, Tag, Trash2 } from "lucide-react";
import { DataGrid, type ActionOutcome, type BulkAction, type RowAction } from "@/components/data-grid";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { createBrandAction, deleteBrandAction, updateBrandAction } from "@/lib/api/brand/action";
import { brandColumns } from "@/lib/api/brand/grid";
import type { Brand } from "@/lib/api/brand/types";
import { clientSource } from "@/lib/data-grid";
import { slugify } from "@/lib/slugify";
import { BrandDetail } from "./BrandDetail";
import { BrandFormDialog, CreateBrandButton } from "./BrandFormDialog";

type SafeResult = { data?: unknown; serverError?: string } | undefined;

async function settle(results: Promise<SafeResult>[], message: string): Promise<ActionOutcome> {
  const settled = await Promise.all(results);
  const failed = settled.filter((r) => !r?.data);
  if (failed.length === 0) return { ok: true, message };
  return { ok: false, error: failed[0]?.serverError ?? `${failed.length} of ${settled.length} failed. Please try again.` };
}

// The update endpoint expects the full brand, so status changes resend it.
function setActive(brand: Brand, isActive: boolean) {
  return updateBrandAction({
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    description: brand.description ?? "",
    logo: brand.logo || undefined,
    website: brand.website || undefined,
    isActive,
  });
}

export function BrandsGrid({ brands }: { brands: Brand[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Brand | null>(null);
  const source = useMemo(() => clientSource(brands), [brands]);

  const rowActions: RowAction<Brand>[] = [
    { id: "edit", label: "Edit", icon: Pencil, swipe: "leading", run: (brand) => setEditing(brand) },
    {
      id: "deactivate",
      label: "Deactivate",
      icon: CircleSlash,
      hidden: (b) => b.isActive === false,
      optimistic: () => ({ isActive: false }),
      run: (b) => settle([setActive(b, false)], `${b.name} deactivated`),
    },
    {
      id: "activate",
      label: "Activate",
      icon: CircleCheck,
      hidden: (b) => b.isActive !== false,
      optimistic: () => ({ isActive: true }),
      run: (b) => settle([setActive(b, true)], `${b.name} activated`),
    },
    {
      id: "delete",
      label: "Delete",
      icon: Trash2,
      tone: "destructive",
      swipe: "trailing",
      confirm: (b) => ({ title: `Delete ${b.name}?`, description: "Products keep working but lose this brand. This can't be undone.", confirmLabel: "Delete brand" }),
      optimistic: "remove",
      run: (b) => settle([deleteBrandAction({ id: b.id })], `${b.name} deleted`),
    },
  ];

  const bulkActions: BulkAction<Brand>[] = [
    { id: "activate", label: "Activate", icon: CircleCheck, optimistic: () => ({ isActive: true }), run: ({ rows }) => settle(rows.map((b) => setActive(b, true)), `${rows.length} brands activated`) },
    { id: "deactivate", label: "Deactivate", icon: CircleSlash, optimistic: () => ({ isActive: false }), run: ({ rows }) => settle(rows.map((b) => setActive(b, false)), `${rows.length} brands deactivated`) },
    {
      id: "delete",
      label: "Delete",
      icon: Trash2,
      tone: "destructive",
      confirm: (count) => ({ title: `Delete ${count} ${count === 1 ? "brand" : "brands"}?`, description: "This can't be undone.", confirmLabel: "Delete" }),
      optimistic: "remove",
      run: ({ rows }) => settle(rows.map((b) => deleteBrandAction({ id: b.id })), `${rows.length} brands deleted`),
    },
  ];

  async function importBrands(records: Record<string, string>[]): Promise<ActionOutcome> {
    const valid = records.filter((r) => r.name);
    if (valid.length === 0) return { ok: false, error: "No rows have a Name value." };
    const result = await settle(
      valid.map((r) =>
        createBrandAction({
          name: r.name,
          slug: r.slug || r.urlhandle || slugify(r.name),
          description: r.description ?? "",
          website: r.website || undefined,
          logo: r.logo || r.logourl || undefined,
          isActive: r.status ? !/^(inactive|no|false)$/i.test(r.status) : true,
        }),
      ),
      `Imported ${valid.length} ${valid.length === 1 ? "brand" : "brands"}`,
    );
    return result;
  }

  return (
    <>
      <DataGrid<Brand>
        id="brands"
        noun={["brand", "brands"]}
        columns={brandColumns}
        source={source}
        getRowId={(b) => b.id}
        workspace={{ icon: Tag, render: (b) => <BrandDetail brand={b} /> }}
        rowActions={rowActions}
        bulkActions={bulkActions}
        onImport={importBrands}
        importColumns={["Name", "Slug", "Website", "Description", "Status"]}
        onMutated={() => router.refresh()}
        cells={{ name: (b) => <span className="font-medium">{b.name}</span> }}
        emptyState={
          <Empty className="border py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Tag />
              </EmptyMedia>
              <EmptyTitle>No brands yet</EmptyTitle>
              <EmptyDescription>Add the brands you sell so customers can shop by the names they know.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <CreateBrandButton />
            </EmptyContent>
          </Empty>
        }
      />
      {editing && (
        <BrandFormDialog
          key={editing.id}
          brand={editing}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        />
      )}
    </>
  );
}
