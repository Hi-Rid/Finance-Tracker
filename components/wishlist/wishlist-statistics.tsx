'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
    ArrowLeft,
    ShoppingBag,
    Ban,
    PiggyBank,
    Sparkles,
    Clock,
    Tag,
    Trophy,
    BarChart3,
    Info,
    TrendingDown,
    TrendingUp,
    ChevronRight,
} from 'lucide-react'
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Amount } from '@/components/ui/amount'
import { HideAmountsButton } from '@/components/shared/hide-amounts-button'
import { WishlistImage } from './wishlist-image'
import {
    computeSummary,
    computeTrend,
    computeMoodPattern,
    computeDecisionStats,
    computeCoolingOffStats,
    computeCategoryStats,
    computeHourPattern,
    computeTopWins,
    filterByPeriod,
    getMoodInsight,
    type PeriodFilter,
} from '@/lib/utils/wishlist-stats'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Wishlist = Database['public']['Tables']['wishlists']['Row']

type Props = {
    wishlists: Wishlist[]
}

const PERIODS: { value: PeriodFilter; label: string; short: string }[] = [
    { value: '3m', label: '3 Bulan', short: '3M' },
    { value: '6m', label: '6 Bulan', short: '6M' },
    { value: '1y', label: '1 Tahun', short: '1Y' },
    { value: 'all', label: 'Semua', short: 'All' },
]

// ============================================================
// ROOT
// ============================================================

