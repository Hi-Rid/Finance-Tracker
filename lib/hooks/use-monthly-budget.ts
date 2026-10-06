'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { capitalizeFirst } from '@/lib/normalize'
import { useTrackedAction } from './use-tracked-action'
import type { MonthlyBudgetInput } from '@/lib/validators/budget'

export function useMonthlyBudget() {
    const router = useRouter()
    const supabase = createClient()
    const track = useTrackedAction()

    const upsertBudget = useCallback(
        async (
            data: MonthlyBudgetInput,
            profileId: string,
            month: string,
            existingId?: string
        ) => {
            return track(async () => {
                const {
                    data: { user },
                } = await supabase.auth.getUser()

                if (!user) {
                    toast.error('Anda belum login')
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

                const { error } = await supabase.from('budgets').upsert(payload, {
                    onConflict: 'profile_id,name,month',
                })

                if (error) {
                    toast.error(error.message)
                    return { success: false, error }
                }

                toast.success('Budget disimpan')
                router.refresh()
                return { success: true }
            }, existingId ? 'Menyimpan perubahan budget...' : 'Menyimpan budget...')
        },
        [supabase, router, track]
    )

    const deleteBudget = useCallback(
        async (id: string) => {
            return track(async () => {
                const { error } = await supabase.from('budgets').delete().eq('id', id)

                if (error) {
                    toast.error(error.message)
                    return { success: false, error }
                }

                toast.success('Budget dihapus')
                router.refresh()
                return { success: true }
            }, 'Menghapus budget...')
        },
        [supabase, router, track]
    )

    return { upsertBudget, deleteBudget }
}