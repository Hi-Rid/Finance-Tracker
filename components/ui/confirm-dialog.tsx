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
                <DialogHeader>
                    <div className="flex items-start gap-3">
                        <div
                            className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                                variant === 'destructive'
                                    ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                    : 'bg-brand/10 text-brand'
                            )}
                        >
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-base">{title}</DialogTitle>
                            {description && (
                                <DialogDescription className="text-sm mt-1">
                                    {description}
                                </DialogDescription>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <DialogFooter className="flex-row gap-2 sm:justify-end">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="flex-1 sm:flex-initial"
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={loading}
                        className={cn(
                            'flex-1 sm:flex-initial',
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

/**
 * Hook untuk manage confirm dialog state dengan mudah.
 */
export function useConfirmDialog() {
    const [state, setState] = useState<{
        open: boolean
        title: string
        description?: string
        confirmLabel?: string
        variant?: 'default' | 'destructive'
        onConfirm: () => void | Promise<void>
    }>({
        open: false,
        title: '',
        onConfirm: () => { },
    })

    const confirm = useCallback(
        (options: Omit<typeof state, 'open'>) => {
            setState({ ...options, open: true })
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
                variant={state.variant}
                onConfirm={state.onConfirm}
            />
        ),
    }
}