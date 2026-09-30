'use client'

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import {
    formatMonthDisplay,
    getCurrentMonth,
    addMonths,
} from '@/lib/utils/month'
import { cn } from '@/lib/utils'

type MonthPickerProps = {
    value: string
    onChange: (month: string) => void
}

export function MonthPicker({ value, onChange }: MonthPickerProps) {
    const isCurrentMonth = value === getCurrentMonth()

    function handlePrev() {
        onChange(addMonths(value, -1))
    }

    function handleNext() {
        onChange(addMonths(value, 1))
    }

    function handleToday() {
        onChange(getCurrentMonth())
    }

    return (
        <div
            className={cn(
                'inline-flex items-center h-9 rounded-lg border overflow-hidden shrink-0',
                'bg-white dark:bg-white/5',
                'border-slate-200 dark:border-white/10'
            )}
        >
            {/* Prev */}
            <button
                type="button"
                onClick={handlePrev}
                aria-label="Bulan sebelumnya"
                className={cn(
                    'h-full px-2 flex items-center justify-center',
                    'text-slate-500 dark:text-slate-400',
                    'hover:bg-slate-50 dark:hover:bg-white/5',
                    'hover:text-slate-900 dark:hover:text-white',
                    'transition-colors cursor-pointer'
                )}
            >
                <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Label (clickable → balik ke bulan ini) */}
            <button
                type="button"
                onClick={handleToday}
                title={
                    isCurrentMonth
                        ? 'Bulan ini'
                        : 'Klik untuk kembali ke bulan ini'
                }
                className={cn(
                    'flex items-center gap-1.5 px-2.5 h-full transition-colors cursor-pointer',
                    'border-x border-slate-200 dark:border-white/10',
                    !isCurrentMonth && 'bg-brand/5 dark:bg-brand/10'
                )}
            >
                <Calendar className="w-3.5 h-3.5 text-brand shrink-0" />
                <span className="text-xs sm:text-sm font-semibold whitespace-nowrap text-slate-900 dark:text-white">
                    {formatMonthDisplay(value)}
                </span>
            </button>

            {/* Next */}
            <button
                type="button"
                onClick={handleNext}
                aria-label="Bulan berikutnya"
                className={cn(
                    'h-full px-2 flex items-center justify-center',
                    'text-slate-500 dark:text-slate-400',
                    'hover:bg-slate-50 dark:hover:bg-white/5',
                    'hover:text-slate-900 dark:hover:text-white',
                    'transition-colors cursor-pointer'
                )}
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    )
}