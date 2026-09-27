import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DetailFields, DetailSection } from "@/components/data-grid";
import type { Brand } from "@/lib/api/brand/types";

const dateTime = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const date = (value?: string) => (value ? dateTime.format(new Date(value)) : null);

/** Brand record body for the brands workspace. */
export function BrandDetail({ brand }: { brand: Brand }) {
  return (
    <div className="max-w-3xl space-y-10">
      <DetailSection title="About">
        {brand.description ? (
          <p className="max-w-prose text-sm leading-6 whitespace-pre-line text-foreground/85">{brand.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground">No description yet.</p>
        )}
      </DetailSection>

      <DetailSection title="Details">
        <DetailFields
          items={[
            [
              "Website",
              brand.website && (
                <a href={brand.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline-offset-4 hover:underline">
                  {brand.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                  <ArrowUpRight className="size-3.5 text-muted-foreground" />
                </a>
              ),
            ],
            ["URL handle", `/${brand.slug}`],
            ["Logo", brand.logo && <span className="truncate font-mono text-[13px]">{brand.logo}</span>],
          ]}
        />
      </DetailSection>

      <DetailSection
        title="Products"
        action={
          <Link href={`/products?f.brand=${encodeURIComponent(brand.name)}`} className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            View products
          </Link>
        }
      >
        <p className="text-sm text-muted-foreground">Everything you sell from {brand.name}, filtered in the products list.</p>
      </DetailSection>

      <DetailSection title="Activity">
        <DetailFields
          items={[
            ["Updated", date(brand.updatedAt)],
            ["Created", date(brand.createdAt)],
          ]}
        />
      </DetailSection>
    </div>
  );
}
