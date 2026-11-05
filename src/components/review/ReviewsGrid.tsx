"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, MessageSquareQuote, Package, Trash2 } from "lucide-react";
import { DataGrid, DetailFields, DetailSection, type ActionOutcome, type BulkAction, type RowAction } from "@/components/data-grid";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { deleteReviewAction, updateReviewVisibilityAction } from "@/lib/api/review/action";
import { reviewColumns } from "@/lib/api/review/grid";
import { reviewCustomerName, reviewProductImage, reviewProductName, type Review } from "@/lib/api/review/types";
import { PRODUCT_ROUTES } from "@/lib/api/product/constants";
import { clientSource } from "@/lib/data-grid";

type SafeResult = { data?: unknown; serverError?: string } | undefined;

async function settle(results: Promise<SafeResult>[], message: string): Promise<ActionOutcome> {
  const settled = await Promise.all(results);
  const failed = settled.filter((result) => !result?.data);
  if (failed.length === 0) return { ok: true, message };
  return { ok: false, error: failed[0]?.serverError ?? `${failed.length} of ${settled.length} failed. Please try again.` };
}

const setVisible = (review: Review, isVisible: boolean) => updateReviewVisibilityAction({ id: review.id, isVisible });

const dateTime = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

function ReviewProduct({ review, size = "sm" }: { review: Review; size?: "sm" | "lg" }) {
  const image = reviewProductImage(review);
  const box = size === "lg" ? "size-14 rounded-md" : "size-7 rounded-sm";
  return (
    <Link
      href={PRODUCT_ROUTES.detail(review.product?.id ?? review.productId)}
      onClick={(event) => event.stopPropagation()}
      className="flex min-w-0 items-center gap-2.5 underline-offset-4 hover:underline"
    >
      {image?.url ? (
        // eslint-disable-next-line @next/next/no-img-element -- the R2 host is not configured for next/image
        <img src={image.url} alt={image.alt ?? ""} loading="lazy" className={`${box} shrink-0 border bg-muted/40 object-cover`} />
      ) : (
        <span className={`${box} flex shrink-0 items-center justify-center border bg-muted/40 text-muted-foreground`}>
          <Package className="size-3.5" />
        </span>
      )}
      <span className="truncate font-medium">{reviewProductName(review)}</span>
    </Link>
  );
}

function ReviewDetail({ review }: { review: Review }) {
  return (
    <div className="max-w-2xl space-y-10">
      <DetailSection title="Product">
        <ReviewProduct review={review} size="lg" />
      </DetailSection>
      <DetailSection title={`${review.rating} out of 5`}>
        <p aria-label={`${review.rating} out of 5`} className="text-lg tracking-widest text-foreground/80">
          {"★".repeat(review.rating)}
          <span className="text-muted-foreground/40">{"★".repeat(Math.max(0, 5 - review.rating))}</span>
        </p>
        <p className="max-w-prose text-sm leading-6 whitespace-pre-line text-foreground/85">{review.comment || "No written review."}</p>
      </DetailSection>
      <DetailSection title="Details">
        <DetailFields
          items={[
            ["SKU", review.product?.sku && <span key="sku" className="font-mono text-[13px]">{review.product.sku}</span>],
            ["Customer", reviewCustomerName(review) || null],
            ["Email", review.customer?.email],
            ["Verified buyer", review.isVerifiedBuyer === undefined ? null : review.isVerifiedBuyer ? "Yes" : "No"],
            ["Visibility", review.isVisible === false ? "Hidden from the storefront" : "Visible"],
            ["Posted", review.createdAt ? dateTime.format(new Date(review.createdAt)) : null],
          ]}
        />
      </DetailSection>
    </div>
  );
}

export function ReviewsGrid({ reviews }: { reviews: Review[] }) {
  const router = useRouter();
  const source = useMemo(() => clientSource(reviews), [reviews]);

  const rowActions: RowAction<Review>[] = [
    {
      id: "hide",
      label: "Hide from storefront",
      icon: EyeOff,
      swipe: "leading",
      hidden: (review) => review.isVisible === false,
      optimistic: () => ({ isVisible: false }),
      run: (review) => settle([setVisible(review, false)], "Review hidden"),
    },
    {
      id: "show",
      label: "Show on storefront",
      icon: Eye,
      swipe: "leading",
      hidden: (review) => review.isVisible !== false,
      optimistic: () => ({ isVisible: true }),
      run: (review) => settle([setVisible(review, true)], "Review published"),
    },
    {
      id: "delete",
      label: "Delete",
      icon: Trash2,
      tone: "destructive",
      swipe: "trailing",
      confirm: () => ({ title: "Delete this review?", description: "Hiding keeps it for your records. Deleting cannot be undone.", confirmLabel: "Delete review" }),
      optimistic: "remove",
      run: (review) => settle([deleteReviewAction({ id: review.id })], "Review deleted"),
    },
  ];

  const bulkActions: BulkAction<Review>[] = [
    { id: "hide", label: "Hide", icon: EyeOff, optimistic: () => ({ isVisible: false }), run: ({ rows }) => settle(rows.map((review) => setVisible(review, false)), `${rows.length} reviews hidden`) },
    { id: "show", label: "Show", icon: Eye, optimistic: () => ({ isVisible: true }), run: ({ rows }) => settle(rows.map((review) => setVisible(review, true)), `${rows.length} reviews published`) },
    {
      id: "delete",
      label: "Delete",
      icon: Trash2,
      tone: "destructive",
      confirm: (count) => ({ title: `Delete ${count} ${count === 1 ? "review" : "reviews"}?`, description: "This cannot be undone.", confirmLabel: "Delete" }),
      optimistic: "remove",
      run: ({ rows }) => settle(rows.map((review) => deleteReviewAction({ id: review.id })), `${rows.length} reviews deleted`),
    },
  ];

  return (
    <DataGrid<Review>
      id="reviews"
      noun={["review", "reviews"]}
      columns={reviewColumns}
      source={source}
      getRowId={(review) => review.id}
      workspace={{ icon: MessageSquareQuote, render: (review) => <ReviewDetail review={review} /> }}
      rowActions={rowActions}
      bulkActions={bulkActions}
      onMutated={() => router.refresh()}
      defaultQuery={{ sort: [{ id: "createdAt", desc: true }] }}
      cells={{ productId: (review) => <ReviewProduct review={review} /> }}
      emptyState={
        <Empty className="border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageSquareQuote />
            </EmptyMedia>
            <EmptyTitle>No reviews yet</EmptyTitle>
            <EmptyDescription>Reviews customers leave on your storefront show up here, where you can hide or remove them.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      }
    />
  );
}
