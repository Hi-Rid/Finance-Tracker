'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type AnimatedCheckboxProps = {
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    indeterminate?: boolean
    className?: string
    ariaLabel?: string
}

export function AnimatedCheckbox({
    checked,
    onCheckedChange,
    indeterminate = false,
    className,
    ariaLabel,
}: AnimatedCheckboxProps) {
    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            aria-label={ariaLabel}
            onClick={(e) => {
                e.stopPropagation()
                onCheckedChange(!checked)
            }}
            className={cn(
                'relative shrink-0 w-[18px] h-[18px] rounded-[5px] transition-all duration-200 cursor-pointer',
                'flex items-center justify-center',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                checked || indeterminate
                    ? 'bg-brand border-2 border-brand shadow-sm shadow-brand/30'
                    : 'bg-transparent border-2 border-slate-300 dark:border-white/20 hover:border-brand/60 dark:hover:border-brand/60 hover:bg-brand/5 dark:hover:bg-brand/5',
                className
            )}
        >
            <AnimatePresence initial={false} mode="wait">
                {checked && !indeterminate && (
                    <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -45, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
                    >
                        <Check className="w-3 h-3 text-white" strokeWidth={3.5} />
                    </motion.div>
                )}
                {indeterminate && !checked && (
                    <motion.div
                        key="indeterminate"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="w-2 h-[2px] bg-white rounded-full"
                    />
                )}
            </AnimatePresence>
        </button>
    )
}