export function WishlistStatistics({ wishlists }: Props) {
    const [period, setPeriod] = useState<PeriodFilter>('3m')

    const filtered = useMemo(
        () => filterByPeriod(wishlists, period),
        [wishlists, period]
    )

    const summary = useMemo(() => computeSummary(filtered), [filtered])
    const trend = useMemo(() => computeTrend(filtered, 6), [filtered])
    const moodStats = useMemo(() => computeMoodPattern(filtered), [filtered])
    const decisionStats = useMemo(() => computeDecisionStats(filtered), [filtered])
    const coolingStats = useMemo(() => computeCoolingOffStats(filtered), [filtered])
    const categoryStats = useMemo(() => computeCategoryStats(filtered), [filtered])
    const hourStats = useMemo(() => computeHourPattern(filtered), [filtered])
    const topWins = useMemo(() => computeTopWins(filtered, 5), [filtered])

    const moodInsight = useMemo(() => getMoodInsight(moodStats), [moodStats])

    const hasEnoughData = filtered.length >= 3

    return (
        <div className="max-w-4xl mx-auto">
            {/* ============ TOP BAR ============ */}
            <div className="flex items-center justify-between gap-2 mb-6">
                <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="text-muted-foreground hover:text-foreground -ml-2"
                >
                    <Link href="/wishlist">
                        <ArrowLeft className="w-4 h-4" />
                        Wishlist
                    </Link>
                </Button>
            </div>

            {/* ============ TITLE + FILTER ============ */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">
                        Statistik Wishlist
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        Insight kebiasaan belanja lu dari data
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-end">
                    <HideAmountsButton size="icon-sm" />
                    <PeriodFilter value={period} onChange={setPeriod} />
                </div>
            </div>

            {!hasEnoughData ? (
                <EmptyStatistics />
            ) : (
                <div className="space-y-5 md:space-y-6">
                    <HeroSummary summary={summary} />
                    <MetricGrid summary={summary} />

                    <Section
                        title="Trend Bulanan"
                        description="Masuk · Dibeli · Dibatalkan"
                        icon={TrendingUp}
                    >
                        <TrendChart data={trend} />
                    </Section>

                    <Section
                        title="Efektivitas Decision Check"
                        description="Seberapa akurat penilaian lu"
                        icon={Sparkles}
                    >
                        <DecisionEffectiveness stats={decisionStats} />
                    </Section>

                    {coolingStats.hasData && (
                        <Section
                            title="Efektivitas Cooling-off"
                            description="Waktu rata-rata sampai memutuskan"
                            icon={Clock}
                        >
                            <CoolingOffEffectiveness stats={coolingStats} />
                        </Section>
                    )}

                    {categoryStats.length > 0 && (
                        <Section
                            title="Kategori Rawan Impulse"
                            description="Paling sering dibatalkan"
                            icon={Tag}
                        >
                            <CategoryBreakdown stats={categoryStats} />
                        </Section>
                    )}

                    <Section
                        title="Jam Rawan Wishlist"
                        description="Kapan biasanya lu nambahin"
                        icon={Clock}
                    >
                        <HourPattern stats={hourStats} />
                    </Section>

                    {topWins.length > 0 && <TopWinsSection wins={topWins} />}

                    {moodStats.length > 0 && (
                        <Section
                            title="Pattern Mood"
                            description="Korelasi mood dan keputusan"
                            icon={Sparkles}
                        >
                            <MoodPattern stats={moodStats} insight={moodInsight} />
                        </Section>
                    )}
                </div>
            )}
        </div>
    )
}

// ============================================================
// PERIOD FILTER
// ============================================================

function PeriodFilter({
    value,
    onChange,
}: {
    value: PeriodFilter
    onChange: (v: PeriodFilter) => void
}) {
    return (
        <div className="relative flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-white/5 shrink-0 w-fit">
            {PERIODS.map((p) => {
                const active = value === p.value
                return (
                    <button
                        key={p.value}
                        type="button"
                        onClick={() => onChange(p.value)}
                        className={cn(
                            'relative px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer',
                            active
                                ? 'bg-white dark:bg-white/10 text-brand shadow-sm shadow-brand/10'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        )}
                    >
                        <span className="hidden sm:inline">{p.label}</span>
                        <span className="sm:hidden">{p.short}</span>
                    </button>
                )
            })}
        </div>
    )
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyStatistics() {
    return (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-gradient-to-br from-slate-50/50 to-card dark:from-white/[0.02] dark:to-card p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-7 h-7 text-brand" />
            </div>
            <p className="text-base font-bold mb-1">Belum cukup data</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Tambah minimal 3 wishlist di periode ini buat lihat statistik.
                Data lebih banyak = insight lebih akurat.
            </p>
        </div>
    )
}

// ============================================================
// HERO SUMMARY - dashed border brand
// ============================================================

function HeroSummary({
    summary,
}: {
    summary: ReturnType<typeof computeSummary>
}) {
    return (
        <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-brand/40 bg-brand/[0.03] dark:bg-brand/[0.05] p-6 md:p-8">
            {/* Decorative blob */}
            <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-brand/10 blur-3xl pointer-events-none" />

            <div className="relative">
                <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-brand/15 flex items-center justify-center">
                        <TrendingDown className="w-4 h-4 text-brand" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-brand uppercase tracking-widest leading-none mb-0.5">
                            Uang Berhasil Ditahan
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-none">
                            dari wishlist yang lu cancel
                        </p>
                    </div>
                </div>

                <Amount
                    value={summary.totalHeld}
                    className="text-4xl md:text-5xl font-bold tracking-tight text-brand block mb-4 tabular-nums"
                />

                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Kamu hemat{' '}
                        <span className="font-bold text-foreground">
                            {summary.cancelled} wishlist
                        </span>{' '}
                        dari impulse buying
                    </p>
                </div>
            </div>
        </div>
    )
}

// ============================================================
// METRIC GRID
// ============================================================

function MetricGrid({
    summary,
}: {
    summary: ReturnType<typeof computeSummary>
}) {
    const metrics = [
        {
            label: 'Total',
            value: summary.total,
            percent: 100,
            icon: Sparkles,
            color: '#334DAF',
            track: 'bg-brand/15',
        },
        {
            label: 'Dibeli',
            value: summary.purchased,
            percent: summary.purchasedPercent,
            icon: ShoppingBag,
            color: '#10b981',
            track: 'bg-emerald-500/15',
        },
        {
            label: 'Cancel',
            value: summary.cancelled,
            percent: summary.cancelledPercent,
            icon: Ban,
            color: '#ef4444',
            track: 'bg-red-500/15',
        },
        {
            label: 'Aktif',
            value: summary.active,
            percent: summary.activePercent,
            icon: PiggyBank,
            color: '#f59e0b',
            track: 'bg-amber-500/15',
        },
    ]

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {metrics.map((m) => {
                const Icon = m.icon
                return (
                    <div
                        key={m.label}
                        className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-white/10 bg-card p-4 transition-all hover:border-brand/30 hover:shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: `${m.color}15` }}
                            >
                                <Icon className="w-4 h-4" style={{ color: m.color }} />
                            </div>
                            <span
                                className="text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-full"
                                style={{
                                    color: m.color,
                                    backgroundColor: `${m.color}12`,
                                }}
                            >
                                {Math.round(m.percent)}%
                            </span>
                        </div>

                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            {m.label}
                        </p>
                        <p className="text-2xl md:text-3xl font-bold tabular-nums leading-none mb-3">
                            {m.value}
                        </p>

                        <div className={cn('w-full h-1 rounded-full overflow-hidden', m.track)}>
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${Math.min(m.percent, 100)}%`,
                                    backgroundColor: m.color,
                                }}
                            />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ============================================================
// SECTION WRAPPER
// ============================================================

function Section({
    title,
    description,
    icon: Icon,
    children,
    accent,
}: {
    title: string
    description?: string
    icon: any
    children: React.ReactNode
    accent?: string
}) {
    return (
        <div className="rounded-3xl border border-slate-200/60 dark:border-white/10 bg-card overflow-hidden">
            <div className="p-5 md:p-6 pb-4">
                <div className="flex items-center gap-3">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={
                            accent
                                ? {
                                    backgroundColor: `${accent}15`,
                                    color: accent,
                                }
                                : {
                                    backgroundColor: 'rgba(51, 77, 175, 0.08)',
                                    color: '#334DAF',
                                }
                        }
                    >
                        <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-sm md:text-base font-bold tracking-tight truncate">
                            {title}
                        </h2>
                        {description && (
                            <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5 truncate">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
            </div>
            <div className="px-5 md:px-6 pb-5 md:pb-6">{children}</div>
        </div>
    )
}

// ============================================================
// TREND CHART
// ============================================================

function TrendChart({ data }: { data: ReturnType<typeof computeTrend> }) {
    const chartData = data.map((d) => ({
        label: d.label,
        Masuk: d.masuk,
        Dibeli: d.dibeli,
        Cancel: d.cancelled,
    }))

    return (
        <div>
            <div className="w-full h-[240px] md:h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 8, left: -24, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="gradMasuk" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#334DAF" stopOpacity={0.35} />
                                <stop offset="100%" stopColor="#334DAF" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradDibeli" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradCancel" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.28} />
                                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="currentColor"
                            className="text-slate-200 dark:text-white/5"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="label"
                            stroke="currentColor"
                            className="text-slate-400 dark:text-slate-500"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            dy={8}
                        />
                        <YAxis
                            stroke="currentColor"
                            className="text-slate-400 dark:text-slate-500"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                            width={32}
                        />
                        <Tooltip
                            cursor={{
                                stroke: 'var(--color-border)',
                                strokeWidth: 1,
                                strokeDasharray: '3 3',
                            }}
                            contentStyle={{
                                backgroundColor: 'var(--color-card)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '14px',
                                fontSize: '12px',
                                padding: '10px 14px',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                            }}
                            labelStyle={{
                                fontWeight: 700,
                                marginBottom: 6,
                                fontSize: '11px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                            itemStyle={{ fontWeight: 600, padding: '2px 0' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="Masuk"
                            stroke="#334DAF"
                            strokeWidth={2.5}
                            fill="url(#gradMasuk)"
                            dot={{
                                r: 3.5,
                                strokeWidth: 2,
                                fill: 'var(--color-card)',
                            }}
                            activeDot={{ r: 6, strokeWidth: 2 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="Dibeli"
                            stroke="#10b981"
                            strokeWidth={2.5}
                            fill="url(#gradDibeli)"
                            dot={{
                                r: 3.5,
                                strokeWidth: 2,
                                fill: 'var(--color-card)',
                            }}
                            activeDot={{ r: 6, strokeWidth: 2 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="Cancel"
                            stroke="#ef4444"
                            strokeWidth={2.5}
                            fill="url(#gradCancel)"
                            dot={{
                                r: 3.5,
                                strokeWidth: 2,
                                fill: 'var(--color-card)',
                            }}
                            activeDot={{ r: 6, strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-5 mt-5 flex-wrap">
                <LegendDot color="#334DAF" label="Masuk" />
                <LegendDot color="#10b981" label="Dibeli" />
                <LegendDot color="#ef4444" label="Cancel" />
            </div>
        </div>
    )
}

function LegendDot({ color, label }: { color: string; label: string }) {
    return (
        <div className="flex items-center gap-2">
            <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
            />
            <span className="text-xs text-muted-foreground font-medium">
                {label}
            </span>
        </div>
    )
}

// ============================================================
// MOOD PATTERN
// ============================================================

const MOOD_COLORS: Record<string, string> = {
    happy: '#10b981',
    excited: '#f59e0b',
    neutral: '#64748b',
    bored: '#a855f7',
    stressed: '#ef4444',
    sad: '#0ea5e9',
}

function MoodPattern({
    stats,
    insight,
}: {
    stats: ReturnType<typeof computeMoodPattern>
    insight: string | null
}) {
    const maxTotal = Math.max(...stats.map((s) => s.total), 1)

    return (
        <div className="space-y-5">
            {insight && (
                <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-amber-50/50 dark:from-amber-500/10 dark:to-amber-500/[0.02] border border-amber-200 dark:border-amber-500/30 p-4 flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1">
                            Insight
                        </p>
                        <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                            {insight}
                        </p>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {stats.map((s) => {
                    const totalWidth = (s.total / maxTotal) * 100
                    const purchasedPct =
                        s.total > 0 ? (s.purchased / s.total) * 100 : 0
                    const cancelledPct =
                        s.total > 0 ? (s.cancelled / s.total) * 100 : 0
                    const activePct =
                        s.total > 0 ? (s.active / s.total) * 100 : 0
                    const moodColor = MOOD_COLORS[s.mood] || '#64748b'

                    return (
                        <div key={s.mood}>
                            <div className="flex items-center justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                                        style={{ backgroundColor: `${moodColor}18` }}
                                    >
                                        {s.emoji}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold truncate leading-tight">
                                            {s.label}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
                                            {s.total} wishlist
                                        </p>
                                    </div>
                                </div>
                                {s.purchased + s.cancelled > 0 && (
                                    <div className="shrink-0 text-right">
                                        <p
                                            className={cn(
                                                'text-sm font-bold tabular-nums leading-none',
                                                s.cancelRate >= 60
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : s.cancelRate >= 30
                                                        ? 'text-amber-600 dark:text-amber-400'
                                                        : 'text-emerald-600 dark:text-emerald-400'
                                            )}
                                        >
                                            {Math.round(s.cancelRate)}%
                                        </p>
                                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">
                                            cancel
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div
                                className="h-2.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden flex"
                                style={{ width: `${totalWidth}%` }}
                            >
                                {purchasedPct > 0 && (
                                    <div
                                        className="h-full bg-emerald-500 transition-all"
                                        style={{ width: `${purchasedPct}%` }}
                                    />
                                )}
                                {cancelledPct > 0 && (
                                    <div
                                        className="h-full bg-red-500 transition-all"
                                        style={{ width: `${cancelledPct}%` }}
                                    />
                                )}
                                {activePct > 0 && (
                                    <div
                                        className="h-full bg-amber-400 transition-all"
                                        style={{ width: `${activePct}%` }}
                                    />
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="flex items-center justify-center gap-5 pt-2 flex-wrap">
                <LegendDot color="#10b981" label="Dibeli" />
                <LegendDot color="#ef4444" label="Cancel" />
                <LegendDot color="#f59e0b" label="Aktif" />
            </div>
        </div>
    )
}

// ============================================================
// DECISION EFFECTIVENESS
// ============================================================

function DecisionEffectiveness({
    stats,
}: {
    stats: ReturnType<typeof computeDecisionStats>
}) {
    if (!stats.hasData) {
        return (
            <div className="rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-5 h-5 text-brand" />
                </div>
                <p className="text-sm font-bold mb-1">Belum ada data</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Isi Decision Check di detail wishlist biar bisa lihat seberapa akurat penilaian lu.
                </p>
            </div>
        )
    }

    const totalDecided =
        stats.worthIt.purchased +
        stats.worthIt.cancelled +
        stats.consider.purchased +
        stats.consider.cancelled +
        stats.skip.purchased +
        stats.skip.cancelled

    const avgPercent = (stats.avgScore / 30) * 100

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
                <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-white/10 bg-gradient-to-br from-brand/5 to-transparent p-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                        Skor Rata-rata
                    </p>
                    <div className="flex items-baseline gap-1 mb-3">
                        <span className="text-3xl font-bold tabular-nums text-brand leading-none">
                            {stats.avgScore.toFixed(1)}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                            /30
                        </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-brand/15 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-brand to-brand/70"
                            style={{ width: `${avgPercent}%` }}
                        />
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-card p-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                        Total Dinilai
                    </p>
                    <p className="text-3xl font-bold tabular-nums leading-none mb-3">
                        {stats.totalWithDecision}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                        wishlist udah di-decision check
                    </p>
                </div>
            </div>

            {totalDecided >= 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <AccuracyCard
                        label="Akurasi Worth It"
                        value={stats.accuracy}
                        description="Skor tinggi (≥24) yang beneran dibeli"
                        variant={stats.accuracy >= 60 ? 'success' : 'warning'}
                    />
                    <AccuracyCard
                        label="Rasio Ignore"
                        value={stats.ignoreRate}
                        description="Skor rendah (<18) yang tetap dibeli"
                        variant={stats.ignoreRate >= 40 ? 'danger' : 'success'}
                    />
                </div>
            )}

            <div className="space-y-2.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Breakdown Skor
                </p>
                <ScoreBucket
                    emoji="🟢"
                    label="Worth It"
                    range="24-30"
                    {...stats.worthIt}
                    color="#10b981"
                />
                <ScoreBucket
                    emoji="🟡"
                    label="Pertimbangkan"
                    range="18-23"
                    {...stats.consider}
                    color="#f59e0b"
                />
                <ScoreBucket
                    emoji="🔴"
                    label="Skip"
                    range="<18"
                    {...stats.skip}
                    color="#ef4444"
                />
            </div>
        </div>
    )
}

function AccuracyCard({
    label,
    value,
    description,
    variant,
}: {
    label: string
    value: number
    description: string
    variant: 'success' | 'warning' | 'danger'
}) {
    const colorMap = {
        success: {
            text: 'text-emerald-600 dark:text-emerald-400',
            bg: 'from-emerald-500/10 to-emerald-500/[0.02]',
            border: 'border-emerald-500/20',
            bar: 'bg-emerald-500',
        },
        warning: {
            text: 'text-amber-600 dark:text-amber-400',
            bg: 'from-amber-500/10 to-amber-500/[0.02]',
            border: 'border-amber-500/20',
            bar: 'bg-amber-500',
        },
        danger: {
            text: 'text-red-600 dark:text-red-400',
            bg: 'from-red-500/10 to-red-500/[0.02]',
            border: 'border-red-500/20',
            bar: 'bg-red-500',
        },
    }
    const c = colorMap[variant]

    return (
        <div
            className={cn(
                'rounded-2xl border bg-gradient-to-br p-4',
                c.bg,
                c.border
            )}
        >
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                {label}
            </p>
            <p className={cn('text-3xl font-bold tabular-nums leading-none mb-3', c.text)}>
                {Math.round(value)}%
            </p>
            <div className="w-full h-1.5 rounded-full bg-slate-200/50 dark:bg-white/10 overflow-hidden mb-2">
                <div
                    className={cn('h-full rounded-full transition-all duration-500', c.bar)}
                    style={{ width: `${Math.min(value, 100)}%` }}
                />
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
                {description}
            </p>
        </div>
    )
}

function ScoreBucket({
    emoji,
    label,
    range,
    purchased,
    cancelled,
    active,
    color,
}: {
    emoji: string
    label: string
    range: string
    purchased: number
    cancelled: number
    active: number
    color: string
}) {
    const total = purchased + cancelled + active
    if (total === 0) return null

    return (
        <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-card p-3.5 transition-all hover:border-brand/30">
            <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg shrink-0">{emoji}</span>
                    <div className="min-w-0">
                        <p className="text-sm font-bold truncate leading-tight">
                            {label}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                            Skor {range}
                        </p>
                    </div>
                </div>
                <div
                    className="px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums shrink-0"
                    style={{
                        color,
                        backgroundColor: `${color}15`,
                    }}
                >
                    {total}
                </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] flex-wrap">
                {purchased > 0 && (
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <ShoppingBag className="w-3 h-3" />
                        {purchased}
                    </span>
                )}
                {cancelled > 0 && (
                    <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-semibold">
                        <Ban className="w-3 h-3" />
                        {cancelled}
                    </span>
                )}
                {active > 0 && (
                    <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                        <PiggyBank className="w-3 h-3" />
                        {active}
                    </span>
                )}
            </div>
        </div>
    )
}

// ============================================================
// COOLING-OFF EFFECTIVENESS
// ============================================================

function CoolingOffEffectiveness({
    stats,
}: {
    stats: ReturnType<typeof computeCoolingOffStats>
}) {
    return (
        <div className="space-y-5">
            <div className="rounded-2xl bg-gradient-to-br from-brand/5 to-transparent border border-brand/20 p-4">
                <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl md:text-5xl font-bold tabular-nums text-brand leading-none">
                        {stats.avgDays.toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-foreground font-medium pb-1">
                        hari rata-rata
                    </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Dari bikin wishlist sampai memutuskan (beli/cancel)
                </p>
            </div>

            <div className="space-y-3">
                {stats.buckets.map((b) => (
                    <div key={b.label}>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-xs font-semibold">{b.label}</span>
                            <span className="text-[11px] text-muted-foreground tabular-nums font-medium">
                                {b.count}{' '}
                                <span className="opacity-60">
                                    ({Math.round(b.percent)}%)
                                </span>
                            </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-brand to-brand/70 transition-all duration-700"
                                style={{ width: `${b.percent}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {stats.speedup > 0 && (
                <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-500/10 dark:to-emerald-500/[0.02] border border-emerald-200 dark:border-emerald-500/30 p-4 flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                        <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1">
                            Bagus!
                        </p>
                        <p className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
                            <span className="font-bold">
                                {Math.round(stats.speedup)}%
                            </span>{' '}
                            cancel terjadi dalam 3 hari pertama. Cooling-off lu
                            efektif nyaring impulse.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

// ============================================================
// CATEGORY BREAKDOWN
// ============================================================

function CategoryBreakdown({
    stats,
}: {
    stats: ReturnType<typeof computeCategoryStats>
}) {
    const top = stats.slice(0, 8)

    return (
        <div className="space-y-3">
            {top.map((s) => {
                const purchasedPct =
                    s.total > 0 ? (s.purchased / s.total) * 100 : 0
                const cancelledPct =
                    s.total > 0 ? (s.cancelled / s.total) * 100 : 0

                return (
                    <div key={s.category}>
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-sm font-semibold truncate">
                                {s.label}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] text-muted-foreground tabular-nums">
                                    {s.total}
                                </span>
                                <span
                                    className={cn(
                                        'text-xs font-bold tabular-nums px-2 py-0.5 rounded-md',
                                        s.cancelRate >= 60
                                            ? 'text-red-600 dark:text-red-400 bg-red-500/10'
                                            : s.cancelRate >= 30
                                                ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
                                                : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                                    )}
                                >
                                    {Math.round(s.cancelRate)}%
                                </span>
                            </div>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden flex">
                            {purchasedPct > 0 && (
                                <div
                                    className="h-full bg-emerald-500"
                                    style={{ width: `${purchasedPct}%` }}
                                />
                            )}
                            {cancelledPct > 0 && (
                                <div
                                    className="h-full bg-red-500"
                                    style={{ width: `${cancelledPct}%` }}
                                />
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ============================================================
// HOUR PATTERN
// ============================================================

function HourPattern({
    stats,
}: {
    stats: ReturnType<typeof computeHourPattern>
}) {
    const totalCount = stats.reduce((sum, s) => sum + s.count, 0)

    // Peak hour
    const peakHour = stats.reduce(
        (max, s) => (s.count > max.count ? s : max),
        stats[0]
    )

    // 4 time blocks
    const timeBlocks = [
        {
            label: 'Pagi',
            range: '05-11',
            icon: '🌅',
            count: stats
                .filter((s) => s.hour >= 5 && s.hour < 11)
                .reduce((sum, s) => sum + s.count, 0),
            color: '#f59e0b',
        },
        {
            label: 'Siang',
            range: '11-15',
            icon: '☀️',
            count: stats
                .filter((s) => s.hour >= 11 && s.hour < 15)
                .reduce((sum, s) => sum + s.count, 0),
            color: '#0ea5e9',
        },
        {
            label: 'Sore',
            range: '15-19',
            icon: '🌆',
            count: stats
                .filter((s) => s.hour >= 15 && s.hour < 19)
                .reduce((sum, s) => sum + s.count, 0),
            color: '#a855f7',
        },
        {
            label: 'Malam',
            range: '19-05',
            icon: '🌙',
            count: stats
                .filter((s) => s.hour >= 19 || s.hour < 5)
                .reduce((sum, s) => sum + s.count, 0),
            color: '#334DAF',
        },
    ]

    const nightCount = stats
        .filter((s) => s.isNight)
        .reduce((sum, s) => sum + s.count, 0)
    const nightPercent =
        totalCount > 0 ? (nightCount / totalCount) * 100 : 0

    const blockMax = Math.max(...timeBlocks.map((b) => b.count), 1)
    const dominantBlock = timeBlocks.reduce(
        (max, b) => (b.count > max.count ? b : max),
        timeBlocks[0]
    )

    // Grouped per 2 jam untuk chart
    const grouped = []
    for (let i = 0; i < 24; i += 2) {
        grouped.push({
            hour: i,
            label: `${i.toString().padStart(2, '0')}`,
            count: stats[i].count + (stats[i + 1]?.count || 0),
            isNight: stats[i].isNight || stats[i + 1]?.isNight,
        })
    }
    const maxGrouped = Math.max(...grouped.map((g) => g.count), 1)

    return (
        <div className="space-y-5">
            {/* ============ PEAK INSIGHT ============ */}
            {totalCount > 0 && peakHour.count > 0 && (
                <div className="rounded-2xl bg-gradient-to-br from-brand/5 via-brand/[0.02] to-transparent border border-brand/20 p-4 flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center shrink-0 text-base">
                        ⏰
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-brand uppercase tracking-widest mb-1">
                            Peak Hour
                        </p>
                        <p className="text-sm font-bold text-foreground leading-snug mb-1">
                            Jam{' '}
                            <span className="text-brand">
                                {peakHour.hour.toString().padStart(2, '0')}:00
                            </span>{' '}
                            paling rawan
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {peakHour.count} wishlist dibuat di jam ini.
                            {peakHour.isNight && (
                                <span className="ml-1 font-semibold text-purple-600 dark:text-purple-400">
                                    Night impulse detected 🌙
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            )}

            {/* ============ TIME BLOCKS BREAKDOWN ============ */}
            <div className="grid grid-cols-4 gap-2">
                {timeBlocks.map((b) => {
                    const percent = (b.count / blockMax) * 100
                    const isDominant =
                        b.label === dominantBlock.label && b.count > 0

                    return (
                        <div
                            key={b.label}
                            className={cn(
                                'rounded-xl border p-3 transition-all',
                                isDominant
                                    ? 'border-brand/30 bg-brand/[0.03]'
                                    : 'border-slate-200/60 dark:border-white/10 bg-card'
                            )}
                        >
                            <div className="flex items-center gap-1 mb-2">
                                <span className="text-sm">{b.icon}</span>
                                {isDominant && (
                                    <span className="text-[8px] font-bold text-brand uppercase tracking-wider px-1 py-0.5 rounded bg-brand/10">
                                        Top
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                                {b.label}
                            </p>
                            <p className="text-[9px] text-muted-foreground/70 tabular-nums mb-2">
                                {b.range}
                            </p>
                            <p className="text-lg font-bold tabular-nums leading-none mb-2">
                                {b.count}
                            </p>
                            <div className="w-full h-1 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${percent}%`,
                                        backgroundColor: b.color,
                                    }}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* ============ NIGHT IMPULSE WARNING ============ */}
            {nightPercent > 30 && (
                <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-50/50 dark:from-purple-500/10 dark:to-purple-500/[0.02] border border-purple-200 dark:border-purple-500/30 p-4 flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0 text-base">
                        🌙
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-widest mb-1">
                            Night Impulse
                        </p>
                        <p className="text-xs text-purple-800 dark:text-purple-200 leading-relaxed">
                            <span className="font-bold">
                                {Math.round(nightPercent)}%
                            </span>{' '}
                            ({nightCount} dari {totalCount}) wishlist
                            ditambahin di malam hari (22:00-05:00). Coba tunda
                            sampai besok pagi sebelum eksekusi.
                        </p>
                    </div>
                </div>
            )}

            {/* ============ DETAIL CHART ============ */}
            <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01] p-4">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Distribusi Per 2 Jam
                    </p>
                    <p className="text-[10px] text-muted-foreground tabular-nums">
                        Total {totalCount}
                    </p>
                </div>

                <div className="w-full h-[180px] md:h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={grouped.map((g) => ({
                                label: g.label,
                                count: g.count,
                                isNight: g.isNight,
                            }))}
                            margin={{ top: 8, right: 0, left: -28, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="barDay" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#334DAF" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#334DAF" stopOpacity={0.7} />
                                </linearGradient>
                                <linearGradient id="barNight" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#a855f7" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0.7} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="currentColor"
                                className="text-slate-200 dark:text-white/5"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="label"
                                stroke="currentColor"
                                className="text-slate-400 dark:text-slate-500"
                                fontSize={9}
                                tickLine={false}
                                axisLine={false}
                                dy={6}
                                interval={0}
                            />
                            <YAxis
                                stroke="currentColor"
                                className="text-slate-400 dark:text-slate-500"
                                fontSize={9}
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                                width={28}
                            />
                            <Tooltip
                                cursor={{
                                    fill: 'var(--color-muted)',
                                    opacity: 0.3,
                                    radius: 8,
                                }}
                                contentStyle={{
                                    backgroundColor: 'var(--color-card)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    padding: '8px 12px',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                                }}
                                labelStyle={{
                                    fontWeight: 700,
                                    marginBottom: 4,
                                    fontSize: '10px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}
                                formatter={(value: number, _: any, props: any) => [
                                    `${value} wishlist`,
                                    props.payload.isNight ? '🌙 Malam' : '☀️ Siang',
                                ]}
                                labelFormatter={(label) =>
                                    `Jam ${label}:00 - ${(parseInt(label) + 2).toString().padStart(2, '0')}:00`
                                }
                            />
                            <Bar
                                dataKey="count"
                                radius={[6, 6, 0, 0]}
                                maxBarSize={32}
                                shape={(props: any) => {
                                    const { x, y, width, height, payload } = props
                                    const fill = payload.isNight
                                        ? 'url(#barNight)'
                                        : 'url(#barDay)'

                                    return (
                                        <rect
                                            x={x}
                                            y={y}
                                            width={width}
                                            height={height}
                                            fill={fill}
                                            rx={6}
                                            ry={6}
                                        />
                                    )
                                }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-5 pt-3 mt-1 border-t border-slate-200/60 dark:border-white/5 flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm bg-gradient-to-t from-brand to-brand/70" />
                        <span className="text-[11px] text-muted-foreground font-medium">
                            Siang (06-21)
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm bg-gradient-to-t from-purple-600 to-purple-400" />
                        <span className="text-[11px] text-muted-foreground font-medium">
                            Malam (22-05)
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============================================================
// TOP WINS
// ============================================================

function TopWinsSection({
    wins,
}: {
    wins: ReturnType<typeof computeTopWins>
}) {
    const totalWin = wins.reduce((s, w) => s + w.target_price, 0)

    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-amber-50/50 to-card dark:from-amber-500/[0.06] dark:via-amber-500/[0.02] dark:to-card border border-amber-200/60 dark:border-amber-500/20">
            <div className="p-5 md:p-6 pb-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
                            <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm md:text-base font-bold tracking-tight truncate">
                                🏆 Impulse Terbesar yang Ditahan
                            </h2>
                            <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5">
                                Top {wins.length} cancel terbesar
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-amber-200/60 dark:border-amber-500/20">
                    <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1">
                        Total Ditahan
                    </p>
                    <Amount
                        value={totalWin}
                        className="text-2xl md:text-3xl font-bold text-amber-700 dark:text-amber-300 tabular-nums"
                    />
                </div>
            </div>

            <div className="px-3 md:px-4 pb-4 md:pb-5 space-y-1">
                {wins.map((w, i) => (
                    <Link
                        key={w.id}
                        href={`/wishlist/${w.id}`}
                        className="group flex items-center gap-3 p-2.5 md:p-3 rounded-2xl hover:bg-white/60 dark:hover:bg-white/5 transition-all cursor-pointer"
                    >
                        <div
                            className={cn(
                                'w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm',
                                i === 0
                                    ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                                    : i === 1
                                        ? 'bg-gradient-to-br from-slate-300 to-slate-500'
                                        : i === 2
                                            ? 'bg-gradient-to-br from-amber-600 to-amber-800'
                                            : 'bg-slate-400 dark:bg-slate-600'
                            )}
                        >
                            {i + 1}
                        </div>

                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5 shrink-0">
                            <WishlistImage
                                imageUrl={w.image_url}
                                alt={w.name}
                                aspect="square"
                            />
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate leading-tight group-hover:text-brand transition-colors">
                                {w.name}
                            </p>
                            <Amount
                                value={w.target_price}
                                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 inline-block"
                            />
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>
                ))}
            </div>
        </div>
    )
}