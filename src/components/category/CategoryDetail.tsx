import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DetailFields, DetailSection, type WorkspaceContext } from "@/components/data-grid";
import { StatusLabel } from "@/components/common/StatusLabel";
import type { CategoryNode } from "@/lib/api/category/grid";
import type { Category } from "@/lib/api/category/types";

const dateTime = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const date = (value?: string) => (value ? dateTime.format(new Date(value)) : null);

/** Category record body. Parent and subcategories open in place. */
export function CategoryDetail({
  category,
  parent,
  context,
}: {
  category: CategoryNode;
  parent?: Category;
  context: WorkspaceContext;
}) {
  return (
    <div className="max-w-3xl space-y-10">
      <DetailSection title="About">
        {category.description ? (
          <p className="max-w-prose text-sm leading-6 whitespace-pre-line text-foreground/85">{category.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground">No description yet.</p>
        )}
      </DetailSection>

      <DetailSection title={category.children.length ? `Subcategories · ${category.children.length}` : "Subcategories"}>
        {category.children.length ? (
          <ul className="divide-y border-y">
            {category.children.map((child) => (
              <li key={child.id}>
                <button
                  type="button"
                  onClick={() => context.open(child.id)}
                  className="group flex w-full items-center gap-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50"
                >
                  <span className="min-w-0 flex-1 truncate font-medium">{child.name}</span>
                  <StatusLabel tone={child.isActive === false ? "neutral" : "success"}>{child.isActive === false ? "Inactive" : "Active"}</StatusLabel>
                  <ChevronRight className="size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No subcategories.</p>
        )}
      </DetailSection>

      <DetailSection title="Details">
        <DetailFields
          items={[
            [
              "Parent",
              parent ? (
                <button type="button" onClick={() => context.open(parent.id)} className="underline-offset-4 hover:underline">
                  {parent.name}
                </button>
              ) : (
                <span className="text-muted-foreground">Top level</span>
              ),
            ],
            ["URL handle", `/${category.slug}`],
            ["Position", category.position ?? null],
            ["Image", category.image && <span className="truncate font-mono text-[13px]">{category.image}</span>],
          ]}
        />
      </DetailSection>

      <DetailSection
        title="Products"
        action={
          <Link href={`/products?f.category=${encodeURIComponent(category.name)}`} className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            View products
          </Link>
        }
      >
        <p className="text-sm text-muted-foreground">Products in {category.name}, filtered in the products list.</p>
      </DetailSection>

      <DetailSection title="Activity">
        <DetailFields
          items={[
            ["Updated", date(category.updatedAt)],
            ["Created", date(category.createdAt)],
          ]}
        />
      </DetailSection>
    </div>
  );
}
