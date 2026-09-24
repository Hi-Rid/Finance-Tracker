'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { MonthlyBudgetInput } from '@/lib/validators/budget'

export function useMonthlyBudget() {
    const router = useRouter()
    const supabase = createClient()

    const upsertBudget = useCallback(
        async (
            data: MonthlyBudgetInput,
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

            const { error } = await supabase.from('budgets').upsert(
                {
                    user_id: user.id,
                    profile_id: profileId,
                    category_id: data.category_id,
                    month,
                    amount: data.amount,
                    currency: 'IDR',
                    note: data.note?.trim() || null,
                },
                {
                    onConflict: 'profile_id,category_id,month',
                }
            )

            if (error) {
                toast.error(error.message)
                return { success: false, error }
            }

            toast.success('Budget diupdate')
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    const deleteBudget = useCallback(
        async (id: string) => {
            const { error } = await supabase
                .from('budgets')
                .delete()
                .eq('id', id)

            if (error) {
                toast.error(error.message)
                return { success: false, error }
            }

            toast.success('Budget dihapus')
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    return { upsertBudget, deleteBudget }
}