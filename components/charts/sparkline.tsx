'use client'

import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts'

type SparklineProps = {
  data: number[]
  color?: string
  height?: number | string
  showGradient?: boolean
}

export function Sparkline({
  data,
  color = '#5b86b6',
  height = 40,
  showGradient = true,
}: SparklineProps) {
  // ============================================================
  // 1. Normalize ke 0-100
  // 2. Clamp minimum ke 15 - biar garis flat (nilai rendah) tetap kelihatan tebal
  // ============================================================
  const maxValue = Math.max(...data, 1)
  const FLOOR = 15

  const normalized = data.map((v) => {
    const scaled = (v / maxValue) * 100
    return Math.max(scaled, FLOOR)
  })

  const chartData = normalized.map((value, index) => ({ index, value }))
  const gradientId = `sparkline-grad-${color.replace('#', '')}`

  return (
    <div
      style={{
        width: '100%',
        height,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          <YAxis domain={[0, 100]} hide />

          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fill={showGradient ? `url(#${gradientId})` : 'transparent'}
            isAnimationActive={false}
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}