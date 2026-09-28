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
  format?: 'juta' | 'ribu' | 'full'
}

function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })
}

export function LineChart({
  data,
  series,
  height = 260,
  xKey = 'name',
  format = 'juta',
}: LineChartProps) {
  const formatValue = (value: number) => {
    if (format === 'juta') return `Rp ${formatNumber(value)}jt`
    if (format === 'ribu') return `Rp ${formatNumber(value)}rb`
    return `Rp ${formatNumber(value, 0)}`
  }

  const formatAxisValue = (value: number) => {
    if (format === 'juta') return `${formatNumber(value, 1)}jt`
    if (format === 'ribu') return `${formatNumber(value, 1)}rb`
    return formatNumber(value, 0)
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
            tickFormatter={formatAxisValue}
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
            verticalAlign="bottom"
            content={() => (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 40,
                  paddingTop: 28,
                  paddingBottom: 4,
                  flexWrap: 'wrap',
                }}
              >
                {series.map((s) => (
                  <div
                    key={s.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: s.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'var(--color-muted-foreground)',
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
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