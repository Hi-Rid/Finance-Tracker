'use client'

import { cn } from '@/lib/utils'

type ProgressRingProps = {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  showLabel?: boolean
  label?: string
  variant?: 'auto' | 'default' | 'success' | 'warning' | 'critical' | 'danger'
}

const COLORS = {
  default: { stroke: '#334DAF', text: 'text-brand' },
  success: { stroke: '#10b981', text: 'text-emerald-500' },
  warning: { stroke: '#f59e0b', text: 'text-amber-500' },
  critical: { stroke: '#f97316', text: 'text-orange-500' },
  danger: { stroke: '#ef4444', text: 'text-red-500' },
}

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 10,
  className,
  showLabel = true,
  label,
  variant = 'auto',
}: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  // Auto-detect: <50 hijau, 50-80 kuning, 80-100 orange, >100 merah
  const autoVariant =
    clamped > 100
      ? 'danger'
      : clamped >= 80
      ? 'critical'
      : clamped >= 50
      ? 'warning'
      : 'success'

  const finalVariant = variant === 'auto' ? autoVariant : variant
  const { stroke, text } = COLORS[finalVariant]

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-primary-100 dark:text-primary-100/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${stroke}40)` }}
        />
      </svg>

      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-2xl font-bold tabular-nums', text)}>
            {Math.round(clamped)}%
          </span>
          {label && (
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  )
}