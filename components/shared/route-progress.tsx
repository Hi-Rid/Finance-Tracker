'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Progress bar tipis di atas viewport.
 * Muncul otomatis setiap route transition (klik link, sidebar, dll).
 *
 * Cara kerja:
 * - Detect pathname change
 * - Animate progress: 30% → 60% → 85% → 100%
 * - Hide setelah 300ms complete
 *
 * Kalau page fetch lama (loading.tsx muncul), bar tetep di 85% sampai
 * pathname berubah lagi.
 */
export function RouteProgress() {
    const pathname = usePathname()
    const [visible, setVisible] = useState(false)
    const [progress, setProgress] = useState(0)
    const prevPathRef = useRef(pathname)

    useEffect(() => {
        // Skip initial mount
        if (prevPathRef.current === pathname) return

        prevPathRef.current = pathname

        // Show & start progress
        setVisible(true)
        setProgress(30)

        const t1 = setTimeout(() => setProgress(60), 120)
        const t2 = setTimeout(() => setProgress(85), 350)

        // Complete
        const t3 = setTimeout(() => {
            setProgress(100)
            setTimeout(() => {
                setVisible(false)
                // Reset setelah fade out
                setTimeout(() => setProgress(0), 300)
            }, 250)
        }, 550)

        return () => {
            clearTimeout(t1)
            clearTimeout(t2)
            clearTimeout(t3)
        }
    }, [pathname])

    if (!visible && progress === 0) return null

    return (
        <div
            aria-hidden
            className="fixed top-0 left-0 right-0 z-[100] h-[3px] pointer-events-none transition-opacity duration-200"
            style={{ opacity: visible ? 1 : 0 }}
        >
            <div
                className="h-full bg-gradient-to-r from-brand via-[#4A6FC0] to-brand shadow-[0_0_12px_rgba(51,77,175,0.8)] transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    )
}