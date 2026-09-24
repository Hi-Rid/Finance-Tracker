'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { BudgetPeriodInput } from '@/lib/validators/budget'

export function useBudgetPeriod() {
    const router = useRouter()
    const supabase = createClient()

    const upsertPeriod = useCallback(
        async (
            data: BudgetPeriodInput,
            profileId: string,
            month: string
        ) => {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                toast.error('Lu belum login')
                return { success: false }
            }

            const { error } = await supabase.from('budget_periods').upsert(
                {
                    user_id: user.id,
                    profile_id: profileId,
                    month,
                    income: data.income,
                    note: data.note?.trim() || null,
                },
                {
                    onConflict: 'profile_id,month',
                }
            )

            if (error) {
                toast.error(error.message)
                return { success: false, error }
            }

            toast.success('Income diupdate')
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    return { upsertPeriod }
}