'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type LoadingOverlayProps = {
    /** Kalau true, overlay muncul */
    show: boolean
    /** Pesan opsional di bawah spinner */
    message?: string
    /** 
     * Full-screen (fixed inset-0) atau 
     * inline (absolute, butuh parent relative)
     */
    fullScreen?: boolean
    /** Kelas tambahan */
    className?: string
}

/**
 * Overlay spinner dengan backdrop blur.
 *
 * Pakai untuk operasi lama di halaman yang sama:
 * - AI analyze (Financial Advisor)
 * - OCR scan struk
 * - Export data
 * - Delete account
 *
 * Contoh:
 *   <div className="relative">
 *     <YourContent />
 *     <LoadingOverlay show={loading} message="Menganalisis..." />
 *   </div>
 */
export function LoadingOverlay({
    show,
    message,
    fullScreen = false,
    className,
}: LoadingOverlayProps) {
    if (!show) return null

    return (
        <div
            className={cn(
                'z-[80] flex flex-col items-center justify-center gap-3',
                'bg-background/80 backdrop-blur-sm',
                'transition-all duration-200',
                fullScreen
                    ? 'fixed inset-0'
                    : 'absolute inset-0 rounded-2xl',
                className
            )}
        >
            <Loader2 className="w-8 h-8 animate-spin text-brand" />
            {message && (
                <p className="text-sm font-medium text-foreground max-w-xs text-center px-4">
                    {message}
                </p>
            )}
        </div>
    )
}