'use client'

import { Line, LineChart, ResponsiveContainer } from 'recharts'

type SparklineProps = {
  data: number[]
  color?: string
  height?: number
}

export function Sparkline({
  data,
  color = '#5b86b6',
  height = 40,
}: SparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }))

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}