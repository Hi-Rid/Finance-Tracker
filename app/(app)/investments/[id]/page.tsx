import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { AssetDetail } from '@/components/investments/asset-detail'
import { getAssetDetail } from '@/lib/investments/actions'

type PageProps = {
    params: Promise<{ id: string }>
}

export default async function InvestmentDetailPage({ params }: PageProps) {
    const { id } = await params

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
    if (!profileId) redirect('/investments')

    const [detailData, accountsRes] = await Promise.all([
        getAssetDetail(id, profileId),
        supabase
            .from('accounts')
            .select('*')
            .eq('profile_id', profileId)
            .eq('is_archived', false)
            .order('created_at'),
    ])

    if (!detailData) notFound()

    return (
        <PageWrapper>
            <AssetDetail
                data={detailData}
                profileId={profileId}
                accounts={accountsRes.data || []}
            />
        </PageWrapper>
    )
}