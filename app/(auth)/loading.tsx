import { Skeleton } from '@/components/ui/skeleton'

export default function AuthLoading() {
    return (
        <div className="min-h-screen bg-background flex">
            {/* Left panel skeleton */}
            <aside className="hidden lg:flex lg:w-[60%] bg-[#02050F] p-10 xl:p-20">
                <div className="w-full max-w-[580px] mx-auto flex flex-col justify-center gap-6">
                    <Skeleton className="h-10 w-40 bg-white/5" />
                    <Skeleton className="h-6 w-52 bg-white/5" />
                    <Skeleton className="h-12 w-full bg-white/5" />
                    <Skeleton className="h-12 w-3/4 bg-white/5" />
                    <Skeleton className="h-44 w-full bg-white/[0.03] rounded-2xl" />
                </div>
            </aside>

            {/* Form panel skeleton */}
            <main className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-[440px] space-y-5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-56" />
                    <Skeleton className="h-4 w-72" />
                    <div className="space-y-4 pt-4">
                        <Skeleton className="h-11 w-full rounded-lg" />
                        <Skeleton className="h-11 w-full rounded-lg" />
                        <Skeleton className="h-11 w-full rounded-lg" />
                    </div>
                </div>
            </main>
        </div>
    )
}