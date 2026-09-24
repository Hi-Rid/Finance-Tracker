'use client'

import { useState, useMemo } from 'react'
import { Wallet } from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { NetWorthChart } from '@/components/charts/net-worth-chart'
import { CHART_COLORS } from '@/lib/colors'
import { cn } from '@/lib/utils'

type Range = '3M' | '6M' | '1Y' | 'ALL'

const RANGE_OPTIONS: {
    value: Range
    label: string
    months: number | null
}[] = [
        { value: '3M', label: '3M', months: 3 },
        { value: '6M', label: '6M', months: 6 },
        { value: '1Y', label: '1Y', months: 12 },
        { value: 'ALL', label: 'All', months: null },
    ]

type NetWorthHistoryPoint = {
    month: string
    value: number
}

type NetWorthCardProps = {
    value: number
    trend: number
    history: NetWorthHistoryPoint[]
}

function formatLabel(month: string): string {
    const [y, m] = month.split('-')
    const d = new Date(Number(y), Number(m) - 1, 1)
    const monthShort = d.toLocaleDateString('id-ID', { month: 'short' })
    return `${monthShort} '${y.slice(-2)}`
}

export function NetWorthCard({ value, trend, history }: NetWorthCardProps) {
    const [range, setRange] = useState<Range>('6M')

    const sliced = useMemo(() => {
        const opt = RANGE_OPTIONS.find((o) => o.value === range)
        if (!opt || opt.months === null) {
            return history
        }
        return history.slice(-opt.months)
    }, [range, history])

    const chartData = sliced.map((p) => p.value)
    const chartLabels = sliced.map((p) => formatLabel(p.month))

    const availableMonths = history.length

    const rangePicker = (
        <div className="flex items-center gap-1">
            {RANGE_OPTIONS.map((opt) => {
                const isDisabled = opt.months !== null && opt.months > availableMonths
                const isActive = range === opt.value

                return (
                    <button
                        key={opt.value}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setRange(opt.value)}
                        className={cn(
                            'px-2.5 py-1 rounded-md text-[11px] font-semibold tabular-nums transition-all cursor-pointer',
                            'min-w-[36px]',
                            isActive
                                ? 'bg-brand text-white shadow-sm shadow-brand/30'
                                : isDisabled
                                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                        )}
                    >
                        {opt.label}
                    </button>
                )
            })}
        </div>
    )

    return (
        <StatCard
            title="Net Worth"
            value={value}
            icon={<Wallet className="w-5 h-5" />}
            trend={trend}
            trendLabel="dari bulan lalu"
            accentColor={CHART_COLORS.primary}
            size="large"
            showToggle
            toolbarSlot={rangePicker}
            chartSlot={
                <NetWorthChart
                    data={chartData}
                    labels={chartLabels}
                    height={240}
                />
            }
        />
    )
}