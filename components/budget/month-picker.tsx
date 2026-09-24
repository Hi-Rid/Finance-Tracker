'use client'

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatMonthDisplay, addMonths, getCurrentMonth } from '@/lib/utils/month'
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
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
                className="h-10 w-10 shrink-0"
            >
                <ChevronLeft className="w-4 h-4" />
            </Button>

            <button
                type="button"
                onClick={handleToday}
                className={cn(
                    'flex items-center gap-2 h-10 px-4 rounded-lg border transition-all cursor-pointer',
                    'bg-white dark:bg-white/5 border-slate-200 dark:border-white/15',
                    'hover:border-brand/30 text-sm font-medium',
                    'flex-1 md:flex-initial md:min-w-[200px] justify-center md:justify-start'
                )}
                title={isCurrentMonth ? 'Bulan ini' : 'Klik untuk kembali ke bulan ini'}
            >
                <Calendar className="w-4 h-4 text-brand shrink-0" />
                <span className="text-slate-900 dark:text-white">
                    {formatMonthDisplay(value)}
                </span>
            </button>

            <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                className="h-10 w-10 shrink-0"
            >
                <ChevronRight className="w-4 h-4" />
            </Button>
        </div>
    )
}