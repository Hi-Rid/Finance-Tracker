'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { capitalizeFirst } from '@/lib/normalize'
import { useTrackedAction } from './use-tracked-action'
import type { CategoryInput } from '@/lib/validators/category'

export function useCategories() {
    const router = useRouter()
    const supabase = createClient()
    const track = useTrackedAction()

    const createCategory = useCallback(
        async (data: CategoryInput) => {
            return track(async () => {
                const {
                    data: { user },
                } = await supabase.auth.getUser()
                if (!user) {
                    toast.error('Anda belum login')
                    return { success: false }
                }

                const { error } = await supabase.from('categories').insert({
                    user_id: user.id,
                    name: capitalizeFirst(data.name),
                    type: data.type,
                    group_name: data.group_name,
                    icon: data.icon || null,
                    color: data.color || null,
                    sort_order: 500,
                })

                if (error) {
                    toast.error(error.message)
                    return { success: false, error }
                }

                toast.success('Kategori ditambahkan')
                router.refresh()
                return { success: true }
            }, 'Menambahkan kategori...')
        },
        [supabase, router, track]
    )

    const updateCategory = useCallback(
        async (id: string, data: Partial<CategoryInput>) => {
            return track(async () => {
                const normalized = {
                    ...data,
                    ...(data.name ? { name: capitalizeFirst(data.name) } : {}),
                }

                const { data: updated, error } = await supabase
                    .from('categories')
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

                toast.success('Kategori diupdate')
                router.refresh()
                return { success: true }
            }, 'Menyimpan kategori...')
        },
        [supabase, router, track]
    )

    const archiveCategory = useCallback(
        async (id: string) => {
            return track(async () => {
                const { data: updated, error } = await supabase
                    .from('categories')
                    .update({ is_archived: true })
                    .eq('id', id)
                    .select()

                if (error) {
                    toast.error(error.message)
                    return { success: false, error }
                }

                if (!updated || updated.length === 0) {
                    toast.error('Gagal arsip: akses ditolak')
                    return { success: false }
                }

                toast.success('Kategori diarsipkan', {
                    description:
                        'Data lama tetap aman, kategori tidak muncul di dropdown baru.',
                })
                router.refresh()
                return { success: true }
            }, 'Mengarsipkan kategori...')
        },
        [supabase, router, track]
    )

    const unarchiveCategory = useCallback(
        async (id: string) => {
            return track(async () => {
                const { error } = await supabase
                    .from('categories')
                    .update({ is_archived: false })
                    .eq('id', id)

                if (error) {
                    toast.error(error.message)
                    return { success: false, error }
                }

                toast.success('Kategori diaktifkan kembali')
                router.refresh()
                return { success: true }
            }, 'Mengaktifkan kategori...')
        },
        [supabase, router, track]
    )

    return {
        createCategory,
        updateCategory,
        archiveCategory,
        unarchiveCategory,
    }
}