'use client'

import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts'

type SparklineProps = {
  data: number[]
  color?: string
  height?: number | string
  showGradient?: boolean
  /**
   * Padding bawah (ratio terhadap max value).
   * 0 = default (garis flat nempel bottom).
   * 0.15 = tambah 15% ruang di bawah 0, biar area fill gak tipis.
   */
  yAxisPadding?: number
}

export function Sparkline({
  data,
  color = '#5b86b6',
  height = 40,
  showGradient = true,
  yAxisPadding = 0,
}: SparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }))
  const gradientId = `sparkline-grad-${color.replace('#', '')}`

  const maxValue = Math.max(...data, 1)
  const yMin = yAxisPadding > 0 ? -maxValue * yAxisPadding : 0

  return (
    <div
      style={{
        width: '100%',
        height,
        pointerEvents: 'none',        // ← block semua interaksi
        userSelect: 'none',
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
          tabIndex={-1}                // ← prevent focus
          style={{ outline: 'none' }}  // ← kill focus outline
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          {yAxisPadding > 0 && <YAxis domain={[yMin, 'auto']} hide />}

          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fill={showGradient ? `url(#${gradientId})` : 'transparent'}
            isAnimationActive={false}
            dot={false}
            activeDot={false}
            baseValue={yAxisPadding > 0 ? yMin : 0}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}