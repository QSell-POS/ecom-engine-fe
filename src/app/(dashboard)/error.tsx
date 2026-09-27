"use client";

import { useEffect } from "react";
import { RotateCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

export default function DashboardError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Empty className="min-h-[60vh] border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TriangleAlert />
        </EmptyMedia>
        <EmptyTitle>This page couldn&apos;t load</EmptyTitle>
        <EmptyDescription>
          We couldn&apos;t get the data for this page, usually because the API server is unavailable. Check
          that it&apos;s running, then try again.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={retry}>
          <RotateCw /> Try again
        </Button>
        {process.env.NODE_ENV === "development" && (
          <p className="font-mono text-xs text-muted-foreground">{error.message}</p>
        )}
      </EmptyContent>
    </Empty>
  );
}
