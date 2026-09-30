'use client'

import { useState } from 'react'
import {
    Bot,
    RefreshCw,
    Loader2,
    Sparkles,
    TrendingUp,
    Lightbulb,
    AlertCircle,
    ShieldCheck,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFinancialFreedom } from '@/lib/hooks/use-financial-freedom'
import { cn } from '@/lib/utils'
import type { FiInsight, FiImprovement } from '@/lib/financial-freedom/types'

type Props = {
    profileId: string
    latestInsight: FiInsight | null
    isFiAchieved?: boolean
}

export function FiAiAdvisor({
    profileId,
    latestInsight,
    isFiAchieved = false,
}: Props) {
    const { saveAiAnalysis } = useFinancialFreedom()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const hasInsight = !!latestInsight?.overall_status

    const generatedAt = latestInsight?.generated_at
        ? new Date(latestInsight.generated_at)
        : null

    async function handleRefresh() {
        setLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/financial-freedom/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })
            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Gagal analisis')
                setLoading(false)
                return
            }

            await saveAiAnalysis(profileId, data.analysis)
            setLoading(false)
        } catch (err: any) {
            setError(err?.message || 'Network error')
            setLoading(false)
        }
    }

    const headerTitle = isFiAchieved
        ? 'AI Advisor: Maintenance Mode'
        : 'AI Financial Advisor'

    const buttonLabel = hasInsight
        ? isFiAchieved
            ? 'Refresh Strategi'
            : 'Refresh'
        : 'Analisis'

    return (
        <Card className="py-0 gap-0 overflow-hidden">
            {/* Header */}
            <div className="relative p-4 sm:p-5 md:p-6 pb-4 border-b border-slate-100 dark:border-white/5">
                <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-brand/10 blur-3xl pointer-events-none" />
                <div className="relative flex items-start justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className="relative shrink-0">
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand to-brand-hover blur-md opacity-30" />
                            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand-hover flex items-center justify-center shadow-lg shadow-brand/30">
                                {isFiAchieved ? (
                                    <ShieldCheck
                                        className="w-5 h-5 text-white"
                                        strokeWidth={2.2}
                                    />
                                ) : (
                                    <Bot className="w-5 h-5 text-white" strokeWidth={2.2} />
                                )}
                            </div>
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold tracking-tight truncate">
                                {headerTitle}
                            </h2>
                            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                                {generatedAt
                                    ? `Terakhir ${generatedAt.toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        timeZone: 'Asia/Jakarta',
                                    })}`
                                    : 'Belum ada analisis'}
                            </p>
                        </div>
                    </div>

                    <Button
                        type="button"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={loading}
                        className="shrink-0 h-9"
                    >
                        {loading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden sm:inline">{buttonLabel}</span>
                        <span className="sm:hidden">
                            {hasInsight ? 'Refresh' : 'Analisis'}
                        </span>
                    </Button>
                </div>
            </div>

            <CardContent className="p-4 sm:p-5 md:p-6">
                {loading && (
                    <div className="flex flex-col items-center justify-center py-8 sm:py-10 text-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-brand/10 flex items-center justify-center mb-3">
                            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-brand animate-pulse" />
                        </div>
                        <p className="text-sm font-semibold mb-1">
                            AI lagi menganalisis...
                        </p>
                        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                            {isFiAchieved
                                ? 'Nyusun strategi maintenance dari data keuangan lu. Butuh 5-10 detik.'
                                : 'Nyusun insight personal dari data keuangan lu. Butuh 5-10 detik.'}
                        </p>
                    </div>
                )}

                {!loading && error && (
                    <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
                            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                        </div>
                        <p className="text-sm font-semibold mb-1">Analisis Gagal</p>
                        <p className="text-xs text-muted-foreground max-w-sm mb-4 leading-relaxed">
                            {error}
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                        >
                            Coba Lagi
                        </Button>
                    </div>
                )}

                {!loading && !error && !hasInsight && (
                    <div className="flex flex-col items-center justify-center py-8 sm:py-10 text-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-brand/10 flex items-center justify-center mb-3">
                            {isFiAchieved ? (
                                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-brand" />
                            ) : (
                                <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-brand" />
                            )}
                        </div>
                        <p className="text-sm font-semibold mb-1">
                            Belum ada analisis
                        </p>
                        <p className="text-xs text-muted-foreground max-w-sm leading-relaxed mb-4">
                            Klik <strong>{buttonLabel}</strong> di atas buat dapet{' '}
                            {isFiAchieved
                                ? 'strategi maintenance dari AI, berdasarkan data kekayaan lu.'
                                : 'saran personal dari AI berdasarkan data FI lu.'}
                        </p>
                    </div>
                )}

                {!loading && !error && hasInsight && (
                    <div className="space-y-4 sm:space-y-5">
                        {/* Overall status */}
                        <div
                            className={cn(
                                'rounded-xl sm:rounded-2xl border p-4',
                                isFiAchieved
                                    ? 'bg-gradient-to-br from-emerald-50 to-emerald-50/30 dark:from-emerald-500/10 dark:to-emerald-500/[0.02] border-emerald-200 dark:border-emerald-500/30'
                                    : 'bg-gradient-to-br from-brand/5 to-transparent border-brand/20'
                            )}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                {isFiAchieved ? (
                                    <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                ) : (
                                    <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-brand shrink-0" />
                                )}
                                <p
                                    className={cn(
                                        'text-[10px] md:text-xs font-bold uppercase tracking-widest',
                                        isFiAchieved
                                            ? 'text-emerald-700 dark:text-emerald-400'
                                            : 'text-brand'
                                    )}
                                >
                                    {isFiAchieved ? 'Status Maintenance' : 'Status Keseluruhan'}
                                </p>
                            </div>
                            <p className="text-sm sm:text-base md:text-[17px] text-slate-700 dark:text-slate-200 leading-relaxed">
                                {latestInsight.overall_status}
                            </p>
                        </div>

                        {/* Flexibility / Savings rate */}
                        {latestInsight.savings_rate_analysis && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-slate-400 shrink-0" />
                                    <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        {isFiAchieved ? 'Fleksibilitas Lu' : 'Savings Rate'}
                                    </p>
                                </div>
                                <p className="text-sm md:text-[15px] text-slate-700 dark:text-slate-200 leading-relaxed">
                                    {latestInsight.savings_rate_analysis}
                                </p>
                            </div>
                        )}

                        {/* Improvements */}
                        {latestInsight.improvements &&
                            latestInsight.improvements.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3 md:mb-4">
                                        <Lightbulb className="w-4 h-4 md:w-5 md:h-5 text-amber-500 shrink-0" />
                                        <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                            {isFiAchieved
                                                ? 'Strategi Mempertahankan'
                                                : 'Yang Bisa Diperbaiki'}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-3">
                                        {latestInsight.improvements.map(
                                            (imp: FiImprovement, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className="rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4 md:p-5 flex flex-col"
                                                >
                                                    <div className="flex items-start gap-3 md:gap-3.5 flex-1">
                                                        <div
                                                            className={cn(
                                                                'w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                                                                isFiAchieved
                                                                    ? 'bg-emerald-500/15'
                                                                    : 'bg-amber-500/15'
                                                            )}
                                                        >
                                                            <span
                                                                className={cn(
                                                                    'text-xs md:text-sm font-bold tabular-nums',
                                                                    isFiAchieved
                                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                                        : 'text-amber-600 dark:text-amber-400'
                                                                )}
                                                            >
                                                                {idx + 1}
                                                            </span>
                                                        </div>
                                                        <div className="min-w-0 flex-1 flex flex-col">
                                                            <p className="text-base md:text-[17px] font-bold mb-1.5 leading-tight">
                                                                {imp.title}
                                                            </p>
                                                            <p className="text-sm md:text-[15px] text-muted-foreground leading-relaxed mb-3 flex-1">
                                                                {imp.description}
                                                            </p>
                                                            <div className="mt-auto">
                                                                <div
                                                                    className={cn(
                                                                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg max-w-full',
                                                                        isFiAchieved
                                                                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                                                            : 'bg-brand/10 text-brand'
                                                                    )}
                                                                >
                                                                    <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                                                                    <span className="text-xs md:text-sm font-bold truncate">
                                                                        {imp.impact_estimate}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                        {/* Next milestone (khusus growth) */}
                        {!isFiAchieved &&
                            latestInsight.next_milestone &&
                            latestInsight.next_milestone !== '-' && (
                                <div className="rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-3.5 md:p-4 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                                            Next Milestone
                                        </p>
                                        <p className="text-sm md:text-base font-bold truncate mt-0.5">
                                            {latestInsight.next_milestone}
                                        </p>
                                    </div>
                                </div>
                            )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}