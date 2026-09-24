'use client'

import { useHideAmounts } from '@/lib/stores/hide-amounts'
import { cn } from '@/lib/utils'

type AmountProps = {
    value: number
    sign?: 'auto' | 'positive' | 'negative' | 'none'
    className?: string
    prefix?: string
    suffix?: string
}

const MASKED = '---'

export function Amount({
    value,
    sign = 'none',
    className,
    prefix,
    suffix,
}: AmountProps) {
    const { hidden } = useHideAmounts()

    const signChar =
        sign === 'auto'
            ? value >= 0
                ? '+'
                : '-'
            : sign === 'positive'
                ? '+'
                : sign === 'negative'
                    ? '-'
                    : ''

    if (hidden) {
        return (
            <span className={cn('tabular-nums', className)}>
                {prefix}
                {signChar}Rp {MASKED}
                {suffix}
            </span>
        )
    }

    return (
        <span className={cn('tabular-nums', className)}>
            {prefix}
            {signChar}Rp {Math.abs(value).toLocaleString('id-ID')}
            {suffix}
        </span>
    )
}