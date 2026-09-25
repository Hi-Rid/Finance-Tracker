'use client'

import { LayoutGrid, Building2, Bitcoin, LineChart, Coins, ChevronDown } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { InvestmentPosition, AssetType } from '@/lib/investments/types'

type FilterType = 'all' | AssetType

type TypeFilterProps = {
    positions: InvestmentPosition[]
    totalMarketValue: number
    active: FilterType
    onChange: (filter: FilterType) => void
}

const TABS: Array<{
    value: FilterType
    label: string
    icon: any
    color: string
}> = [
        { value: 'all', label: 'Semua', icon: LayoutGrid, color: '#334DAF' },
        { value: 'stock', label: 'Saham', icon: Building2, color: '#334DAF' },
        { value: 'crypto', label: 'Crypto', icon: Bitcoin, color: '#f59e0b' },
        { value: 'mutual_fund', label: 'Reksadana', icon: LineChart, color: '#10b981' },
        { value: 'gold', label: 'Emas', icon: Coins, color: '#eab308' },
    ]

export function TypeFilter({
    positions,
    totalMarketValue,
    active,
    onChange,
}: TypeFilterProps) {
    function getCount(type: FilterType): number {
        if (type === 'all') return positions.length
        return positions.filter((p) => p.asset.type === type).length
    }

    const availableTabs = TABS.filter(
        (t) => t.value === 'all' || getCount(t.value) > 0
    )

    const activeTab = TABS.find((t) => t.value === active) || TABS[0]
    const ActiveIcon = activeTab.icon

    return (
        <>
            {/* ============================================ */}
            {/* MOBILE: Dropdown                              */}
            {/* ============================================ */}
            <div className="md:hidden">
                <Select value={active} onValueChange={(v) => onChange(v as FilterType)}>
                    <SelectTrigger className="w-full h-10 !rounded-full border-slate-200 dark:border-white/15">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div
                                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `${activeTab.color}15` }}
                            >
                                <ActiveIcon
                                    className="w-3 h-3"
                                    style={{ color: activeTab.color }}
                                    strokeWidth={2.4}
                                />
                            </div>
                            <span className="text-sm font-semibold truncate">
                                {activeTab.label}
                            </span>
                            <span className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 shrink-0">
                                {getCount(active)}
                            </span>
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        {availableTabs.map((tab) => {
                            const Icon = tab.icon
                            const count = getCount(tab.value)
                            const isActive = active === tab.value

                            return (
                                <SelectItem key={tab.value} value={tab.value}>
                                    <div className="flex items-center gap-2.5 w-full">
                                        <div
                                            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: `${tab.color}15` }}
                                        >
                                            <Icon
                                                className="w-3 h-3"
                                                style={{ color: tab.color }}
                                                strokeWidth={2.4}
                                            />
                                        </div>
                                        <span className={cn('flex-1', isActive && 'font-semibold')}>
                                            {tab.label}
                                        </span>
                                        <span className="text-xs text-slate-500 tabular-nums">
                                            {count}
                                        </span>
                                    </div>
                                </SelectItem>
                            )
                        })}
                    </SelectContent>
                </Select>
            </div>

            {/* ============================================ */}
            {/* DESKTOP: Pills                                */}
            {/* ============================================ */}
            <div className="hidden md:flex items-center gap-1.5 overflow-x-auto pb-1 -mb-1">
                {availableTabs.map((tab) => {
                    const count = getCount(tab.value)
                    const isActive = active === tab.value
                    const Icon = tab.icon

                    return (
                        <button
                            key={tab.value}
                            type="button"
                            onClick={() => onChange(tab.value)}
                            className={cn(
                                'shrink-0 flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full transition-all cursor-pointer border',
                                isActive
                                    ? 'bg-brand border-brand text-white'
                                    : 'bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/10 hover:border-brand/40 dark:hover:border-brand/40 hover:bg-brand/5 dark:hover:bg-brand/10'
                            )}
                        >
                            <div
                                className={cn(
                                    'w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors',
                                    isActive && 'bg-white/20'
                                )}
                                style={
                                    !isActive ? { backgroundColor: `${tab.color}15` } : undefined
                                }
                            >
                                <Icon
                                    className="w-3.5 h-3.5"
                                    style={!isActive ? { color: tab.color } : undefined}
                                    strokeWidth={2.4}
                                />
                            </div>

                            <span className="text-sm font-semibold whitespace-nowrap">
                                {tab.label}
                            </span>

                            <span
                                className={cn(
                                    'text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full shrink-0 leading-none',
                                    isActive
                                        ? 'bg-white/25 text-white'
                                        : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                                )}
                            >
                                {count}
                            </span>
                        </button>
                    )
                })}
            </div>
        </>
    )
}