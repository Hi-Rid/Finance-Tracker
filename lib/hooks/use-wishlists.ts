'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { capitalizeFirst, smartCapitalize } from '@/lib/normalize'
import type { WishlistInput } from '@/lib/validators/wishlist'

export function useWishlists() {
    const router = useRouter()
    const supabase = createClient()

    const createWishlist = useCallback(
        async (data: WishlistInput, profileId: string) => {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                toast.error('Lu belum login')
                return { success: false }
            }

            const normalized = {
                user_id: user.id,
                profile_id: profileId,
                name: smartCapitalize(data.name),
                category: data.category?.trim() || null,
                priority: data.priority,
                target_price: data.target_price,
                currency: data.currency,
                link: data.link?.trim() || null,
                target_date: data.target_date || null,
                reason: data.reason?.trim() || null,
                mood: data.mood || null,
                alternatives: data.alternatives?.trim() || null,
                note: data.note?.trim() || null,
                status: 'planned',
                // Auto-set cooling-off 3 hari
                cooling_off_until: new Date(
                    Date.now() + 3 * 24 * 60 * 60 * 1000
                ).toISOString(),
                saved_amount: 0,
            }

            const { error } = await supabase.from('wishlists').insert(normalized)

            if (error) {
                console.error('Create wishlist error:', error)
                toast.error(error.message)
                return { success: false, error }
            }

            toast.success('Wishlist ditambahkan', {
                description: 'Cooling-off 3 hari mulai sekarang. Sabar ya!',
            })
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    const updateWishlist = useCallback(
        async (id: string, data: Partial<WishlistInput>) => {
            const normalized = {
                ...data,
                ...(data.name ? { name: smartCapitalize(data.name) } : {}),
                ...(data.category !== undefined
                    ? { category: data.category?.trim() || null }
                    : {}),
                ...(data.link !== undefined ? { link: data.link?.trim() || null } : {}),
                ...(data.reason !== undefined
                    ? { reason: data.reason?.trim() || null }
                    : {}),
                ...(data.alternatives !== undefined
                    ? { alternatives: data.alternatives?.trim() || null }
                    : {}),
                ...(data.note !== undefined ? { note: data.note?.trim() || null } : {}),
            }

            const { data: updated, error } = await supabase
                .from('wishlists')
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

            toast.success('Wishlist diupdate')
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    const deleteWishlist = useCallback(
        async (id: string) => {
            const { error } = await supabase.from('wishlists').delete().eq('id', id)

            if (error) {
                toast.error(error.message)
                return { success: false, error }
            }

            toast.success('Wishlist dihapus')
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    const updateStatus = useCallback(
        async (id: string, status: string) => {
            const { error } = await supabase
                .from('wishlists')
                .update({ status })
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

    return {
        createWishlist,
        updateWishlist,
        deleteWishlist,
        updateStatus,
    }
}