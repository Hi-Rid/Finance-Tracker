'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export function useReceipts() {
    const router = useRouter()
    const supabase = createClient()

    const deleteReceipt = useCallback(
        async (id: string) => {
            const { error } = await supabase.from('receipts').delete().eq('id', id)

            if (error) {
                toast.error(error.message)
                return { success: false, error }
            }

            toast.success('Struk dihapus')
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    const bulkDeleteReceipts = useCallback(
        async (ids: string[]) => {
            if (ids.length === 0) return { success: false }

            const { data: deleted, error } = await supabase
                .from('receipts')
                .delete()
                .in('id', ids)
                .select('id')

            if (error) {
                toast.error(error.message)
                return { success: false, error }
            }

            if (!deleted || deleted.length === 0) {
                toast.error('Gagal hapus: akses ditolak')
                return { success: false }
            }

            toast.success(`${deleted.length} struk dihapus`)
            router.refresh()
            return { success: true, count: deleted.length }
        },
        [supabase, router]
    )

    return { deleteReceipt, bulkDeleteReceipts }
}