'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Sparkline } from '@/components/charts/sparkline'

type StatCardProps = {
  title: string
  value: string
  icon: React.ReactNode
  trend?: number
  trendLabel?: string
  sparklineData?: number[]
  accentColor?: string
  className?: string
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  trendLabel = 'dari bulan lalu',
  sparklineData,
  accentColor = '#334DAF',
  className,
}: StatCardProps) {
  const isPositive = (trend ?? 0) >= 0

  return (
    <div
      className={cn(
        'group relative bg-card rounded-3xl border border-border/60 p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-brand/30 hover:-translate-y-0.5 overflow-hidden',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
          >
            {icon}
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-2xl md:text-3xl font-bold tabular-nums tracking-tight">
          {value}
        </p>
      </div>

      {trend !== undefined && (
        <div className="flex items-center gap-1.5 mb-3">
          <div
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
              isPositive
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {isPositive ? '+' : ''}
            {trend.toFixed(1)}%
          </div>
          <span className="text-xs text-muted-foreground">{trendLabel}</span>
        </div>
      )}

      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-4 -mx-1">
          <Sparkline data={sparklineData} color={accentColor} height={36} />
        </div>
      )}
    </div>
  )
}