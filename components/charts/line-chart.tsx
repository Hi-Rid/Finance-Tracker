'use client'

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

type Series = {
  key: string
  label: string
  color: string
}

type LineChartProps = {
  data: any[]
  series: Series[]
  height?: number
  xKey?: string
  /** Format: "juta" (default, nilai 5.0 → "Rp 5jt"), "ribu" (nilai 5000 → "Rp 5rb"), "full" (nilai 5000 → "Rp 5.000") */
  format?: 'juta' | 'ribu' | 'full'
}

export function LineChart({
  data,
  series,
  height = 260,
  xKey = 'name',
  format = 'juta',
}: LineChartProps) {
  const formatValue = (value: number) => {
    if (format === 'juta') return `Rp ${value}jt`
    if (format === 'ribu') return `Rp ${value}rb`
    return `Rp ${value.toLocaleString('id-ID')}`
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
            opacity={0.5}
            vertical={false}
          />

          <XAxis
            dataKey={xKey}
            stroke="var(--color-muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dy={8}
          />

          <YAxis
            stroke="var(--color-muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => (format === 'juta' ? `${v}jt` : `${v}`)}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              fontSize: '12px',
              padding: '10px 12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            formatter={(value: number) => formatValue(value)}
            labelStyle={{ fontWeight: 600, marginBottom: 4 }}
          />

          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
            iconType="circle"
            iconSize={8}
          />

          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2.5}
              dot={{ r: 3, strokeWidth: 2, fill: 'var(--color-card)' }}
              activeDot={{ r: 5, strokeWidth: 2 }}
              isAnimationActive={true}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}