'use client'

import { useMemo } from 'react'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Info, Calendar, Lightbulb } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Amount } from '@/components/ui/amount'
import { useHideAmounts } from '@/lib/stores/hide-amounts'
import {
    projectNetWorthPath,
    formatFiDate,
} from '@/lib/utils/financial-freedom'
import { cn } from '@/lib/utils'
import type { ResolvedFiParams } from '@/lib/utils/financial-freedom'
import type { FiSnapshot } from '@/lib/financial-freedom/types'

type Props = {
    resolved: ResolvedFiParams
    snapshots: FiSnapshot[]
}

function formatShortRupiah(value: number): string {
    if (value >= 1_000_000_000_000)
        return `${(value / 1_000_000_000_000).toFixed(1)}T`
    if (value >= 1_000_000_000)
        return `${(value / 1_000_000_000).toFixed(1)}M`
    if (value >= 1_000_000) {
        const jt = value / 1_000_000
        return jt >= 100 ? `${jt.toFixed(0)}jt` : `${jt.toFixed(1)}jt`
    }
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`
    return value.toString()
}

export function FiGrowthChart({ resolved }: Props) {
    const { hidden } = useHideAmounts()

    const projection = useMemo(() => {
        if (resolved.fiNumber <= 0) return []
        return projectNetWorthPath({
            startNetWorth: resolved.currentNetWorth,
            monthlySaving: resolved.monthlySaving,
            annualRealReturn: resolved.realReturn,
            fiNumber: resolved.fiNumber,
            maxYears: 40,
        })
    }, [
        resolved.fiNumber,
        resolved.currentNetWorth,
        resolved.monthlySaving,
        resolved.realReturn,
    ])

    const hasProjection = projection.length >= 2
    const canReachFi =
        resolved.monthsToFi !== null && isFinite(resolved.monthsToFi)

    const formatTick = (v: number) => (hidden ? '•••' : formatShortRupiah(v))

    const suspiciousSaving = resolved.savingsRate > 90
    const negativeSaving = resolved.monthlySaving <= 0

    return (
        <Card className="py-0 gap-0">
            <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="flex items-start justify-between gap-3 mb-5 md:mb-6 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                            <TrendingUp className="w-5 h-5 text-brand" />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-bold tracking-tight">
                                Proyeksi Pertumbuhan Aset
                            </h2>
                            <p className="text-xs md:text-sm text-muted-foreground">
                                Simulasi net worth investable ke depan
                            </p>
                        </div>
                    </div>

                    {canReachFi && resolved.fiDate && (
                        <div className="rounded-xl bg-brand/5 border border-brand/20 px-3.5 py-2 md:px-4 md:py-2.5 flex items-center gap-2.5">
                            <Calendar className="w-4 h-4 text-brand shrink-0" />
                            <div className="leading-tight">
                                <p className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                                    Estimasi FI
                                </p>
                                <p className="text-sm font-bold text-brand tabular-nums">
                                    {formatFiDate(resolved.fiDate)}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {suspiciousSaving && !negativeSaving && (
                    <div className="mb-4 md:mb-5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-3.5 flex gap-2.5">
                        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-xs md:text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                            Savings rate lu{' '}
                            <strong>{resolved.savingsRate.toFixed(0)}%</strong>. Cek lagi
                            parameter Pendapatan & Pengeluaran lu, mungkin ada typo angka.
                        </div>
                    </div>
                )}

                {negativeSaving && (
                    <div className="mb-4 md:mb-5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-3.5 flex gap-2.5">
                        <Info className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        <div className="text-xs md:text-sm text-red-800 dark:text-red-200 leading-relaxed">
                            Nabung lu <strong>0 atau negatif</strong> (pengeluaran lebih
                            besar dari pendapatan). Isi parameter biar bisa dihitung.
                        </div>
                    </div>
                )}

                {hasProjection ? (
                    <div>
                        <div className="w-full" style={{ height: 320 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={projection}
                                    margin={{ top: 16, right: 12, left: -8, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="ff-area-grad"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop offset="0%" stopColor="#334DAF" stopOpacity={0.35} />
                                            <stop offset="100%" stopColor="#334DAF" stopOpacity={0} />
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
                                        dy={10}
                                        interval="preserveStartEnd"
                                    />

                                    <YAxis
                                        stroke="currentColor"
                                        className="text-slate-400 dark:text-slate-500"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={formatTick}
                                        width={56}
                                        domain={[0, 'auto']}
                                    />

                                    <Tooltip
                                        cursor={{
                                            stroke: '#334DAF',
                                            strokeWidth: 1,
                                            strokeDasharray: '3 3',
                                        }}
                                        contentStyle={{
                                            backgroundColor: 'var(--color-card)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '14px',
                                            fontSize: '12px',
                                            padding: '10px 14px',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                        }}
                                        labelStyle={{
                                            fontWeight: 700,
                                            marginBottom: 6,
                                            fontSize: '11px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                        }}
                                        formatter={(value: any, name: any, props: any) => {
                                            if (hidden) return ['•••', name]
                                            const val = `Rp ${Number(value).toLocaleString('id-ID')}`
                                            if (props?.dataKey === 'fiNumber') return [val, 'Target FI']
                                            return [val, 'Net Worth']
                                        }}
                                    />

                                    <ReferenceLine
                                        y={resolved.fiNumber}
                                        stroke="#10b981"
                                        strokeWidth={2.5}
                                        strokeDasharray="6 4"
                                        label={{
                                            value: hidden
                                                ? '•••'
                                                : `Target: ${formatShortRupiah(resolved.fiNumber)}`,
                                            position: 'insideTopRight',
                                            fontSize: 11,
                                            fill: '#10b981',
                                            fontWeight: 700,
                                        }}
                                    />

                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#334DAF"
                                        strokeWidth={3}
                                        fill="url(#ff-area-grad)"
                                        dot={{
                                            r: 3,
                                            strokeWidth: 2,
                                            fill: 'var(--color-card)',
                                            stroke: '#334DAF',
                                        }}
                                        activeDot={{ r: 5, strokeWidth: 2 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="flex items-center justify-center gap-4 sm:gap-6 mt-4 md:mt-5 flex-wrap">
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-3 h-3 rounded-full shrink-0"
                                    style={{ backgroundColor: '#334DAF' }}
                                />
                                <span className="text-xs md:text-sm text-muted-foreground font-medium">
                                    Proyeksi Net Worth
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-3 h-3 rounded-full shrink-0 border-2 border-dashed"
                                    style={{
                                        borderColor: '#10b981',
                                        backgroundColor: 'transparent',
                                    }}
                                />
                                <span className="text-xs md:text-sm text-muted-foreground font-medium">
                                    Target FI
                                </span>
                            </div>
                        </div>

                        {canReachFi && resolved.yearsToFi !== null && (
                            <div className="mt-5 md:mt-6 pt-5 md:pt-6 border-t border-slate-100 dark:border-white/5 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                                <div>
                                    <p className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
                                        Waktu ke FI
                                    </p>
                                    <p className="text-xl md:text-2xl font-bold text-brand tabular-nums">
                                        {resolved.yearsToFi.toFixed(1)}
                                        <span className="text-sm font-medium text-muted-foreground ml-1.5">
                                            tahun
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
                                        Nabung / Bulan
                                    </p>
                                    <Amount
                                        value={resolved.monthlySaving}
                                        className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white break-all"
                                    />
                                    <p className="text-[11px] md:text-xs text-muted-foreground mt-1 leading-snug">
                                        Pendapatan{' '}
                                        <span className="tabular-nums">
                                            {hidden
                                                ? '•••'
                                                : `Rp ${Math.round(resolved.monthlyIncome).toLocaleString('id-ID')}`}
                                        </span>
                                        {' - '}
                                        Pengeluaran{' '}
                                        <span className="tabular-nums">
                                            {hidden
                                                ? '•••'
                                                : `Rp ${Math.round(resolved.monthlyExpense).toLocaleString('id-ID')}`}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
                                        Return Bersih
                                    </p>
                                    <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                                        {(resolved.realReturn * 100).toFixed(1)}
                                        <span className="text-sm font-medium text-muted-foreground ml-1">
                                            % / tahun
                                        </span>
                                    </p>
                                    <p className="text-[11px] md:text-xs text-muted-foreground mt-1">
                                        setelah dikurangi inflasi
                                    </p>
                                </div>
                            </div>
                        )}

                        {canReachFi && resolved.savingsRate > 0 && (
                            <div className="mt-5 md:mt-6 rounded-xl sm:rounded-2xl bg-brand/[0.03] dark:bg-brand/[0.05] border border-brand/15 p-3.5 md:p-4 flex gap-3">
                                <Lightbulb className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                                <div className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                    Coba lihat di <strong>Simulator Skenario</strong> di bawah
                                    buat lihat efek naikin tabungan bulanan ke waktu FI lu.
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-10 md:py-14 text-center">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <Info className="w-6 h-6 md:w-7 md:h-7 text-slate-400" />
                        </div>
                        <p className="text-sm md:text-base font-semibold mb-1.5">
                            Belum bisa diproyeksi
                        </p>
                        <p className="text-xs md:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                            {resolved.monthlySaving <= 0
                                ? 'Isi Pendapatan & Pengeluaran di parameter, butuh saving positif buat proyeksi.'
                                : resolved.fiNumber <= 0
                                    ? 'Target FI belum valid. Cek parameter lu.'
                                    : 'Data belum cukup buat generate proyeksi.'}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}