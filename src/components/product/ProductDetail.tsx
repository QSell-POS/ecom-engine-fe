import Link from "next/link";
import { DetailFields, DetailSection, DetailStats } from "@/components/data-grid";
import { StatusLabel } from "@/components/common/StatusLabel";
import { stockLevel, stockStatuses } from "@/lib/api/product/grid";
import type { Product } from "@/lib/api/product/types";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const count = new Intl.NumberFormat("en-US");
const dateTime = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

const date = (value?: string) => (value ? dateTime.format(new Date(value)) : null);

/** Product record body for the products workspace. */
export function ProductDetail({ product }: { product: Product }) {
  const price = Number(product.sellingPrice);
  const compareAt = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const discount = compareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : null;
  const onHand = product.inventory?.quantityOnHand ?? 0;
  const reserved = product.inventory?.quantityReserved ?? 0;
  const level = stockStatuses[stockLevel(product)];

  return (
    <div className="space-y-10">
      <DetailStats
        items={[
          {
            label: "Price",
            value: money.format(price),
            hint: compareAt ? (
              <>
                Compare at <span className="line-through">{money.format(compareAt)}</span>
                {discount ? ` · ${discount}% off` : ""}
              </>
            ) : (
              "No compare-at price"
            ),
          },
          {
            label: "Available",
            value: count.format(Math.max(0, onHand - reserved)),
            hint: <StatusLabel tone={level.tone} className="text-xs">{level.label}</StatusLabel>,
          },
          { label: "On hand", value: count.format(onHand), hint: `${count.format(reserved)} reserved` },
          {
            label: "Low stock alert",
            value: product.stockAlert ? count.format(product.stockAlert) : "Off",
            hint: product.stockAlert ? "Alerts at or below this" : "No alert set",
          },
        ]}
      />

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-10">
          <DetailSection title="Description">
            {product.description ? (
              <p className="max-w-prose text-sm leading-6 whitespace-pre-line text-foreground/85">{product.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No description yet. Add one so customers know what they&apos;re buying.</p>
            )}
          </DetailSection>

          <DetailSection title="Attributes">
            {product.attributes?.length ? (
              <DetailFields items={product.attributes.map((a) => [a.name, a.value])} />
            ) : (
              <p className="text-sm text-muted-foreground">No attributes.</p>
            )}
          </DetailSection>

          <DetailSection title="Identifiers">
            <DetailFields
              items={[
                ["SKU", <span key="sku" className="font-mono text-[13px]">{product.sku}</span>],
                ["Barcode", product.barcode && <span className="font-mono text-[13px]">{product.barcode}</span>],
                ["HS code", product.hsCode],
                ["URL handle", `/${product.slug}`],
              ]}
            />
          </DetailSection>
        </div>

        <aside className="space-y-10">
          <DetailSection title="Organization">
            <DetailFields
              labelWidth="6rem"
              items={[
                [
                  "Category",
                  product.category && (
                    <Link href={`/categories?open=${product.category.id}`} className="underline-offset-4 hover:underline">
                      {product.category.name}
                    </Link>
                  ),
                ],
                [
                  "Brand",
                  product.brand && (
                    <Link href={`/brand?open=${product.brand.id}`} className="underline-offset-4 hover:underline">
                      {product.brand.name}
                    </Link>
                  ),
                ],
                ["Badges", product.badges?.length ? product.badges.join(", ") : null],
              ]}
            />
          </DetailSection>
          <DetailSection title="Activity">
            <DetailFields
              labelWidth="6rem"
              items={[
                ["Updated", date(product.updatedAt)],
                ["Created", date(product.createdAt)],
              ]}
            />
          </DetailSection>
        </aside>
      </div>
    </div>
  );
}
