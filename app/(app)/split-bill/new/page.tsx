import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { EventWizard } from '@/components/split-bill/wizard/event-wizard'

export default async function NewEventPage() {
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

    const [groupsRes, accountsRes] = await Promise.all([
        supabase
            .from('groups')
            .select('*')
            .eq('profile_id', profileId)
            .eq('is_archived', false)
            .order('created_at'),
        supabase
            .from('accounts')
            .select('*')
            .eq('profile_id', profileId)
            .eq('is_archived', false)
            .neq('type', 'envelope')
            .order('created_at'),
    ])

    const userName =
        (user.email?.split('@')[0] || 'Lu')
            .replace(/[._-]/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Lu'

    return (
        <PageWrapper>
            <EventWizard
                profileId={profileId}
                groups={groupsRes.data || []}
                accounts={accountsRes.data || []}
                userName={userName}
            />
        </PageWrapper>
    )
}