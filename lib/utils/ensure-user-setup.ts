import { createClient } from '@/lib/supabase/server'

export async function ensureUserSetup(userId: string): Promise<{
    profileId: string | null
}> {
    const supabase = await createClient()

    const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .eq('is_default', true)
        .order('created_at', { ascending: true })
        .limit(1)

    if (profiles && profiles.length > 0) {
        return { profileId: profiles[0].id }
    }

    // Fallback
    console.warn('ensureUserSetup: creating missing profile for', userId)

    const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
            user_id: userId,
            name: 'Personal',
            type: 'personal',
            currency: 'IDR',
            is_default: true,
        })
        .select('id')
        .single()

    if (profileError || !newProfile) {
        console.error('ensureUserSetup: failed', profileError)
        return { profileId: null }
    }

    await supabase
        .from('user_settings')
        .upsert({ user_id: userId }, { onConflict: 'user_id' })

    try {
        await supabase.rpc('seed_default_categories', { p_user_id: userId })
    } catch (err) {
        console.error('ensureUserSetup: seed failed', err)
    }

    return { profileId: newProfile.id }
}