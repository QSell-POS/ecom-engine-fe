import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { ReviewsGrid } from "@/components/review/ReviewsGrid";
import { getReviews } from "@/lib/api/review/service";
import { loadAllPages } from "@/lib/api/shared/types";

export const metadata: Metadata = { title: "Reviews" };

export default async function ReviewsPage() {
  const reviews = await loadAllPages(getReviews);

  return (
    <>
      <PageHeader title="Reviews" description="What customers say about your products. Hide anything that does not belong." />
      <ReviewsGrid reviews={reviews} />
    </>
  );
}
