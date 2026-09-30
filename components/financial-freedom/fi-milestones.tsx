'use client'

import { useMemo } from 'react'
import { Trophy, Lock, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Amount } from '@/components/ui/amount'
import { cn } from '@/lib/utils'
import type {
    ResolvedFiParams,
    MilestoneTarget,
} from '@/lib/utils/financial-freedom'
import type { FiMilestoneRow } from '@/lib/financial-freedom/types'

type Props = {
    resolved: ResolvedFiParams
    milestones: FiMilestoneRow[]
}

type MilestoneWithState = MilestoneTarget & {
    achievedAt: string | null
    isAchieved: boolean
    progressPercent: number
}

export function FiMilestones({ resolved, milestones }: Props) {
    const items = useMemo<MilestoneWithState[]>(() => {
        const dbMap = new Map(milestones.map((m) => [m.milestone_type, m]))

        return resolved.allMilestones
            .map((t) => {
                const db = dbMap.get(t.type)
                const isAchieved = resolved.currentNetWorth >= t.target_amount
                const progressPercent =
                    t.target_amount > 0
                        ? Math.min(100, (resolved.currentNetWorth / t.target_amount) * 100)
                        : 0

                return {
                    ...t,
                    achievedAt: db?.achieved_at || null,
                    isAchieved,
                    progressPercent: Math.max(0, progressPercent),
                }
            })
            .sort((a, b) => a.target_amount - b.target_amount)
    }, [resolved.allMilestones, resolved.currentNetWorth, milestones])

    const achievedCount = items.filter((m) => m.isAchieved).length

    function formatAchievedDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'Asia/Jakarta',
        })
    }

    return (
        <Card className="py-0 gap-0">
            <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="flex items-start justify-between gap-3 mb-5 md:mb-6 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                            <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-bold tracking-tight">
                                Pencapaian
                            </h2>
                            <p className="text-xs md:text-sm text-muted-foreground">
                                {achievedCount} dari {items.length} tercapai
                            </p>
                        </div>
                    </div>

                    {achievedCount > 0 && (
                        <div className="px-3.5 py-2 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm md:text-base font-bold tabular-nums">
                            {Math.round((achievedCount / items.length) * 100)}%
                        </div>
                    )}
                </div>

                {items.length === 0 ? (
                    <div className="py-8 md:py-10 text-center">
                        <p className="text-sm md:text-base text-muted-foreground">
                            Target FI belum valid, cek parameter lu.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-4">
                        {items.map((m) => (
                            <div
                                key={m.type}
                                className={cn(
                                    'relative rounded-xl sm:rounded-2xl border-2 p-4 md:p-5 transition-all',
                                    m.isAchieved
                                        ? 'bg-gradient-to-br from-emerald-50 to-emerald-50/30 dark:from-emerald-500/10 dark:to-emerald-500/[0.02] border-emerald-300 dark:border-emerald-500/40'
                                        : 'bg-card border-slate-200 dark:border-white/10'
                                )}
                            >
                                <div className="flex items-start justify-between gap-3 mb-3 md:mb-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div
                                            className={cn(
                                                'w-11 h-11 md:w-12 md:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl md:text-2xl shrink-0',
                                                m.isAchieved
                                                    ? 'bg-emerald-500/20'
                                                    : 'bg-slate-100 dark:bg-white/5'
                                            )}
                                        >
                                            {m.emoji}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-base md:text-[17px] font-bold truncate leading-tight">
                                                {m.label}
                                            </p>
                                            <p className="text-xs md:text-sm text-muted-foreground truncate mt-1 leading-snug">
                                                {m.description}
                                            </p>
                                        </div>
                                    </div>

                                    {m.isAchieved ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    ) : (
                                        <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                                    )}
                                </div>

                                <div className="mb-3">
                                    <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
                                        Target
                                    </p>
                                    <Amount
                                        value={m.target_amount}
                                        className={cn(
                                            'text-lg md:text-xl font-bold tabular-nums',
                                            m.isAchieved
                                                ? 'text-emerald-700 dark:text-emerald-300'
                                                : 'text-slate-900 dark:text-white'
                                        )}
                                    />
                                </div>

                                <div>
                                    <div
                                        className={cn(
                                            'w-full h-2 rounded-full overflow-hidden',
                                            m.isAchieved
                                                ? 'bg-emerald-500/20'
                                                : 'bg-slate-100 dark:bg-white/10'
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'h-full rounded-full transition-all duration-500',
                                                m.isAchieved
                                                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                                    : 'bg-brand'
                                            )}
                                            style={{ width: `${m.progressPercent}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span
                                            className={cn(
                                                'text-xs md:text-sm font-bold tabular-nums',
                                                m.isAchieved
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : 'text-muted-foreground'
                                            )}
                                        >
                                            {m.progressPercent.toFixed(1)}%
                                        </span>
                                        {m.isAchieved && m.achievedAt && (
                                            <span className="text-xs md:text-sm text-muted-foreground tabular-nums">
                                                🎉 {formatAchievedDate(m.achievedAt)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}