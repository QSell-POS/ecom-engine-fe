"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, CircleSlash, Pencil, Shapes, Trash2 } from "lucide-react";
import { DataGrid, type ActionOutcome, type BulkAction, type RowAction } from "@/components/data-grid";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { deleteCategoryAction, updateCategoryAction } from "@/lib/api/category/action";
import { buildCategoryTree, categoryColumns, type CategoryNode } from "@/lib/api/category/grid";
import type { Category } from "@/lib/api/category/types";
import { clientSource } from "@/lib/data-grid";
import { CategoryDetail } from "./CategoryDetail";
import { CategoryFormDialog, CreateCategoryButton } from "./CategoryFormDialog";

type SafeResult = { data?: unknown; serverError?: string } | undefined;

async function settle(results: Promise<SafeResult>[], message: string): Promise<ActionOutcome> {
  const settled = await Promise.all(results);
  const failed = settled.filter((r) => !r?.data);
  if (failed.length === 0) return { ok: true, message };
  return { ok: false, error: failed[0]?.serverError ?? `${failed.length} of ${settled.length} failed. Please try again.` };
}

function setActive(category: Category, isActive: boolean) {
  return updateCategoryAction({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    isActive,
  });
}

export function CategoriesGrid({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Category | null>(null);
  const source = useMemo(() => clientSource(buildCategoryTree(categories)), [categories]);
  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const rowActions: RowAction<CategoryNode>[] = [
    { id: "edit", label: "Edit", icon: Pencil, swipe: "leading", run: (c) => setEditing(c) },
    { id: "deactivate", label: "Deactivate", icon: CircleSlash, hidden: (c) => c.isActive === false, optimistic: () => ({ isActive: false }), run: (c) => settle([setActive(c, false)], `${c.name} deactivated`) },
    { id: "activate", label: "Activate", icon: CircleCheck, hidden: (c) => c.isActive !== false, optimistic: () => ({ isActive: true }), run: (c) => settle([setActive(c, true)], `${c.name} activated`) },
    {
      id: "delete",
      label: "Delete",
      icon: Trash2,
      tone: "destructive",
      swipe: "trailing",
      confirm: (c) => ({
        title: `Delete ${c.name}?`,
        description: c.children.length
          ? `It has ${c.children.length} subcategor${c.children.length === 1 ? "y" : "ies"}, which may also be affected. This can't be undone.`
          : "This can't be undone.",
        confirmLabel: "Delete category",
      }),
      optimistic: "remove",
      run: (c) => settle([deleteCategoryAction({ id: c.id })], `${c.name} deleted`),
    },
  ];

  const bulkActions: BulkAction<CategoryNode>[] = [
    { id: "activate", label: "Activate", icon: CircleCheck, optimistic: () => ({ isActive: true }), run: ({ rows }) => settle(rows.map((c) => setActive(c, true)), `${rows.length} categories activated`) },
    { id: "deactivate", label: "Deactivate", icon: CircleSlash, optimistic: () => ({ isActive: false }), run: ({ rows }) => settle(rows.map((c) => setActive(c, false)), `${rows.length} categories deactivated`) },
    {
      id: "delete",
      label: "Delete",
      icon: Trash2,
      tone: "destructive",
      confirm: (count) => ({ title: `Delete ${count} ${count === 1 ? "category" : "categories"}?`, description: "This can't be undone.", confirmLabel: "Delete" }),
      optimistic: "remove",
      run: ({ rows }) => settle(rows.map((c) => deleteCategoryAction({ id: c.id })), `${rows.length} categories deleted`),
    },
  ];

  return (
    <>
      <DataGrid<CategoryNode>
        id="categories"
        noun={["category", "categories"]}
        columns={categoryColumns}
        source={source}
        getRowId={(c) => c.id}
        getSubRows={(c) => c.children}
        workspace={{
          icon: Shapes,
          render: (c, context) => (
            <CategoryDetail category={c} parent={c.parentId ? byId.get(c.parentId) : undefined} context={context} />
          ),
        }}
        rowActions={rowActions}
        bulkActions={bulkActions}
        onMutated={() => router.refresh()}
        cells={{ name: (c) => <span className="font-medium">{c.name}</span> }}
        emptyState={
          <Empty className="border py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Shapes />
              </EmptyMedia>
              <EmptyTitle>No categories yet</EmptyTitle>
              <EmptyDescription>Group products into categories to build your store&apos;s navigation.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <CreateCategoryButton />
            </EmptyContent>
          </Empty>
        }
      />
      {editing && (
        <CategoryFormDialog key={editing.id} category={editing} open onOpenChange={(open) => !open && setEditing(null)} />
      )}
    </>
  );
}
