'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { capitalizeFirst } from '@/lib/normalize'
import type { MonthlyBudgetInput } from '@/lib/validators/budget'

export function useMonthlyBudget() {
    const router = useRouter()
    const supabase = createClient()

    const upsertBudget = useCallback(
        async (
            data: MonthlyBudgetInput,
            profileId: string,
            month: string,
            existingId?: string
        ) => {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                toast.error('Lu belum login')
                return { success: false }
            }

            const payload = {
                user_id: user.id,
                profile_id: profileId,
                name: capitalizeFirst(data.name),
                category_id: data.category_id || null,
                month,
                amount: data.amount,
                currency: 'IDR',
                note: data.note?.trim() || null,
            }

            // Kalau edit, update by id
            if (existingId) {
                const { error } = await supabase
                    .from('budgets')
                    .update(payload)
                    .eq('id', existingId)

                if (error) {
                    toast.error(error.message)
                    return { success: false, error }
                }

                toast.success('Budget diupdate')
                router.refresh()
                return { success: true }
            }

            // Kalau create, upsert by (profile_id, name, month)
            const { error } = await supabase.from('budgets').upsert(
                payload,
                {
                    onConflict: 'profile_id,name,month',
                }
            )

            if (error) {
                toast.error(error.message)
                return { success: false, error }
            }

            toast.success('Budget disimpan')
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