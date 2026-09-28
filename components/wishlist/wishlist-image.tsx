'use client'

import { useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type WishlistImageProps = {
    imageUrl: string | null | undefined
    alt: string
    className?: string
    aspect?: 'square' | '4:3' | '16:9' | '3:2'
}

export function WishlistImage({
    imageUrl,
    alt,
    className,
    aspect = '4:3',
}: WishlistImageProps) {
    const [error, setError] = useState(false)

    const aspectClass = {
        square: 'aspect-square',
        '4:3': 'aspect-[4/3]',
        '16:9': 'aspect-video',
        '3:2': 'aspect-[3/2]',
    }[aspect]

    const hasImage = !!imageUrl && !error

    return (
        <div
            className={cn(
                'relative overflow-hidden bg-slate-100 dark:bg-white/5',
                aspectClass,
                className
            )}
        >
            {hasImage ? (
                <img
                    src={imageUrl}
                    alt={alt}
                    loading="lazy"
                    onError={() => setError(true)}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/5 dark:to-white/[0.02]">
                    <ImageIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
            )}
        </div>
    )
}