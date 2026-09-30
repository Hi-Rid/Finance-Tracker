'use client'

import { cn } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Sparkline } from '@/components/charts/sparkline'
import { Amount } from '@/components/ui/amount'
import { useHideAmounts } from '@/lib/stores/hide-amounts'

type StatCardProps = {
  title: string
  value: number
  icon: React.ReactNode
  trend?: number
  trendLabel?: string
  sparklineData?: number[]
  sparklineLabels?: string[]
  sparklineYAxisPadding?: number
  chartSlot?: React.ReactNode
  toolbarSlot?: React.ReactNode
  topRightSlot?: React.ReactNode
  footerSlot?: React.ReactNode
  accentColor?: string
  size?: 'default' | 'large'
  showToggle?: boolean
  className?: string
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  trendLabel = 'dari bulan lalu',
  sparklineData,
  sparklineLabels,
  sparklineYAxisPadding,
  chartSlot,
  toolbarSlot,
  topRightSlot,
  footerSlot,
  accentColor = '#5b86b6',
  size = 'default',
  showToggle = false,
  className,
}: StatCardProps) {
  const isPositive = (trend ?? 0) >= 0
  const isLarge = size === 'large'
  const { hidden, toggle } = useHideAmounts()

  return (
    <div
      className={cn(
        'group relative bg-card rounded-2xl sm:rounded-3xl border border-border/60 shadow-sm transition-all hover:shadow-md hover:border-primary-400/30',
        'h-full flex flex-col',
        isLarge ? 'p-3.5 sm:p-5 md:p-6' : 'p-4 sm:p-5 md:p-6',
        className
      )}
    >
      {isLarge ? (
        <div className="flex flex-col gap-2.5 sm:gap-4 flex-1">
          {/* Header: icon + title + eye */}
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 [&_svg]:w-4 [&_svg]:h-4 sm:[&_svg]:w-5 sm:[&_svg]:h-5"
                style={{
                  backgroundColor: `${accentColor}15`,
                  color: accentColor,
                }}
              >
                {icon}
              </div>
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {title}
              </p>
            </div>

            {showToggle && (
              <button
                type="button"
                onClick={toggle}
                className={cn(
                  'w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0',
                  'text-slate-500 dark:text-slate-400',
                  'bg-slate-100 dark:bg-white/5',
                  'hover:bg-slate-200 dark:hover:bg-white/10 hover:text-brand dark:hover:text-white',
                  'transition-colors cursor-pointer'
                )}
                aria-label={hidden ? 'Tampilkan nominal' : 'Sembunyikan nominal'}
                title={hidden ? 'Tampilkan nominal' : 'Sembunyikan nominal'}
              >
                {hidden ? (
                  <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            )}
          </div>

          {/* Value */}
          <div>
            <Amount
              value={value}
              className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight break-all leading-tight"
            />
          </div>

          {/* Trend + Toolbar */}
          {(trend !== undefined || toolbarSlot) && (
            <div className="flex-1 flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
              <div>
                {trend !== undefined && (
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <div
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold',
                        isPositive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      )}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      ) : (
                        <TrendingDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      )}
                      {isPositive ? '+' : ''}
                      {trend.toFixed(1)}%
                    </div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      {trendLabel}
                    </span>
                  </div>
                )}
              </div>

              {toolbarSlot && <div className="shrink-0">{toolbarSlot}</div>}
            </div>
          )}

          {/* Chart */}
          {chartSlot ? (
            <div className="w-full">{chartSlot}</div>
          ) : (
            sparklineData &&
            sparklineData.length > 0 && (
              <div className="mt-1">
                <Sparkline
                  data={sparklineData}
                  color={accentColor}
                  height={64}
                  yAxisPadding={sparklineYAxisPadding}
                />
              </div>
            )
          )}
        </div>
      ) : (
        /* ============ DEFAULT LAYOUT ============ */
        <>
          <div className="flex items-start justify-between gap-2.5 sm:gap-3 mb-3 sm:mb-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 [&_svg]:w-4 [&_svg]:h-4 sm:[&_svg]:w-5 sm:[&_svg]:h-5"
                style={{
                  backgroundColor: `${accentColor}15`,
                  color: accentColor,
                }}
              >
                {icon}
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {title}
                </p>
              </div>
            </div>

            {topRightSlot && <div className="shrink-0">{topRightSlot}</div>}
          </div>

          <div className="mb-2.5 sm:mb-3">
            <Amount
              value={value}
              className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight block break-all leading-tight"
            />
          </div>

          {trend !== undefined && (
            <div className="flex items-center gap-1.5 mb-2.5 sm:mb-3">
              <div
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium',
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
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                {trendLabel}
              </span>
            </div>
          )}

          {sparklineData && sparklineData.length > 0 && (
            <div className="mt-3 sm:mt-4 -mx-1">
              <Sparkline
                data={sparklineData}
                color={accentColor}
                height={64}
                yAxisPadding={sparklineYAxisPadding}
              />
            </div>
          )}

          {footerSlot && (
            <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-100 dark:border-white/10">
              {footerSlot}
            </div>
          )}
        </>
      )}
    </div>
  )
}