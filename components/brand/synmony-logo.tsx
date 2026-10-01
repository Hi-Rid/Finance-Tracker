import Image from 'next/image'
import { cn } from '@/lib/utils'

type SynmonyLogoProps = {
    variant?: 'full' | 'mark'
    size?: 'sm' | 'md' | 'lg' | 'xl'
    showTagline?: boolean
    className?: string
    showDot?: boolean
}

const MARK_SIZES = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
} as const

const WORD_SIZES = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
} as const

const TAGLINE_SIZES = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-sm',
} as const

/**
 * Logo mark (hanya icon) — dipakai di nav, header, dll.
 */
export function SynmonyMark({
    size = 'md',
    showDot = false,
    className,
}: {
    size?: 'sm' | 'md' | 'lg' | 'xl'
    showDot?: boolean
    className?: string
}) {
    return (
        <div className={cn('relative shrink-0', MARK_SIZES[size], className)}>
            <Image
                src="/synmony-logo.png"
                alt="Synmony"
                fill
                sizes="64px"
                className="object-contain"
                priority
            />
            {showDot && (
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-current" />
            )}
        </div>
    )
}

/**
 * Logo lengkap — mark + wordmark + optional tagline.
 */
export function SynmonyLogo({
    variant = 'full',
    size = 'md',
    showTagline = false,
    className,
    showDot = false,
}: SynmonyLogoProps) {
    if (variant === 'mark') {
        return <SynmonyMark size={size} showDot={showDot} className={className} />
    }

    return (
        <div className={cn('flex items-center gap-2.5 md:gap-3', className)}>
            <SynmonyMark size={size} showDot={showDot} />
            <div className="flex flex-col">
                <span
                    className={cn(
                        'font-bold tracking-tight leading-none',
                        WORD_SIZES[size]
                    )}
                >
                    Synmony
                </span>
                {showTagline && (
                    <span
                        className={cn(
                            'uppercase tracking-wider mt-1 opacity-70',
                            TAGLINE_SIZES[size]
                        )}
                    >
                        Second Brain for Your Money
                    </span>
                )}
            </div>
        </div>
    )
}