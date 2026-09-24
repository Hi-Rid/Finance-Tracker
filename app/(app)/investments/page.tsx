import { PageWrapper, PageHeader } from '@/components/layout/page-wrapper'

export default function InvestmentsPage() {
    return (
        <PageWrapper>
            <PageHeader
                title="Investasi"
                description="Portfolio saham, crypto, emas, dan reksadana"
            />
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">
                    Halaman Investasi — coming soon
                </p>
            </div>
        </PageWrapper>
    )
}