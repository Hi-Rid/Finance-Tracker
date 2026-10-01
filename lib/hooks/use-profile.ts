'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

const BUCKET = 'avatars'
const MAX_SIZE = 2 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export function useProfile() {
    const router = useRouter()
    const supabase = createClient()

    const updateProfile = useCallback(
        async (profileId: string, data: { name?: string; avatar_url?: string | null }) => {
            const { error } = await supabase
                .from('profiles')
                .update(data)
                .eq('id', profileId)

            if (error) {
                console.error('[profile] update failed:', error)
                toast.error('Gagal simpan profile')
                return { success: false }
            }

            toast.success('Profile tersimpan')
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    const uploadAvatar = useCallback(
        async (
            userId: string,
            file: File
        ): Promise<{ success: boolean; url?: string }> => {
            if (file.size > MAX_SIZE) {
                toast.error('Gambar terlalu besar (max 2MB)')
                return { success: false }
            }
            if (!ALLOWED_TYPES.includes(file.type)) {
                toast.error('Format gak didukung. Pakai JPG, PNG, atau WebP.')
                return { success: false }
            }

            const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
            const filename = `${userId}/avatar-${Date.now()}.${ext}`

            const { error } = await supabase.storage
                .from(BUCKET)
                .upload(filename, file, {
                    contentType: file.type,
                    cacheControl: '31536000',
                    upsert: false,
                })

            if (error) {
                console.error('[profile] upload failed:', error)
                toast.error(`Gagal upload: ${error.message}`)
                return { success: false }
            }

            const {
                data: { publicUrl },
            } = supabase.storage.from(BUCKET).getPublicUrl(filename)

            return { success: true, url: publicUrl }
        },
        [supabase]
    )

    const deleteAvatar = useCallback(
        async (url: string) => {
            const match = url.match(/avatars\/(.+)$/)
            if (!match?.[1]) return
            await supabase.storage.from(BUCKET).remove([match[1]])
        },
        [supabase]
    )

    return { updateProfile, uploadAvatar, deleteAvatar }
}