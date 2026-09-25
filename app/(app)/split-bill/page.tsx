import { PageWrapper, PageHeader } from '@/components/layout/page-wrapper'

export default function SplitBillPage() {
    return (
        <PageWrapper>
            <PageHeader
                title="Split Bill"
                description="Patungan & bagi tagihan dengan teman"
            />
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">
                    Halaman Split Bill — coming soon
                </p>
            </div>
        </PageWrapper>
    )
}