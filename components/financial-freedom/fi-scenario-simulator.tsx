'use client'

import { useMemo } from 'react'
import { Zap, ArrowDown, Sparkles, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Amount } from '@/components/ui/amount'
import {
    computeAllScenarios,
    formatFiDate,
} from '@/lib/utils/financial-freedom'
import { cn } from '@/lib/utils'
import type { ResolvedFiParams } from '@/lib/utils/financial-freedom'

type Props = {
    resolved: ResolvedFiParams
}

const MAX_REASONABLE_SAVINGS_RATE = 80

export function FiScenarioSimulator({ resolved }: Props) {
    const scenarios = useMemo(
        () =>
            computeAllScenarios({
                currentSavingsRate: resolved.savingsRate,
                monthlyIncome: resolved.monthlyIncome,
                currentNetWorth: resolved.currentNetWorth,
                fiMultiplier: resolved.fiMultiplier,
                annualRealReturn: resolved.realReturn,
            }),
        [
            resolved.savingsRate,
            resolved.monthlyIncome,
            resolved.currentNetWorth,
            resolved.fiMultiplier,
            resolved.realReturn,
        ]
    )

    const currentScenario = scenarios.find((s) => s.isCurrent)
    const bestScenario = scenarios[scenarios.length - 1]
    const bestDeltaYears =
        currentScenario?.yearsToFi !== null &&
            currentScenario?.yearsToFi !== undefined &&
            bestScenario?.yearsToFi !== null &&
            bestScenario?.yearsToFi !== undefined
            ? currentScenario.yearsToFi - bestScenario.yearsToFi
            : 0

    const isAlreadyHigh =
        resolved.savingsRate >= MAX_REASONABLE_SAVINGS_RATE

    return (
        <Card className="py-0 gap-0 overflow-hidden">
            <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="flex items-center gap-3 mb-5 md:mb-6">
                    <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-lg md:text-xl font-bold tracking-tight">
                            Simulator Skenario
                        </h2>
                        <p className="text-xs md:text-sm text-muted-foreground">
                            Gimana kalau saving rate lu naik?
                        </p>
                    </div>
                </div>

                {bestDeltaYears > 0.1 && !isAlreadyHigh && (
                    <div className="rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-50 to-amber-50/30 dark:from-amber-500/10 dark:to-amber-500/[0.02] border border-amber-200 dark:border-amber-500/30 p-4 md:p-5 mb-4 md:mb-6 flex gap-3">
                        <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1">
                                Tiap Kenaikan Berarti
                            </p>
                            <p className="text-sm md:text-base text-amber-800 dark:text-amber-200 leading-snug">
                                Kalau lu naikin saving rate ke{' '}
                                <strong>{bestScenario.savingsRate}%</strong>, FI lu bisa{' '}
                                <strong>{bestDeltaYears.toFixed(1)} tahun lebih cepet</strong>.
                            </p>
                        </div>
                    </div>
                )}

                {isAlreadyHigh && (
                    <div className="rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-4 md:p-5 mb-4 md:mb-6 flex gap-3">
                        <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1">
                                Savings Rate Lu Udah Elite
                            </p>
                            <p className="text-sm md:text-base text-emerald-800 dark:text-emerald-200 leading-snug">
                                Di atas {MAX_REASONABLE_SAVINGS_RATE}%, kenaikan lebih lanjut
                                gak realistis. Fokus ke naikin income aja biar makin cepet.
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3 lg:gap-4">
                    {scenarios.map((s, idx) => {
                        const isCurrent = s.isCurrent
                        const prev = idx > 0 ? scenarios[idx - 1] : null
                        const deltaYears =
                            prev?.yearsToFi !== null &&
                                prev?.yearsToFi !== undefined &&
                                s.yearsToFi !== null &&
                                s.yearsToFi !== undefined
                                ? prev.yearsToFi - s.yearsToFi
                                : null

                        const isValidDate = s.yearsToFi !== null && s.yearsToFi > 0.05

                        return (
                            <div
                                key={s.savingsRate}
                                className={cn(
                                    'relative rounded-xl sm:rounded-2xl border-2 p-4 md:p-5 transition-all',
                                    isCurrent
                                        ? 'bg-brand/[0.03] dark:bg-brand/[0.05] border-brand/40 shadow-sm'
                                        : 'bg-card border-slate-200 dark:border-white/10'
                                )}
                            >
                                {isCurrent && (
                                    <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full bg-brand text-white text-[10px] md:text-xs font-bold uppercase tracking-widest">
                                        Saat ini
                                    </div>
                                )}

                                <div className="flex items-baseline gap-1 mb-3 md:mb-4">
                                    <span
                                        className={cn(
                                            'text-3xl md:text-4xl font-bold tabular-nums leading-none',
                                            isCurrent
                                                ? 'text-brand'
                                                : 'text-slate-900 dark:text-white'
                                        )}
                                    >
                                        {s.savingsRate}
                                    </span>
                                    <span className="text-base font-bold text-muted-foreground">
                                        %
                                    </span>
                                </div>

                                <div className="space-y-3 mb-3 md:mb-4">
                                    <div>
                                        <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
                                            Nabung / Bulan
                                        </p>
                                        <Amount
                                            value={s.monthlySaving}
                                            className="text-sm md:text-base font-bold text-slate-900 dark:text-white block break-all"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
                                            Estimasi FI
                                        </p>
                                        <p
                                            className={cn(
                                                'text-sm md:text-base font-bold tabular-nums',
                                                !isValidDate
                                                    ? 'text-slate-400'
                                                    : isCurrent
                                                        ? 'text-brand'
                                                        : 'text-emerald-600 dark:text-emerald-400'
                                            )}
                                        >
                                            {!isValidDate
                                                ? 'Gak realistis'
                                                : formatFiDate(s.fiDate)}
                                        </p>
                                    </div>
                                </div>

                                {isValidDate && (
                                    <div className="pt-3 border-t border-slate-100 dark:border-white/5">
                                        <p className="text-xs md:text-sm text-muted-foreground leading-tight mb-1">
                                            <span className="font-bold text-foreground tabular-nums">
                                                {s.yearsToFi!.toFixed(1)}
                                            </span>{' '}
                                            tahun lagi
                                        </p>
                                        {deltaYears !== null && deltaYears > 0.05 && (
                                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                                <ArrowDown className="w-3 h-3 shrink-0" />
                                                <span className="text-xs md:text-sm font-bold tabular-nums">
                                                    {deltaYears.toFixed(1)} thn lebih cepet
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                <div className="rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-3.5 md:p-4 mt-4 md:mt-6 flex gap-3">
                    <Info className="w-4 h-4 md:w-5 md:h-5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Asumsi: pendapatan tetap, kenaikan saving rate = pemangkasan
                        pengeluaran. Maksimum 80% karena lu butuh minimal 20% income buat
                        hidup.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}