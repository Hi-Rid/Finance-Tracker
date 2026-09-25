import { PageWrapper, PageHeader } from '@/components/layout/page-wrapper'

export default function TripsPage() {
    return (
        <PageWrapper>
            <PageHeader
                title="Travel"
                description="Rencana & budget perjalanan"
            />
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">
                    Halaman Travel — coming soon
                </p>
            </div>
        </PageWrapper>
    )
}