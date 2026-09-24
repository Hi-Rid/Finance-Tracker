import { PageWrapper, PageHeader } from '@/components/layout/page-wrapper'

export default function CashFlowPage() {
    return (
        <PageWrapper>
            <PageHeader
                title="Cash Flow"
                description="Detail arus kas masuk dan keluar"
            />
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">
                    Halaman detail Cash Flow — coming soon
                </p>
            </div>
        </PageWrapper>
    )
}