import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper, PageHeader } from '@/components/layout/page-wrapper'
import { GoalsPage } from '@/components/goals/goals-page'
import { ensureUserSetup } from '@/lib/utils/ensure-user-setup'
import type { Database } from '@/types/database'

type Goal = Database['public']['Tables']['goals']['Row']
type Contribution = Database['public']['Tables']['goal_contributions']['Row']

export default async function GoalsPageContainer() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { profileId } = await ensureUserSetup(user.id)
    if (!profileId) redirect('/dashboard')

    const [goalsRes, contribsRes, accountsRes] = await Promise.all([
        supabase
            .from('goals')
            .select('*')
            .eq('profile_id', profileId)
            .order('created_at', { ascending: false }),
        supabase
            .from('goal_contributions')
            .select('*, goals!inner(profile_id)')
            .eq('goals.profile_id', profileId)
            .order('date', { ascending: false })
            .limit(1000),
        supabase
            .from('accounts')
            .select('*')
            .eq('profile_id', profileId)
            .eq('is_archived', false)
            .neq('type', 'envelope')
            .order('created_at', { ascending: true }),
    ])

    return (
        <PageWrapper>
            <PageHeader
                title="Goals"
                description="Target tabungan & pencapaian lu"
            />
            <GoalsPage
                goals={(goalsRes.data || []) as Goal[]}
                contributions={(contribsRes.data || []) as Contribution[]}
                accounts={accountsRes.data || []}
                profileId={profileId}
            />
        </PageWrapper>
    )
}