'use client'

import Link from 'next/link'
import { AlertTriangle, Settings2, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProgressRing } from '@/components/ui/progress-ring'
import { Amount } from '@/components/ui/amount'
import { cn } from '@/lib/utils'
import type { DailyBudgetData } from '@/lib/utils/daily-budget'

type DailyBudgetDesktopCardProps = {
    data: DailyBudgetData
    dateLabel?: string
}

function formatDateToday(): string {
    return new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
    })
}

export function DailyBudgetDesktopCard({
    data,
    dateLabel,
}: DailyBudgetDesktopCardProps) {
    const {
        totalBudget,
        totalSpent,
        percentage,
        remaining,
        items,
        unassignedSpent,
        hasSetup,
    } = data

    const dateStr = dateLabel || formatDateToday()
    const isOver = percentage >= 100

    if (!hasSetup) {
        return (
            <Card className="h-full flex flex-col">
                <CardHeader>
                    <CardTitle>Daily Budget</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{dateStr}</p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                        <Settings2 className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium mb-1">Belum di-set</p>
                        <p className="text-xs text-muted-foreground max-w-[220px]">
                            Setup daily budget untuk mulai tracking pengeluaran harian
                        </p>
                    </div>
                    <Link
                        href="/budget"
                        className={cn(
                            'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                            'bg-brand text-white hover:bg-brand/90'
                        )}
                    >
                        Setup Sekarang
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <div className="flex items-center justify-between gap-2">
                    <CardTitle className={isOver ? 'text-red-600 dark:text-red-400' : ''}>
                        {isOver ? 'Over Budget' : 'Daily Budget'}
                    </CardTitle>
                    {isOver && (
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                    )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{dateStr}</p>
            </CardHeader>
            <CardContent className="flex flex-col items-center flex-1">
                <ProgressRing
                    value={percentage}
                    label="Terpakai"
                    size={160}
                    strokeWidth={14}
                />

                <div className="mt-6 w-full space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Terpakai</span>
                        <Amount
                            value={totalSpent}
                            className="font-semibold"
                        />
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                            {remaining >= 0 ? 'Sisa' : 'Kelebihan'}
                        </span>
                        <Amount
                            value={Math.abs(remaining)}
                            sign={remaining >= 0 ? 'none' : 'negative'}
                            className={cn(
                                'font-semibold',
                                remaining >= 0
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-red-600 dark:text-red-400'
                            )}
                        />
                    </div>
                </div>

                {isOver && (
                    <div className="mt-4 w-full p-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                        <p className="text-xs font-medium text-red-700 dark:text-red-300">
                            Over budget{' '}
                            <Amount value={Math.abs(remaining)} />
                        </p>
                    </div>
                )}

                {(items.length > 0 || unassignedSpent > 0) && (
                    <div className="mt-5 w-full pt-4 border-t border-slate-100 dark:border-white/10 space-y-2.5">
                        {items.map((item, i) => {
                            const rawPercent =
                                item.total > 0 ? (item.spent / item.total) * 100 : 0
                            const itemPercent = Math.min(rawPercent, 100)

                            const itemAccent =
                                rawPercent >= 100
                                    ? 'bg-red-500'
                                    : rawPercent >= 80
                                        ? 'bg-orange-500'
                                        : rawPercent >= 50
                                            ? 'bg-amber-500'
                                            : 'bg-emerald-500'

                            return (
                                <div key={`${item.label}-${i}`}>
                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                        <span className="text-slate-600 dark:text-slate-300 truncate">
                                            {item.label}
                                        </span>
                                        <Amount
                                            value={item.spent}
                                            className="font-medium text-slate-900 dark:text-white shrink-0 ml-2"
                                        />
                                    </div>
                                    <div className="w-full h-1 rounded-full bg-slate-200 dark:bg-white/20 overflow-hidden">
                                        <div
                                            className={cn(
                                                'h-full rounded-full transition-all',
                                                itemAccent
                                            )}
                                            style={{ width: `${itemPercent}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}

                        {unassignedSpent > 0 && (
                            <div>
                                <div className="flex items-center justify-between text-xs mb-1.5">
                                    <span className="text-slate-500 dark:text-slate-400 italic truncate">
                                        Pengeluaran Lain
                                    </span>
                                    <Amount
                                        value={unassignedSpent}
                                        className="font-medium text-slate-600 dark:text-slate-400 shrink-0 ml-2"
                                    />
                                </div>
                                <div className="w-full h-1 rounded-full bg-slate-200 dark:bg-white/20 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-slate-400 dark:bg-white/40"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}