import { Skeleton } from "@/components/ui/skeleton"

export default function PrizePoolSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-2 sm:space-y-0">
        <div>
          <Skeleton className="h-4 w-16 mb-1" />
          <Skeleton className="h-6 w-32 mb-2" />
        </div>
        <div className="text-left sm:text-right">
          <Skeleton className="h-8 w-24 mb-1" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <Skeleton className="h-4 w-16 mb-1" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div>
          <Skeleton className="h-4 w-16 mb-1" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="col-span-2">
          <Skeleton className="h-4 w-20 mb-1" />
          <Skeleton className="h-5 w-16 mb-1" />
          <Skeleton className="h-2 w-full" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
    </div>
  )
} 