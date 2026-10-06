import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ensureUserSetup } from '@/lib/utils/ensure-user-setup'
import { DataSettingsClient } from '@/components/settings/data-settings-client'
import type { NotificationPreferences } from '@/lib/hooks/use-settings-preferences'

export default async function DataSettingsPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { profileId } = await ensureUserSetup(user.id)
    if (!profileId) redirect('/dashboard')

    // Fetch profile (buat consent status)
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, consented_at, consent_version')
        .eq('id', profileId)
        .maybeSingle()

    // Fetch notification preferences (buat AI toggle)
    const { data: prefs } = await supabase
        .from('notification_preferences' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

    return (
        <DataSettingsClient
            consent={{
                consentedAt: profile?.consented_at || null,
                consentVersion: profile?.consent_version || null,
            }}
            preferences={(prefs as NotificationPreferences | null) || null}
            userEmail={user.email || ''}
        />
    )
}