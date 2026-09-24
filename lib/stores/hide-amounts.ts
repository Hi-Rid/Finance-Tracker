import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type HideAmountsState = {
    hidden: boolean
    toggle: () => void
    setHidden: (hidden: boolean) => void
}

export const useHideAmounts = create<HideAmountsState>()(
    persist(
        (set) => ({
            hidden: false,
            toggle: () => set((s) => ({ hidden: !s.hidden })),
            setHidden: (hidden) => set({ hidden }),
        }),
        {
            name: 'finance-hide-amounts',
        }
    )
)

export const MASKED_AMOUNT = 'Rp ***.***.***'