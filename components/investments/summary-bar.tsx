'use client'

import { Wallet, TrendingUp, TrendingDown, Briefcase, PieChart, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Amount } from '@/components/ui/amount'
import type { PortfolioSummary } from '@/lib/investments/types'

type SummaryBarProps = {
    summary: PortfolioSummary
}

export function SummaryBar({ summary }: SummaryBarProps) {
    const isProfit = summary.net_pl >= 0

    return (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-card overflow-hidden shadow-sm">
            <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-white/5">
                {/* Total Equity */}
                <div className="relative p-3 md:p-6 overflow-hidden">
                    <div
                        className="hidden md:block absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-[0.07] pointer-events-none"
                        style={{ backgroundColor: '#334DAF' }}
                    />
                    <div className="relative">
                        <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-3">
                            <div className="w-5 h-5 md:w-7 md:h-7 rounded-md md:rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                                <Briefcase className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-brand" />
                            </div>
                            <span className="text-[8px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                                Total Equity
                            </span>
                        </div>
                        <Amount
                            value={summary.total_equity}
                            className="text-base md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight"
                        />
                        <p className="hidden md:block text-[10px] md:text-xs text-muted-foreground mt-1.5">
                            Balance + Portfolio value
                        </p>
                    </div>
                </div>

                {/* Net P/L */}
                <div
                    className={cn(
                        'relative p-3 md:p-6 overflow-hidden',
                        isProfit ? 'bg-emerald-500/[0.03]' : 'bg-red-500/[0.03]'
                    )}
                >
                    <div
                        className={cn(
                            'hidden md:block absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none',
                            isProfit ? 'bg-emerald-500' : 'bg-red-500'
                        )}
                    />
                    <div className="relative">
                        <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-3">
                            <div
                                className={cn(
                                    'w-5 h-5 md:w-7 md:h-7 rounded-md md:rounded-lg flex items-center justify-center shrink-0',
                                    isProfit ? 'bg-emerald-500/10' : 'bg-red-500/10'
                                )}
                            >
                                {isProfit ? (
                                    <TrendingUp className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                    <TrendingDown className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-red-600 dark:text-red-400" />
                                )}
                            </div>
                            <span className="text-[8px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                                Net P/L
                            </span>
                        </div>
                        <Amount
                            value={summary.net_pl}
                            sign={isProfit ? 'positive' : 'negative'}
                            className={cn(
                                'text-base md:text-3xl font-bold tracking-tight leading-tight',
                                isProfit
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-red-600 dark:text-red-400'
                            )}
                        />
                        <p
                            className={cn(
                                'text-[9px] md:text-xs font-semibold tabular-nums mt-0.5 md:mt-1.5',
                                isProfit
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-red-600 dark:text-red-400'
                            )}
                        >
                            {isProfit ? '+' : '−'}
                            {Math.abs(summary.net_pl_percent).toFixed(2)}%
                            <span className="hidden md:inline"> dari modal</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Secondary */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-white/5 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
                <SecondaryMetric
                    icon={Wallet}
                    label="Trading"
                    labelFull="Trading Balance"
                    value={summary.trading_balance}
                />
                <SecondaryMetric
                    icon={PieChart}
                    label="Invested"
                    labelFull="Invested"
                    value={summary.total_invested}
                />
                <SecondaryMetric
                    icon={Activity}
                    label="Positions"
                    labelFull="Positions"
                    value={`${summary.open_positions} aktif`}
                    isCount
                />
            </div>
        </div>
    )
}

function SecondaryMetric({
    icon: Icon,
    label,
    labelFull,
    value,
    isCount = false,
}: {
    icon: any
    label: string
    labelFull: string
    value: number | string
    isCount?: boolean
}) {
    return (
        <div className="px-2 py-2 md:px-4 md:py-4 min-w-0">
            <div className="flex items-center gap-1 md:gap-1.5 mb-0.5 md:mb-1.5">
                <Icon className="w-2.5 h-2.5 md:w-3 md:h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                <p className="text-[8px] md:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                    <span className="md:hidden">{label}</span>
                    <span className="hidden md:inline">{labelFull}</span>
                </p>
            </div>
            {isCount ? (
                <p className="text-[11px] md:text-base font-bold tabular-nums tracking-tight text-slate-900 dark:text-white truncate">
                    {value}
                </p>
            ) : (
                <Amount
                    value={typeof value === 'number' ? value : Number(value)}
                    className="text-[11px] md:text-base font-bold tracking-tight text-slate-900 dark:text-white truncate"
                />
            )}
        </div>
    )
}