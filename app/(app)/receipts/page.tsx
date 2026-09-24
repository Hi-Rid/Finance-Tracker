import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageWrapper, PageHeader } from '@/components/layout/page-wrapper'
import { ReceiptsList } from '@/components/receipts/receipts-list'

export default async function ReceiptsPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: receipts } = await supabase
        .from('receipts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'success')
        .order('created_at', { ascending: false })
        .limit(500)

    return (
        <PageWrapper>
            <PageHeader
                title="Struk Tersimpan"
                description="Riwayat struk yang pernah di-scan"
            />
            <ReceiptsList receipts={receipts || []} />
        </PageWrapper>
    )
}