'use client'

import { useCallback } from 'react'
import { useGlobalLoading } from '@/lib/stores/global-loading'

/**
 * Wrap async function dengan global loading indicator.
 *
 * Contoh:
 *   const track = useTrackedAction()
 *   const result = await track(
 *     () => createTransaction(data),
 *     'Menyimpan transaksi...'
 *   )
 *
 * Pesan opsional — kalau gak diisi, overlay cuma nampilin spinner.
 */
export function useTrackedAction() {
    return useCallback(
        async <T,>(fn: () => Promise<T>, message?: string): Promise<T> => {
            const { show, hide } = useGlobalLoading.getState()
            show(message)
            try {
                return await fn()
            } finally {
                hide()
            }
        },
        []
    )
}