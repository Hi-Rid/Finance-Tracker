'use client'

import { useState, useEffect } from 'react'
import { Calendar, ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
    DATE_PRESETS,
    type DateRange,
    type DateRangePreset,
    getDateRangeFromPreset,
} from '@/lib/utils/date-range'

type DateFilterProps = {
    value: DateRange
    onChange: (range: DateRange) => void
    className?: string
    /** Kalau true, trigger-nya full-width (buat di dalam sheet mobile) */
    fullWidth?: boolean
}

function toDateInputValue(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

export function DateFilter({
    value,
    onChange,
    className,
    fullWidth = false,
}: DateFilterProps) {
    const [open, setOpen] = useState(false)
    const [customFrom, setCustomFrom] = useState(
        value.from ? toDateInputValue(value.from) : ''
    )
    const [customTo, setCustomTo] = useState(
        value.to ? toDateInputValue(value.to) : ''
    )

    // Sync custom inputs kalau value di-update dari luar
    useEffect(() => {
        if (value.preset === 'custom') {
            setCustomFrom(value.from ? toDateInputValue(value.from) : '')
            setCustomTo(value.to ? toDateInputValue(value.to) : '')
        }
    }, [value])

    const currentLabel =
        DATE_PRESETS.find((p) => p.value === value.preset)?.label || 'Semua tanggal'

    const isActive = value.preset !== 'all'

    function handlePresetSelect(preset: DateRangePreset) {
        if (preset === 'custom') {
            onChange({ preset: 'custom', from: value.from, to: value.to })
            return
        }
        onChange(getDateRangeFromPreset(preset))
        setOpen(false)
    }

    function handleCustomApply() {
        const from = customFrom ? new Date(customFrom) : null
        const to = customTo ? new Date(customTo) : null
        if (to) to.setHours(23, 59, 59, 999)
        onChange({ preset: 'custom', from, to })
        setOpen(false)
    }

    function handleClear(e: React.MouseEvent) {
        e.stopPropagation()
        e.preventDefault()
        onChange(getDateRangeFromPreset('all'))
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        'date-filter-btn flex items-center justify-between gap-2 h-10 px-3 rounded-lg border text-sm whitespace-nowrap transition-all outline-none cursor-pointer',
                        fullWidth ? 'w-full' : 'shrink-0',
                        'bg-white dark:bg-white/5 border-slate-200 dark:border-white/15',
                        'hover:border-brand/30 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30',
                        className
                    )}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <Calendar className="w-3.5 h-3.5 shrink-0 opacity-50" />
                        <span className="truncate">{currentLabel}</span>
                    </div>
                    {isActive && !fullWidth ? (
                        <span
                            onClick={handleClear}
                            className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer shrink-0"
                        >
                            <X className="w-3 h-3 opacity-60" />
                        </span>
                    ) : (
                        <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-72 p-2 bg-white dark:bg-[#0A1A40] border-slate-200 dark:border-white/15 z-[100]"
                align="end"
            >
                <div className="space-y-0.5">
                    {DATE_PRESETS.map((preset) => (
                        <button
                            key={preset.value}
                            type="button"
                            onClick={() => handlePresetSelect(preset.value)}
                            className={cn(
                                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer',
                                value.preset === preset.value
                                    ? 'bg-brand/10 text-brand font-medium'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                            )}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>

                {value.preset === 'custom' && (
                    <div className="mt-2 pt-3 border-t border-slate-200 dark:border-white/10 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 block">
                                    Dari
                                </label>
                                <Input
                                    type="date"
                                    value={customFrom}
                                    onChange={(e) => setCustomFrom(e.target.value)}
                                    className="h-9 text-xs"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 block">
                                    Sampai
                                </label>
                                <Input
                                    type="date"
                                    value={customTo}
                                    onChange={(e) => setCustomTo(e.target.value)}
                                    className="h-9 text-xs"
                                />
                            </div>
                        </div>
                        <Button
                            type="button"
                            onClick={handleCustomApply}
                            className="w-full h-9"
                            size="sm"
                        >
                            Terapkan
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}