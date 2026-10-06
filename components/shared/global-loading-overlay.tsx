'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useGlobalLoading } from '@/lib/stores/global-loading'

/** Minimum lama spinner kelihatan — biar gak flicker di operasi cepet */
const MIN_DISPLAY_MS = 400

export function GlobalLoadingOverlay() {
    const count = useGlobalLoading((s) => s.count)
    const message = useGlobalLoading((s) => s.message)
    const [visible, setVisible] = useState(false)
    const shownAtRef = useRef<number>(0)
    const hideTimerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (count > 0) {
            // Clear pending hide timer (kalau ada operasi baru)
            if (hideTimerRef.current) {
                clearTimeout(hideTimerRef.current)
                hideTimerRef.current = null
            }
            // Show immediately
            if (!visible) {
                shownAtRef.current = Date.now()
                setVisible(true)
            }
        } else {
            // Hide, tapi minimal tampil MIN_DISPLAY_MS
            const elapsed = Date.now() - shownAtRef.current
            const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed)

            hideTimerRef.current = setTimeout(() => {
                setVisible(false)
                hideTimerRef.current = null
            }, remaining)
        }

        return () => {
            if (hideTimerRef.current) {
                clearTimeout(hideTimerRef.current)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [count])

    if (!visible) return null

    return (
        <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
        >
            <Loader2 className="w-14 h-14 animate-spin text-white drop-shadow-lg" />
            {message && (
                <p className="text-sm font-semibold text-white max-w-sm text-center px-4 drop-shadow-md">
                    {message}
                </p>
            )}
        </div>
    )
}