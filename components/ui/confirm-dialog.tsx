'use client'

import { useState, useCallback } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type ConfirmDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'default' | 'destructive'
    onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = 'Konfirmasi',
    cancelLabel = 'Batal',
    variant = 'default',
    onConfirm,
}: ConfirmDialogProps) {
    const [loading, setLoading] = useState(false)

    async function handleConfirm() {
        setLoading(true)
        try {
            await onConfirm()
            onOpenChange(false)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="space-y-0">
                    {/* Icon - centered */}
                    <div className="flex justify-center pt-1">
                        <div
                            className={cn(
                                'w-12 h-12 rounded-full flex items-center justify-center',
                                variant === 'destructive'
                                    ? 'bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400'
                                    : 'bg-brand/10 text-brand'
                            )}
                        >
                            <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                    </div>

                    {/* Title - centered */}
                    <DialogTitle className="text-center text-base md:text-lg pt-3">
                        {title || 'Konfirmasi'}
                    </DialogTitle>

                    {/* Description - centered */}
                    {description && (
                        <DialogDescription className="text-center text-xs md:text-sm pt-1.5 leading-relaxed">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <DialogFooter className="flex-row gap-2 sm:justify-center pt-1">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="flex-1 h-10 md:h-11"
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={loading}
                        className={cn(
                            'flex-1 h-10 md:h-11',
                            variant === 'destructive' &&
                            'bg-red-500 hover:bg-red-600 text-white'
                        )}
                    >
                        {loading ? 'Loading...' : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

type ConfirmState = {
    open: boolean
    title: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'default' | 'destructive'
    onConfirm: () => void | Promise<void>
}

const initialState: ConfirmState = {
    open: false,
    title: '',
    description: undefined,
    confirmLabel: undefined,
    cancelLabel: undefined,
    variant: undefined,
    onConfirm: () => { },
}

export function useConfirmDialog() {
    const [state, setState] = useState<ConfirmState>(initialState)

    const confirm = useCallback(
        (options: Omit<ConfirmState, 'open'>) => {
            setState({
                ...initialState,
                ...options,
                open: true,
            })
        },
        []
    )

    const close = useCallback(() => {
        setState((prev) => ({ ...prev, open: false }))
    }, [])

    return {
        confirm,
        close,
        state,
        Dialog: () => (
            <ConfirmDialog
                open={state.open}
                onOpenChange={(open) => !open && close()}
                title={state.title}
                description={state.description}
                confirmLabel={state.confirmLabel}
                cancelLabel={state.cancelLabel}
                variant={state.variant}
                onConfirm={state.onConfirm}
            />
        ),
    }
}