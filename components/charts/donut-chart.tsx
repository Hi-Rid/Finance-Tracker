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
  height = 200,
}: DonutChartProps) {
  const computedTotal = total ?? data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div
      className="relative"
      style={{ width: '100%', height }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart tabIndex={-1} style={{ outline: 'none' }}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="92%"
            paddingAngle={3}
            cornerRadius={6}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            wrapperStyle={{ zIndex: 50, outline: 'none' }}
            contentStyle={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              fontSize: '12px',
              padding: '10px 14px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              color: 'var(--color-card-foreground)',
            }}
            labelStyle={{
              fontSize: '11px',
              fontWeight: 600,
              marginBottom: '4px',
              color: 'var(--color-muted-foreground)',
            }}
            itemStyle={{
              fontWeight: 700,
              color: 'var(--color-card-foreground)',
            }}
            formatter={((value: number, name: string) => [
              formatRupiah(value),
              name,
            ]) as any}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="absolute inset-0 z-0 flex flex-col items-center justify-center pointer-events-none px-6">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-2">
          {totalLabel}
        </p>
        <p className="text-base font-bold tabular-nums tracking-tight text-center leading-tight">
          {formatRupiah(computedTotal)}
        </p>
      </div>
    </div>
  )
}