'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useTrackedAction } from './use-tracked-action'

export type NotificationPreferences = {
    user_id: string
    cooling_off_done: boolean
    saving_ready: boolean
    budget_alert: boolean
    bill_reminder: boolean
    piutang_due: boolean
    milestone_achieved: boolean
    weekly_review: boolean
    ai_enabled: boolean
    quiet_hours_enabled: boolean
    quiet_hours_start: string
    quiet_hours_end: string
}

export function useSettingsPreferences() {
    const router = useRouter()
    const supabase = createClient()
    const track = useTrackedAction()

    // ============================================================
    // UPDATE PREFERENCES (partial)
    // ============================================================
    const updatePreferences = useCallback(
        async (patch: Partial<NotificationPreferences>) => {
            return track(async () => {
                const {
                    data: { user },
                } = await supabase.auth.getUser()

                if (!user) {
                    toast.error('Anda belum login')
                    return { success: false }
                }

                const { error } = await supabase
                    .from('notification_preferences')
                    .upsert(
                        {
                            user_id: user.id,
                            ...patch,
                        },
                        { onConflict: 'user_id' }
                    )

                if (error) {
                    console.error('[settings-prefs] update failed:', error)
                    toast.error('Gagal menyimpan preferensi')
                    return { success: false, error }
                }

                toast.success('Preferensi tersimpan')
                router.refresh()
                return { success: true }
            }, 'Menyimpan preferensi...')
        },
        [supabase, router, track]
    )

    // ============================================================
    // TOGGLE QUICK (no track — dipakai switch yang butuh feedback instan)
    // ============================================================
    const togglePreference = useCallback(
        async (
            key: keyof Omit<NotificationPreferences, 'user_id'>,
            value: boolean
        ) => {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) return { success: false }

            const { error } = await supabase
                .from('notification_preferences')
                .upsert(
                    {
                        user_id: user.id,
                        [key]: value,
                    },
                    { onConflict: 'user_id' }
                )

            if (error) {
                console.error('[settings-prefs] toggle failed:', error)
                toast.error('Gagal menyimpan')
                return { success: false, error }
            }

            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    return { updatePreferences, togglePreference }
}