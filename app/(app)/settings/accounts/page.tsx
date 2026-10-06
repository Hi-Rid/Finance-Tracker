import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AccountsAuthSettingsClient } from '@/components/settings/accounts-auth-settings-client'

export default async function AccountsSettingsPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    return (
        <AccountsAuthSettingsClient
            email={user.email || ''}
            userId={user.id}
            createdAt={user.created_at}
            lastSignInAt={user.last_sign_in_at || null}
        />
    )
}