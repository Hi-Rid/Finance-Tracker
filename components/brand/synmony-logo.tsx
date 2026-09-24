import { cn } from '@/lib/utils'

type SynmonyLogoProps = {
    variant?: 'full' | 'mark'
    size?: 'sm' | 'md' | 'lg'
    showTagline?: boolean
    className?: string
    /** Dot indicator di pojok mark (online status) */
    showDot?: boolean
}

const SIZES = {
    sm: {
        mark: 'w-8 h-8 rounded-lg text-sm',
        wordmark: 'text-base',
        tagline: 'text-[9px]',
    },
    md: {
        mark: 'w-10 h-10 rounded-2xl text-lg',
        wordmark: 'text-lg',
        tagline: 'text-[10px]',
    },
    lg: {
        mark: 'w-14 h-14 rounded-2xl text-2xl',
        wordmark: 'text-2xl',
        tagline: 'text-xs',
    },
} as const

export function SynmonyLogo({
    variant = 'full',
    size = 'md',
    showTagline = false,
    className,
    showDot = true,
}: SynmonyLogoProps) {
    const s = SIZES[size]

    const mark = (
        <div
            className={cn(
                'relative bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center font-bold text-white shadow-lg shadow-brand/30 shrink-0',
                s.mark
            )}
        >
            S
            {showDot && (
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-current" />
            )}
        </div>
    )

    if (variant === 'mark') {
        return <div className={cn(className)}>{mark}</div>
    }

    return (
        <div className={cn('flex items-center gap-3', className)}>
            {mark}
            <div className="flex flex-col">
                <span
                    className={cn(
                        'font-bold tracking-tight leading-none',
                        s.wordmark
                    )}
                >
                    Synmony
                </span>
                {showTagline && (
                    <span
                        className={cn(
                            'uppercase tracking-wider mt-0.5 opacity-70',
                            s.tagline
                        )}
                    >
                        Second Brain for Money
                    </span>
                )}
            </div>
        </div>
    )
}