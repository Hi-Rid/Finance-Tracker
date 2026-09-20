'use client'

import { Area, AreaChart, ResponsiveContainer } from 'recharts'

type MiniAreaChartProps = {
  data: number[]
  color?: string
  height?: number
}

export function MiniAreaChart({
  data,
  color = '#5b86b6',
  height = 60,
}: MiniAreaChartProps) {
  const chartData = data.map((value, index) => ({ index, value }))
  const gradientId = `gradient-${color.replace('#', '')}`

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}