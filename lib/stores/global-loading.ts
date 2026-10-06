import { create } from 'zustand'

type GlobalLoadingState = {
    /** Counter — kalau > 0, overlay muncul. Support multiple concurrent ops. */
    count: number
    /** Pesan opsional yang ditampilin di bawah spinner */
    message: string | null
    /** Increment counter. Panggil sebelum operasi async. */
    show: (message?: string) => void
    /** Decrement counter. Panggil di finally. */
    hide: () => void
    /** Force reset (emergency only) */
    reset: () => void
}

export const useGlobalLoading = create<GlobalLoadingState>()((set) => ({
    count: 0,
    message: null,
    show: (message) =>
        set((s) => ({
            count: s.count + 1,
            message: message || s.message,
        })),
    hide: () =>
        set((s) => {
            const next = Math.max(0, s.count - 1)
            return {
                count: next,
                message: next === 0 ? null : s.message,
            }
        }),
    reset: () => set({ count: 0, message: null }),
}))