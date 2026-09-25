'use client'

import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid,
} from 'recharts'
import { cn } from '@/lib/utils'

type NetWorthChartProps = {
    data: number[]
    labels: string[]
    height?: number | string
    className?: string
}

function formatShortRupiah(value: number): string {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`
    if (value >= 1_000_000) {
        const jt = value / 1_000_000
        return jt >= 100 ? `${jt.toFixed(0)}jt` : `${jt.toFixed(1)}jt`
    }
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`
    return value.toString()
}

function formatMonthLabel(month: string): string {
    const [y, m] = month.split('-')
    const d = new Date(Number(y), Number(m) - 1, 1)
    const monthShort = d.toLocaleDateString('id-ID', { month: 'short' })
    return `${monthShort} '${y.slice(-2)}`
}

export function NetWorthChart({
    data,
    labels,
    height = 240,
    className,
}: NetWorthChartProps) {
    // Fallback: kalau data < 2, generate 6 bulan flat dari nilai terakhir
    let safeData = data
    let safeLabels = labels

    if (data.length < 2) {
        const baseValue = data[0] || 0
        const now = new Date()
        safeData = []
        safeLabels = []
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            safeLabels.push(formatMonthLabel(monthStr))
            safeData.push(baseValue)
        }
    }

    const chartData = safeData.map((value, index) => ({
        index,
        value,
        label: safeLabels[index] || '',
    }))

    const first = safeData[0] ?? 0
    const last = safeData[safeData.length - 1] ?? 0
    const isPositive = last >= first
    const color = isPositive ? '#10b981' : '#ef4444'
    const gradientId = `nw-grad-${isPositive ? 'up' : 'down'}`

    const min = Math.min(...safeData)
    const max = Math.max(...safeData)
    const range = max - min || 1
    const yPadding = range * 0.15
    const yMin = Math.max(0, min - yPadding)
    const yMax = max + yPadding

    const showAllLabels = safeData.length <= 8

    return (
        <div className={cn('w-full', className)} style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={chartData}
                    margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="currentColor"
                        className="text-slate-200 dark:text-white/10"
                        vertical={false}
                    />

                    <XAxis
                        dataKey="label"
                        stroke="currentColor"
                        className="text-slate-400 dark:text-slate-500"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        interval={showAllLabels ? 0 : 'preserveStartEnd'}
                        padding={{ left: 16, right: 16 }}
                    />

                    <YAxis
                        orientation="right"
                        stroke="currentColor"
                        className="text-slate-400 dark:text-slate-500"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatShortRupiah}
                        domain={[yMin, yMax]}
                        width={44}
                        tickMargin={6}
                    />

                    <Tooltip
                        cursor={{
                            stroke: color,
                            strokeWidth: 1,
                            strokeDasharray: '3 3',
                        }}
                        contentStyle={{
                            backgroundColor: 'var(--color-card)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '10px',
                            fontSize: '12px',
                            padding: '8px 12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                        labelStyle={{
                            fontSize: '11px',
                            color: 'var(--color-muted-foreground)',
                            marginBottom: '2px',
                        }}
                        formatter={((value: number) => [
                            `Rp ${value.toLocaleString('id-ID')}`,
                            'Net Worth',
                        ]) as any}
                    />

                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2.5}
                        fill={`url(#${gradientId})`}
                        isAnimationActive={false}
                        dot={false}
                        activeDot={{
                            r: 5,
                            fill: color,
                            stroke: 'var(--color-card)',
                            strokeWidth: 2,
                        }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}