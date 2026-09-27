import { Skeleton } from "@/components/ui/skeleton";

export default function EditorLoading() {
  return (
    <div aria-busy="true" aria-label="Loading editor" className="flex h-svh flex-col bg-background">
      <div className="grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b px-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-7 w-28" />
        <div className="flex justify-end gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="w-72 space-y-2 border-r p-3">
          <Skeleton className="mb-4 h-8 w-full" />
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={index} className="h-7 w-full" />
          ))}
        </div>
        <div className="flex-1 bg-muted/70 p-8">
          <Skeleton className="mx-auto h-full max-w-5xl rounded-lg bg-background" />
        </div>
        <div className="w-80 border-l" />
      </div>
    </div>
  );
}
