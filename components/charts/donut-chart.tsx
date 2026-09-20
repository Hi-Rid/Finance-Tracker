'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

type DonutData = {
  name: string
  value: number
  color: string
}

type DonutChartProps = {
  data: DonutData[]
  total?: number
  totalLabel?: string
  height?: number
}

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString('id-ID')}`
}

export function DonutChart({
  data,
  total,
  totalLabel = 'Total',
  height = 220,
}: DonutChartProps) {
  const computedTotal = total ?? data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="relative" style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="62%"
            outerRadius="90%"
            paddingAngle={3}
            cornerRadius={6}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              fontSize: '12px',
              padding: '8px 12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            formatter={(value: number) => [formatRupiah(value), '']}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
          {totalLabel}
        </p>
        <p className="text-xl font-bold tabular-nums">
          {formatRupiah(computedTotal)}
        </p>
      </div>
    </div>
  )
}