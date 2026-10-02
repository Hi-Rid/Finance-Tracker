'use client'

import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

type PasswordInputProps = Omit<
    React.ComponentProps<'input'>,
    'type'
> & {
    error?: boolean
}

export const PasswordInput = React.forwardRef<
    HTMLInputElement,
    PasswordInputProps
>(function PasswordInput({ className, error, ...props }, ref) {
    const [visible, setVisible] = React.useState(false)

    return (
        <div className="relative">
            <input
                {...props}
                ref={ref}
                type={visible ? 'text' : 'password'}
                className={cn(
                    'flex h-11 w-full min-w-0 rounded-lg border px-3.5 py-2 pr-11 text-base transition-all outline-none md:text-sm',
                    'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400',
                    'dark:bg-white/5 dark:border-white/15 dark:text-white dark:placeholder:text-white/40',
                    'focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30',
                    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                    error && 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20',
                    className
                )}
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                tabIndex={-1}
                aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
                className={cn(
                    'absolute right-3 top-1/2 -translate-y-1/2 shrink-0',
                    'w-7 h-7 rounded-md flex items-center justify-center',
                    'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300',
                    'transition-colors cursor-pointer'
                )}
            >
                {visible ? (
                    <EyeOff className="w-4 h-4" />
                ) : (
                    <Eye className="w-4 h-4" />
                )}
            </button>
        </div>
    )
})