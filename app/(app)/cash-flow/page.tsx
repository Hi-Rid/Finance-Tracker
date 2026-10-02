import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper, PageHeader } from '@/components/layout/page-wrapper'
import { CashFlowPage } from '@/components/cash-flow/cash-flow-page'
import { ensureUserSetup } from '@/lib/utils/ensure-user-setup'

export default async function CashFlowPageContainer() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { profileId } = await ensureUserSetup(user.id)
    if (!profileId) redirect('/dashboard')

    // Fetch cash flow history 12 bulan
    const { data: cashFlowHistory } = await supabase.rpc(
        'get_cash_flow_history' as any,
        { p_profile_id: profileId, p_months: 12 }
    )

    // Fetch categories + accounts untuk display
    const [categoriesRes, accountsRes] = await Promise.all([
        supabase
            .from('categories')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_archived', false),
        supabase
            .from('accounts')
            .select('id, name, type, current_balance, is_archived')
            .eq('profile_id', profileId)
            .eq('is_archived', false),
    ])

    return (
        <PageWrapper>
            <PageHeader
                title="Cash Flow"
                description="Detail arus kas masuk & keluar"
            />
            <CashFlowPage
                cashFlowHistory={(cashFlowHistory || []) as any[]}
                categories={categoriesRes.data || []}
                accounts={accountsRes.data || []}
                profileId={profileId}
            />
        </PageWrapper>
    )
}