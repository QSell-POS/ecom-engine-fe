import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the PageHeader + table layout so content doesn't jump when it arrives.
export default function DashboardLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="overflow-hidden rounded-md border">
        <div className="border-b px-4 py-3">
          <Skeleton className="h-8 w-64" />
        </div>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 border-b px-4 py-3.5 last:border-b-0">
            <Skeleton className="size-8 rounded-md" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
