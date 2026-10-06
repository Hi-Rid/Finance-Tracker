import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NotificationsSettingsClient } from '@/components/settings/notifications-settings-client'
import type { NotificationPreferences } from '@/lib/hooks/use-settings-preferences'

export default async function NotificationsSettingsPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Fetch preferences (auto-created on signup)
    const { data: prefs } = await supabase
        .from('notification_preferences' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

    return (
        <NotificationsSettingsClient
            preferences={(prefs as NotificationPreferences | null) || null}
        />
    )
}