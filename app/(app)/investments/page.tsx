import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageWrapper, PageHeader } from '@/components/layout/page-wrapper'
import { PortfolioPage } from '@/components/investments/portfolio-page'
import { getPortfolioData } from '@/lib/investments/actions'

export default async function InvestmentsPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .order('created_at', { ascending: true })
        .limit(1)

    const profileId = profiles?.[0]?.id

    if (!profileId) {
        return (
            <PageWrapper>
                <PageHeader
                    title="Investasi"
                    description="Belum ada profile. Bikin profile dulu di settings."
                />
            </PageWrapper>
        )
    }

    const [portfolio, accountsRes] = await Promise.all([
        getPortfolioData(profileId),
        supabase
            .from('accounts')
            .select('*')
            .eq('profile_id', profileId)
            .eq('is_archived', false)
            .order('created_at'),
    ])

    return (
        <PageWrapper>
            <PageHeader
                title="Investasi"
                description="Portfolio saham, crypto, dan reksadana"
            />
            <PortfolioPage
                data={portfolio}
                profileId={profileId}
                accounts={accountsRes.data || []}
            />
        </PageWrapper>
    )
}