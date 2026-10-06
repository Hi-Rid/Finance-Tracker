'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { capitalizeFirst } from '@/lib/normalize'
import { useTrackedAction } from './use-tracked-action'
import type { DailyBudgetItemInput } from '@/lib/validators/budget'

export function useDailyBudget() {
    const router = useRouter()
    const supabase = createClient()
    const track = useTrackedAction()

    const createItem = useCallback(
        async (data: DailyBudgetItemInput, profileId: string) => {
            return track(async () => {
                const {
                    data: { user },
                } = await supabase.auth.getUser()

                if (!user) {
                    toast.error('Anda belum login')
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
            }, 'Menambahkan item...')
        },
        [supabase, router, track]
    )

    const updateItem = useCallback(
        async (id: string, data: Partial<DailyBudgetItemInput>) => {
            return track(async () => {
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
            }, 'Menyimpan perubahan...')
        },
        [supabase, router, track]
    )

    const deleteItem = useCallback(
        async (id: string) => {
            return track(async () => {
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
            }, 'Menghapus item...')
        },
        [supabase, router, track]
    )

    const toggleItem = useCallback(
        async (id: string, isActive: boolean) => {
            // Gak pakai track — toggle cepat, gak butuh overlay
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