import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { FinancialFreedomPage } from '@/components/financial-freedom/financial-freedom-page'
import { fetchFinancialFreedomServerData } from '@/lib/financial-freedom/server-compute'
import type {
    FiSettings,
    FiSnapshot,
    FiInsight,
    FiMilestoneRow,
    FiActionStep,
} from '@/lib/financial-freedom/types'

export default async function FinancialFreedomPageContainer() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // ============ PROFILE ============
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .order('created_at', { ascending: true })
        .limit(1)

    const profile = profiles?.[0]

    if (!profile) {
        return (
            <PageWrapper>
                <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground">
                        Belum ada profile. Bikin profile dulu di settings.
                    </p>
                </div>
            </PageWrapper>
        )
    }

    // ============ ENSURE SETTINGS ROW ============
    const { data: settingsRaw } = await supabase
        .from('financial_freedom_settings' as any)
        .select('*')
        .eq('profile_id', profile.id)
        .maybeSingle()

    let settings = settingsRaw as FiSettings | null

    if (!settings) {
        const { data: created } = await supabase
            .from('financial_freedom_settings' as any)
            .insert({
                user_id: user.id,
                profile_id: profile.id,
                fi_type: 'regular',
                fi_multiplier: 25,
                expected_return_rate: 0.10,
                inflation_rate: 0.03,
                onboarding_completed: false,
            })
            .select('*')
            .single()

        settings = created as FiSettings | null
    }

    if (!settings) {
        return (
            <PageWrapper>
                <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground">
                        Gagal load data Financial Freedom. Coba refresh.
                    </p>
                </div>
            </PageWrapper>
        )
    }

    // ============ PARALLEL FETCH ============
    const [serverData, snapshotsRes, insightRes, stepsRes, milestonesRes] =
        await Promise.all([
            fetchFinancialFreedomServerData({
                profileId: profile.id,
                userId: user.id,
            }),
            supabase
                .from('financial_freedom_snapshots' as any)
                .select('*')
                .eq('profile_id', profile.id)
                .order('snapshot_month', { ascending: true })
                .limit(24),
            supabase
                .from('financial_freedom_insights' as any)
                .select('*')
                .eq('profile_id', profile.id)
                .order('generated_at', { ascending: false })
                .limit(1)
                .maybeSingle(),
            supabase
                .from('financial_freedom_action_steps' as any)
                .select('*')
                .eq('profile_id', profile.id)
                .order('sort_order', { ascending: true }),
            supabase
                .from('financial_freedom_milestones' as any)
                .select('*')
                .eq('profile_id', profile.id),
        ])

    return (
        <PageWrapper>
            <FinancialFreedomPage
                profileId={profile.id}
                profileName={profile.name}
                settings={settings}
                serverData={serverData}
                snapshots={(snapshotsRes.data || []) as FiSnapshot[]}
                latestInsight={(insightRes.data || null) as FiInsight | null}
                actionSteps={(stepsRes.data || []) as FiActionStep[]}
                milestones={(milestonesRes.data || []) as FiMilestoneRow[]}
            />
        </PageWrapper>
    )
}