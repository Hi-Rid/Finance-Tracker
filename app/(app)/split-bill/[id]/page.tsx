import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { EventDetail } from '@/components/split-bill/event-detail'
import { getEventDetail } from '@/lib/split-bill/actions'

type PageProps = {
    params: Promise<{ id: string }>
}

export default async function SplitBillDetailPage({ params }: PageProps) {
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
    if (!profileId) redirect('/dashboard')

    const [data, accountsRes] = await Promise.all([
        getEventDetail(id, profileId),
        supabase
            .from('accounts')
            .select('*')
            .eq('profile_id', profileId)
            .eq('is_archived', false)
            .neq('type', 'envelope')
            .order('created_at'),
    ])

    if (!data) notFound()

    return (
        <PageWrapper>
            <EventDetail data={data} accounts={accountsRes.data || []} />
        </PageWrapper>
    )
}