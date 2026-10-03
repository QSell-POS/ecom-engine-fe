import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { ReviewsGrid } from "@/components/review/ReviewsGrid";
import { getReviews } from "@/lib/api/review/service";

export const metadata: Metadata = { title: "Reviews" };

export default async function ReviewsPage() {
  const { data: reviews } = await getReviews({ limit: 300 });

  return (
    <>
      <PageHeader title="Reviews" description="What customers say about your products. Hide anything that does not belong." />
      <ReviewsGrid reviews={reviews} />
    </>
  );
}
