import { Skeleton } from "@/components/ui/skeleton";

export default function ThemesLoading() {
  return (
    <div aria-busy="true" aria-label="Loading themes">
      <div className="mb-8 flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-8 w-48" />
      </div>
      <Skeleton className="mb-4 h-5 w-36" />
      <div className="grid overflow-hidden rounded-md border md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Skeleton className="aspect-16/10 rounded-none" />
        <div className="space-y-3 p-8">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <Skeleton className="mt-12 mb-4 h-5 w-28" />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-md border">
            <Skeleton className="aspect-16/10 rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
