'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Settings2,
} from 'lucide-react'
import { Amount } from '@/components/ui/amount'
import { cn } from '@/lib/utils'
import type { DailyBudgetData } from '@/lib/utils/daily-budget'

type DailyBudgetFloatingProps = {
  data: DailyBudgetData
  className?: string
}

export function DailyBudgetFloating({
  data,
  className,
}: DailyBudgetFloatingProps) {
  const [expanded, setExpanded] = useState(false)
  const {
    totalBudget,
    totalSpent,
    percentage,
    remaining,
    items,
    unassignedSpent,
    hasSetup,
  } = data

  const clampedPercentage = Math.min(percentage, 100)

  type State = 'empty' | 'safe' | 'warning' | 'critical' | 'over'
  const state: State = !hasSetup
    ? 'empty'
    : percentage >= 100
      ? 'over'
      : percentage >= 80
        ? 'critical'
        : percentage >= 50
          ? 'warning'
          : 'safe'

  const accentMap = {
    empty: {
      text: 'text-slate-400',
      bar: 'bg-slate-400',
      iconText: 'text-slate-400',
      iconBg: 'bg-white/10',
    },
    safe: {
      text: 'text-emerald-400',
      bar: 'bg-emerald-400',
      iconText: 'text-emerald-400',
      iconBg: 'bg-emerald-500/20',
    },
    warning: {
      text: 'text-amber-400',
      bar: 'bg-amber-400',
      iconText: 'text-amber-400',
      iconBg: 'bg-amber-500/20',
    },
    critical: {
      text: 'text-orange-400',
      bar: 'bg-orange-400',
      iconText: 'text-orange-400',
      iconBg: 'bg-orange-500/20',
    },
    over: {
      text: 'text-red-400',
      bar: 'bg-red-400',
      iconText: 'text-red-400',
      iconBg: 'bg-red-500/20',
    },
  }

  const accent = accentMap[state]

  const labelMap: Record<State, string> = {
    empty: 'Belum di-set',
    safe: 'Daily Budget',
    warning: 'Hampir Habis',
    critical: 'Mepet Banget',
    over: 'Over Budget',
  }

  const label = labelMap[state]

  const visibleItems = items.slice(0, 5)
  const hiddenCount = items.length - visibleItems.length

  return (
    <div
      className={cn('md:hidden fixed bottom-20 left-4 right-4 z-40', className)}
    >
      <motion.div
        layout
        onClick={() => {
          if (!hasSetup) {
            window.location.href = '/budget'
          } else {
            setExpanded((v) => !v)
          }
        }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'relative overflow-hidden rounded-2xl',
          'bg-[#0B2050]',
          'shadow-lg shadow-black/20'
        )}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div
          className={cn(
            'absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-300',
            accent.bar
          )}
        />

        <div className="relative flex items-center gap-3 px-4 py-3">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              accent.iconBg
            )}
          >
            {state === 'over' ? (
              <AlertTriangle className={cn('w-4 h-4', accent.iconText)} />
            ) : state === 'empty' ? (
              <Settings2 className={cn('w-4 h-4', accent.iconText)} />
            ) : (
              <Wallet className={cn('w-4 h-4', accent.iconText)} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">
                {label}
              </span>
              {state !== 'empty' && (
                <span
                  className={cn(
                    'text-[11px] font-bold tabular-nums',
                    accent.text
                  )}
                >
                  {Math.round(percentage)}%
                </span>
              )}
            </div>

            {state === 'empty' ? (
              <p className="text-xs text-white/60">
                Tap untuk setup daily budget
              </p>
            ) : (
              <>
                <div className="w-full h-1.5 rounded-full bg-white/25 overflow-hidden mb-1.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${clampedPercentage}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={cn('h-full rounded-full', accent.bar)}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <Amount
                    value={totalSpent}
                    className="text-white font-semibold"
                  />
                  <Amount
                    value={totalBudget}
                    prefix="/ "
                    className="text-white/60"
                  />
                </div>
              </>
            )}
          </div>

          <div className="shrink-0 text-white/60">
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="relative border-t border-white/15"
            >
              <div className="px-4 py-3 space-y-3">
                {state === 'empty' ? (
                  <p className="text-xs text-white/60 text-center py-2">
                    Belum ada daily budget. Buka menu Budget untuk setup.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/70">
                        {state === 'over' ? 'Kelebihan' : 'Sisa hari ini'}
                      </span>
                      <Amount
                        value={Math.abs(remaining)}
                        sign={state === 'over' ? 'negative' : 'none'}
                        className={cn(
                          'font-bold',
                          state === 'over' ? 'text-red-400' : 'text-emerald-400'
                        )}
                      />
                    </div>

                    {(visibleItems.length > 0 || unassignedSpent > 0) && (
                      <div className="grid grid-cols-3 gap-2">
                        {visibleItems.map((item, i) => {
                          const rawPercent =
                            item.total > 0
                              ? (item.spent / item.total) * 100
                              : 0
                          const itemPercent = Math.min(rawPercent, 100)

                          const itemAccent =
                            rawPercent >= 100
                              ? 'bg-red-400'
                              : rawPercent >= 80
                                ? 'bg-orange-400'
                                : rawPercent >= 50
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-400'

                          return (
                            <div
                              key={`${item.label}-${i}`}
                              className="rounded-xl bg-white/10 px-2.5 py-2"
                            >
                              <p className="text-[9px] text-white/60 uppercase tracking-wider mb-1 truncate">
                                {item.label}
                              </p>
                              <Amount
                                value={item.spent}
                                className="text-[11px] font-semibold text-white block mb-1.5"
                              />
                              <div className="w-full h-0.5 rounded-full bg-white/30 overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full rounded-full transition-all',
                                    itemAccent
                                  )}
                                  style={{ width: `${itemPercent}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}

                        {unassignedSpent > 0 && (
                          <div className="rounded-xl bg-white/5 border border-white/10 px-2.5 py-2">
                            <p className="text-[9px] text-white/50 uppercase tracking-wider mb-1 truncate">
                              Lainnya
                            </p>
                            <Amount
                              value={unassignedSpent}
                              className="text-[11px] font-semibold text-white/80 block mb-1.5"
                            />
                            <div className="w-full h-0.5 rounded-full bg-white/30 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-white/50"
                                style={{ width: '100%' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {hiddenCount > 0 && (
                      <p className="text-[10px] text-white/40 text-center">
                        +{hiddenCount} item lainnya
                      </p>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}