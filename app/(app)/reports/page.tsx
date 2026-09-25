import { PageWrapper, PageHeader } from '@/components/layout/page-wrapper'

export default function ReportsPage() {
    return (
        <PageWrapper>
            <PageHeader
                title="Laporan"
                description="Analisa & report keuangan"
            />
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">
                    Halaman Laporan — coming soon
                </p>
            </div>
        </PageWrapper>
    )
}