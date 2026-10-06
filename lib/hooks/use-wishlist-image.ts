'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useTrackedAction } from './use-tracked-action'

const MAX_SIZE = 3 * 1024 * 1024 // 3MB
const ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
]

const BUCKET = 'wishlist-images'

export function useWishlistImage() {
    const supabase = createClient()
    const track = useTrackedAction()

    // ============================================================
    // UPLOAD
    // ============================================================
    const uploadImage = useCallback(
        async (
            file: File
        ): Promise<{ success: boolean; imageUrl?: string; imagePath?: string }> => {
            // Validasi dulu (sebelum track)
            if (file.size > MAX_SIZE) {
                toast.error(
                    `Gambar terlalu besar. Maks 3MB (file Anda ${(file.size / 1024 / 1024).toFixed(1)}MB)`
                )
                return { success: false }
            }

            if (!ALLOWED_TYPES.includes(file.type)) {
                toast.error('Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.')
                return { success: false }
            }

            return track(async () => {
                const {
                    data: { user },
                } = await supabase.auth.getUser()

                if (!user) {
                    toast.error('Anda belum login')
                    return { success: false }
                }

                const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
                const timestamp = Date.now()
                const random = Math.random().toString(36).slice(2, 8)
                const filename = `${user.id}/${timestamp}-${random}.${ext}`

                const { error } = await supabase.storage
                    .from(BUCKET)
                    .upload(filename, file, {
                        contentType: file.type,
                        cacheControl: '31536000',
                        upsert: false,
                    })

                if (error) {
                    console.error('[wishlist-image] upload failed:', error)
                    toast.error(`Gagal upload: ${error.message}`)
                    return { success: false }
                }

                const {
                    data: { publicUrl },
                } = supabase.storage.from(BUCKET).getPublicUrl(filename)

                return {
                    success: true,
                    imageUrl: publicUrl,
                    imagePath: filename,
                }
            }, 'Mengunggah gambar...')
        },
        [supabase, track]
    )

    // ============================================================
    // DELETE (quick — no track)
    // ============================================================
    const deleteImage = useCallback(
        async (imagePath: string): Promise<boolean> => {
            if (!imagePath) return false

            const { error } = await supabase.storage.from(BUCKET).remove([imagePath])

            if (error) {
                console.error('[wishlist-image] delete failed:', error)
                return false
            }

            return true
        },
        [supabase]
    )

    return { uploadImage, deleteImage }
}