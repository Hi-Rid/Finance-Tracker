import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton loading untuk semua halaman di route group (app).
 * Next.js otomatis tampilkan ini saat server component loading.
 *
 * Design mirror struktur PageWrapper + PageHeader + Card.
 */
export default function AppLoading() {
    return (
        <div className="mx-auto w-full max-w-7xl py-3 sm:py-4 md:py-8">
            {/* PageHeader skeleton */}
            <div className="mb-3 sm:mb-4 md:mb-8">
                <Skeleton className="h-6 sm:h-7 md:h-9 w-40 sm:w-48 mb-2" />
                <Skeleton className="h-3 sm:h-4 w-56 sm:w-64" />
            </div>

            {/* Content skeleton */}
            <div className="space-y-4 md:space-y-5">
                {/* Row 1 - big card */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2">
                        <Skeleton className="h-[200px] md:h-[280px] rounded-2xl" />
                    </div>
                    <Skeleton className="hidden lg:block h-[280px] rounded-2xl" />
                </div>

                {/* Row 2 - two cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Skeleton className="h-[180px] rounded-2xl" />
                    <Skeleton className="h-[180px] rounded-2xl" />
                </div>

                {/* Row 3 - list */}
                <Skeleton className="h-[300px] rounded-2xl" />
            </div>
        </div>
    )
}