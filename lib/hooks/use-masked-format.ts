'use client'

import { useHideAmounts } from '@/lib/stores/hide-amounts'
import { MASKED_AMOUNT } from '@/lib/stores/hide-amounts'

export function useMaskedFormat() {
    const { hidden } = useHideAmounts()

    return (value: number): string => {
        if (hidden) return MASKED_AMOUNT
        return `Rp ${value.toLocaleString('id-ID')}`
    }
}