'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { capitalizeFirst } from '@/lib/normalize'
import type { DailyBudgetItemInput } from '@/lib/validators/budget'

export function useDailyBudget() {
    const router = useRouter()
    const supabase = createClient()

    const createItem = useCallback(
        async (data: DailyBudgetItemInput, profileId: string) => {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                toast.error('Lu belum login')
                return { success: false }
            }

            const { error } = await supabase.from('daily_budget_items').insert({
                user_id: user.id,
                profile_id: profileId,
                name: capitalizeFirst(data.name),
                category_id: data.category_id || null,
                amount: data.amount,
                sort_order: data.sort_order,
                is_active: data.is_active,
            })

            if (error) {
                toast.error(error.message)
                return { success: false, error }
            }

            toast.success('Item ditambahkan')
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    const updateItem = useCallback(
        async (id: string, data: Partial<DailyBudgetItemInput>) => {
            const normalized = {
                ...data,
                ...(data.name ? { name: capitalizeFirst(data.name) } : {}),
            }

            const { data: updated, error } = await supabase
                .from('daily_budget_items')
                .update(normalized)
                .eq('id', id)
                .select()

            if (error) {
                toast.error(error.message)
                return { success: false, error }
            }

            if (!updated || updated.length === 0) {
                toast.error('Gagal update: akses ditolak')
                return { success: false }
            }

            toast.success('Item diupdate')
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    const deleteItem = useCallback(
        async (id: string) => {
            const { error } = await supabase
                .from('daily_budget_items')
                .delete()
                .eq('id', id)

            if (error) {
                toast.error(error.message)
                return { success: false, error }
            }

            toast.success('Item dihapus')
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    const toggleItem = useCallback(
        async (id: string, isActive: boolean) => {
            const { error } = await supabase
                .from('daily_budget_items')
                .update({ is_active: isActive })
                .eq('id', id)

            if (error) {
                toast.error(error.message)
                return { success: false, error }
            }

            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    return { createItem, updateItem, deleteItem, toggleItem }
}