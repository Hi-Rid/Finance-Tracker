import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageWrapper, PageHeader } from '@/components/layout/page-wrapper'
import { EventsList } from '@/components/split-bill/events-list'
import { getEventList } from '@/lib/split-bill/actions'

export default async function SplitBillPage() {
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

    const events = await getEventList(profileId)

    return (
        <PageWrapper>
            <PageHeader
                title="Split Bill"
                description="Patungan & bagi tagihan dengan teman"
            />
            <EventsList events={events} />
        </PageWrapper>
    )
}