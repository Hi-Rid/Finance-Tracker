'use client'

import { X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

type BulkAction = {
    label: string
    icon?: React.ReactNode
    onClick: () => void
    variant?: 'default' | 'destructive'
    disabled?: boolean
}

type BulkActionBarProps = {
    selectedCount: number
    totalOnPage: number
    onClearSelection: () => void
    actions: BulkAction[]
}

export function BulkActionBar({
    selectedCount,
    totalOnPage,
    onClearSelection,
    actions,
}: BulkActionBarProps) {
    const open = selectedCount > 0
    const hasMore = selectedCount > totalOnPage

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ y: 120, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 120, opacity: 0, scale: 0.95 }}
                    transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 30,
                        mass: 0.8,
                    }}
                    className={cn(
                        'fixed left-3 right-3 z-50',
                        'bottom-20 md:bottom-6',
                        'md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto md:min-w-fit'
                    )}
                >
                    <div
                        className={cn(
                            'relative overflow-hidden',
                            'rounded-2xl',
                            'bg-[#0B2050] dark:bg-[#0B2050]',
                            'border border-white/10',
                            'shadow-2xl shadow-black/40 dark:shadow-black/60',
                            'px-3 py-2.5 md:px-4 md:py-3'
                        )}
                    >
                        {/* Top shine */}
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

                        <div className="flex items-center gap-3 md:gap-4">
                            {/* Selected count */}
                            <div className="flex items-center gap-2.5 shrink-0">
                                <div className="relative">
                                    <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm flex items-center justify-center">
                                        <span className="text-sm font-bold text-white tabular-nums">
                                            {selectedCount}
                                        </span>
                                    </div>
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0B2050]"
                                    />
                                </div>
                                <div className="hidden sm:block">
                                    <p className="text-xs font-semibold text-white leading-tight">
                                        Dipilih
                                    </p>
                                    <p className="text-[10px] text-white/50 leading-tight">
                                        {hasMore
                                            ? `dari beberapa halaman`
                                            : `dari ${totalOnPage} di halaman ini`}
                                    </p>
                                </div>
                            </div>

                            <div className="w-px h-8 bg-white/10 shrink-0" />

                            {/* Actions */}
                            <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto">
                                {actions.map((action, i) => (
                                    <Button
                                        key={i}
                                        size="sm"
                                        onClick={action.onClick}
                                        disabled={action.disabled}
                                        className={cn(
                                            'shrink-0 h-8 rounded-lg gap-1.5 font-medium',
                                            action.variant === 'destructive'
                                                ? 'bg-red-500/15 text-red-300 hover:bg-red-500/25 hover:text-red-200 border border-red-500/20'
                                                : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                                        )}
                                    >
                                        {action.icon}
                                        <span>{action.label}</span>
                                    </Button>
                                ))}
                            </div>

                            <div className="w-px h-8 bg-white/10 shrink-0" />

                            {/* Clear */}
                            <Button
                                size="sm"
                                onClick={onClearSelection}
                                className="shrink-0 h-8 rounded-lg gap-1.5 font-medium bg-transparent text-white/60 hover:bg-white/10 hover:text-white border-0 px-2"
                            >
                                <X className="w-4 h-4" />
                                <span className="hidden sm:inline">Batal</span>
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}