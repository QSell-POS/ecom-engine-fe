import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { MediaLibrary } from "@/components/media/MediaLibrary";
import { getMedia } from "@/lib/api/media-library/service";
import { loadAllPages } from "@/lib/api/shared/types";

export const metadata: Metadata = { title: "Media" };

export default async function MediaPage() {
  const assets = await loadAllPages(getMedia);

  return (
    <>
      <PageHeader
        title="Media"
        description="Every image you have uploaded. Products, brands and categories reference these rather than holding their own copies."
      />
      <MediaLibrary assets={assets} />
    </>
  );
}
