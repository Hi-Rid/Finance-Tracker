'use client'

import { useMemo, useState } from 'react'
import { ListChecks, Check, TrendingUp, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useFinancialFreedom } from '@/lib/hooks/use-financial-freedom'
import { cn } from '@/lib/utils'
import type { FiActionStep } from '@/lib/financial-freedom/types'

type Props = {
    steps: FiActionStep[]
}

export function FiActionPlan({ steps }: Props) {
    const { toggleActionStep } = useFinancialFreedom()
    const [pendingId, setPendingId] = useState<string | null>(null)

    const sorted = useMemo(
        () => [...steps].sort((a, b) => a.sort_order - b.sort_order),
        [steps]
    )

    const doneCount = sorted.filter((s) => s.is_done).length
    const total = sorted.length
    const progressPercent = total > 0 ? (doneCount / total) * 100 : 0

    async function handleToggle(step: FiActionStep) {
        setPendingId(step.id)
        await toggleActionStep(step.id, !step.is_done)
        setPendingId(null)
    }

    return (
        <Card className="py-0 gap-0">
            <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="flex items-start justify-between gap-3 mb-5 md:mb-6 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                            <ListChecks className="w-5 h-5 text-brand" />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-bold tracking-tight">
                                Action Plan
                            </h2>
                            <p className="text-xs md:text-sm text-muted-foreground">
                                {total > 0
                                    ? `${doneCount} dari ${total} langkah selesai`
                                    : 'Belum ada action plan'}
                            </p>
                        </div>
                    </div>

                    {total > 0 && (
                        <div className="flex items-center gap-2.5">
                            <div className="w-24 md:w-32 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-brand to-brand-hover transition-all duration-500"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <span className="text-xs md:text-sm font-bold text-brand tabular-nums">
                                {Math.round(progressPercent)}%
                            </span>
                        </div>
                    )}
                </div>

                {total === 0 ? (
                    <div className="py-8 md:py-10 text-center">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <ListChecks className="w-6 h-6 md:w-7 md:h-7 text-slate-400" />
                        </div>
                        <p className="text-sm md:text-base font-semibold mb-1">
                            Action plan masih kosong
                        </p>
                        <p className="text-xs md:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                            Klik <strong>Analisis</strong> di AI Advisor buat generate plan
                            konkret 30-90 hari ke depan.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2.5 md:space-y-3">
                        {sorted.map((step, idx) => {
                            const isPending = pendingId === step.id
                            return (
                                <button
                                    key={step.id}
                                    type="button"
                                    onClick={() => !isPending && handleToggle(step)}
                                    disabled={isPending}
                                    className={cn(
                                        'group w-full text-left rounded-xl sm:rounded-2xl border p-4 md:p-5 transition-all cursor-pointer',
                                        step.is_done
                                            ? 'bg-emerald-50/50 dark:bg-emerald-500/[0.04] border-emerald-200 dark:border-emerald-500/30'
                                            : 'bg-card border-slate-200 dark:border-white/10 hover:border-brand/30',
                                        isPending && 'opacity-60'
                                    )}
                                >
                                    <div className="flex items-start gap-3 md:gap-3.5">
                                        <div
                                            className={cn(
                                                'w-6 h-6 md:w-7 md:h-7 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                                                step.is_done
                                                    ? 'bg-emerald-500 border-emerald-500'
                                                    : 'border-slate-300 dark:border-white/20 group-hover:border-brand/50'
                                            )}
                                        >
                                            {isPending ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                            ) : step.is_done ? (
                                                <Check
                                                    className="w-3.5 h-3.5 text-white"
                                                    strokeWidth={3}
                                                />
                                            ) : null}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2 mb-1.5">
                                                <p
                                                    className={cn(
                                                        'text-sm md:text-base font-bold leading-tight',
                                                        step.is_done &&
                                                        'text-muted-foreground line-through decoration-emerald-500/50'
                                                    )}
                                                >
                                                    {step.title}
                                                </p>
                                                <span
                                                    className={cn(
                                                        'text-[10px] md:text-xs font-bold tabular-nums shrink-0',
                                                        step.is_done
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : 'text-muted-foreground'
                                                    )}
                                                >
                                                    {idx + 1}/{total}
                                                </span>
                                            </div>

                                            {step.description && (
                                                <p
                                                    className={cn(
                                                        'text-xs md:text-sm leading-relaxed mb-2.5 md:mb-3',
                                                        step.is_done
                                                            ? 'text-muted-foreground/70'
                                                            : 'text-muted-foreground'
                                                    )}
                                                >
                                                    {step.description}
                                                </p>
                                            )}

                                            {step.impact_estimate && (
                                                <div
                                                    className={cn(
                                                        'inline-flex items-center gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg',
                                                        step.is_done
                                                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                                            : 'bg-brand/10 text-brand'
                                                    )}
                                                >
                                                    <TrendingUp className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
                                                    <span className="text-[10px] md:text-xs font-bold">
                                                        {step.impact_estimate}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}