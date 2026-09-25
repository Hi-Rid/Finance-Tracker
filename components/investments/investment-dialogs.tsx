'use client'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { InvestmentForm } from './investment-form'
import { BuyMoreModal } from './buy-more-modal'
import { SellModal } from './sell-modal'
import { DividendModal } from './dividend-modal'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import type { Database } from '@/types/database'
import type { InvestmentPosition } from '@/lib/investments/types'

type Account = Database['public']['Tables']['accounts']['Row']

export type DialogState =
    | { type: 'none' }
    | { type: 'create' }
    | { type: 'buy-more'; position: InvestmentPosition }
    | { type: 'sell'; position: InvestmentPosition }
    | { type: 'dividend'; position: InvestmentPosition }

type InvestmentDialogsProps = {
    state: DialogState
    onClose: () => void
    profileId: string
    accounts: Account[]
}

const TITLES: Record<string, { title: string; description: string }> = {
    create: {
        title: 'Tambah Investasi',
        description: 'Catat pembelian saham, crypto, atau reksadana.',
    },
    'buy-more': {
        title: 'Beli Lagi',
        description: 'Tambah posisi — harga avg bakal di-recompute otomatis.',
    },
    sell: {
        title: 'Jual Investasi',
        description: 'Jual sebagian atau seluruh kepemilikan.',
    },
    dividend: {
        title: 'Catat Dividend',
        description: 'Catat dividend yang masuk dari emiten.',
    },
}

export function InvestmentDialogs({
    state,
    onClose,
    profileId,
    accounts,
}: InvestmentDialogsProps) {
    const isMobile = useMediaQuery('(max-width: 767px)')
    const open = state.type !== 'none'

    const meta = state.type !== 'none' ? TITLES[state.type] : null

    const content = (
        <>
            {state.type === 'create' && (
                <InvestmentForm
                    profileId={profileId}
                    accounts={accounts}
                    onSuccess={onClose}
                    onCancel={onClose}
                />
            )}
            {state.type === 'buy-more' && (
                <BuyMoreModal
                    position={state.position}
                    accounts={accounts}
                    onSuccess={onClose}
                    onCancel={onClose}
                />
            )}
            {state.type === 'sell' && (
                <SellModal
                    position={state.position}
                    accounts={accounts}
                    onSuccess={onClose}
                    onCancel={onClose}
                />
            )}
            {state.type === 'dividend' && (
                <DividendModal
                    position={state.position}
                    accounts={accounts}
                    onSuccess={onClose}
                    onCancel={onClose}
                />
            )}
        </>
    )

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
                <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
                    {meta && (
                        <SheetHeader>
                            <SheetTitle>{meta.title}</SheetTitle>
                            <SheetDescription>{meta.description}</SheetDescription>
                        </SheetHeader>
                    )}
                    <div className="px-4 pb-6 pt-2">{content}</div>
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                {meta && (
                    <DialogHeader>
                        <DialogTitle>{meta.title}</DialogTitle>
                        <DialogDescription>{meta.description}</DialogDescription>
                    </DialogHeader>
                )}
                {content}
            </DialogContent>
        </Dialog>
    )
}