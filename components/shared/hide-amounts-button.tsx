'use client'

import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useHideAmounts } from '@/lib/stores/hide-amounts'

type HideAmountsButtonProps = {
    size?: 'default' | 'sm' | 'icon' | 'icon-sm'
}

export function HideAmountsButton({ size = 'icon' }: HideAmountsButtonProps) {
    const { hidden, toggle } = useHideAmounts()

    return (
        <Button
            variant="ghost"
            size={size}
            aria-label={hidden ? 'Tampilkan nominal' : 'Sembunyikan nominal'}
            title={hidden ? 'Tampilkan nominal' : 'Sembunyikan nominal'}
            onClick={toggle}
        >
            {hidden ? (
                <EyeOff className="w-5 h-5" />
            ) : (
                <Eye className="w-5 h-5" />
            )}
        </Button>
    )
}