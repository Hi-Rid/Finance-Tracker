'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

type CurrencyInputProps = Omit<
    React.ComponentProps<'input'>,
    'value' | 'onChange' | 'type'
> & {
    value: number | null | undefined
    onChange: (value: number) => void
}

function formatThousands(n: number): string {
    if (!n || n === 0) return ''
    return n.toLocaleString('id-ID')
}

export function CurrencyInput({
    value,
    onChange,
    className,
    placeholder = '0',
    ...props
}: CurrencyInputProps) {
    const displayValue = formatThousands(value ?? 0)

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        // Strip semua non-digit
        const raw = e.target.value.replace(/\D/g, '')

        if (raw === '') {
            onChange(0)
            return
        }

        // Limit biar gak overflow (max 18 digit)
        const trimmed = raw.slice(0, 18)
        const num = parseInt(trimmed, 10)

        if (!isNaN(num)) {
            onChange(num)
        }
    }

    return (
        <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            className={cn(
                'flex h-10 w-full min-w-0 rounded-lg border px-3 py-2 text-base transition-all outline-none md:text-sm',
                'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400',
                'dark:bg-white/5 dark:border-white/15 dark:text-white dark:placeholder:text-white/40',
                'focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30',
                'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                'tabular-nums',
                className
            )}
            {...props}
        />
    )
}