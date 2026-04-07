import { Skeleton } from "../ui/skeleton"
import { Separator } from "../ui/separator"

/**
 * Skeleton that exactly mirrors VideoPromptCard layout:
 * - aspect-video thumbnail area
 * - title + description below
 * - info bar at bottom with model + creator (separated by vertical line)
 */
export function PromptSkeleton() {
  return (
    <div className="bg-background border border-border rounded-xl h-full flex flex-col w-full overflow-hidden">
      {/* Thumbnail — matches aspect-video bg-muted */}
      <div className="relative aspect-video bg-muted border-b border-border">
        {/* Category badge bottom-left */}
        <Skeleton className="absolute bottom-2 left-2 h-5 w-16 rounded-md" />
      </div>

      <div className="p-0 flex flex-col flex-grow">
        {/* Title + Description — matches px-4 pt-3 pb-4 */}
        <div className="px-4 pt-3 pb-4 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3.5 w-full" />
        </div>

        {/* Info Bar — matches border-t px-4 py-3 bg-muted/30 */}
        <div className="mt-auto border-t border-border px-4 py-3 bg-muted/30">
          <div className="flex items-center justify-between gap-6">
            {/* Model */}
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <Skeleton className="w-5 h-5 rounded" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Separator orientation="vertical" className="h-10" />
            {/* Creator */}
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <Skeleton className="w-5 h-5 rounded" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PromptsGridSkeleton() {
  return (
    <div className="!w-full p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <PromptSkeleton key={i} />
      ))}
    </div>
  )
}
