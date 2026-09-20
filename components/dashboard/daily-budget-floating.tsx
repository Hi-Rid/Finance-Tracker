'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

type DailyBudgetFloatingProps = {
  spent: number
  budget: number
  className?: string
}

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString('id-ID')}`
}

export function DailyBudgetFloating({
  spent,
  budget,
  className,
}: DailyBudgetFloatingProps) {
  const [expanded, setExpanded] = useState(false)
  const percentage = Math.min((spent / budget) * 100, 100)
  const rawPercentage = (spent / budget) * 100
  const remaining = Math.max(budget - spent, 0)

  type State = 'safe' | 'warning' | 'critical' | 'over'
  const state: State =
    rawPercentage >= 100
      ? 'over'
      : rawPercentage >= 80
      ? 'critical'
      : rawPercentage >= 50
      ? 'warning'
      : 'safe'

  const accentMap = {
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

  const labelMap = {
    safe: 'Daily Budget',
    warning: 'Hampir Habis',
    critical: 'Mepet Banget',
    over: 'Over Budget',
  }

  const label = labelMap[state]

  return (
    <div
      className={cn(
        'md:hidden fixed bottom-20 left-4 right-4 z-40',
        className
      )}
    >
      <motion.div
        layout
        onClick={() => setExpanded((v) => !v)}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'relative overflow-hidden rounded-2xl',
          // Sama persis di light & dark
          'bg-[#0B2050]',
          'shadow-lg shadow-black/20'
        )}
      >
        {/* Top shine */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        {/* Soft accent glow */}
        <div
          className={cn(
            'absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-300',
            accent.bar
          )}
        />

        {/* Main row */}
        <div className="relative flex items-center gap-3 px-4 py-3">
          {/* Icon */}
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              accent.iconBg
            )}
          >
            {state === 'over' ? (
              <AlertTriangle className={cn('w-4 h-4', accent.iconText)} />
            ) : (
              <Wallet className={cn('w-4 h-4', accent.iconText)} />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">
                {label}
              </span>
              <span className={cn('text-[11px] font-bold tabular-nums', accent.text)}>
                {Math.round(rawPercentage)}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden mb-1.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={cn('h-full rounded-full', accent.bar)}
              />
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white font-semibold tabular-nums">
                {formatRupiah(spent)}
              </span>
              <span className="text-white/60 tabular-nums">
                / {formatRupiah(budget)}
              </span>
            </div>
          </div>

          {/* Chevron */}
          <div className="shrink-0 text-white/60">
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </div>
        </div>

        {/* Expanded content */}
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
                {/* Sisa */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/70">
                    {state === 'over' ? 'Kelebihan' : 'Sisa hari ini'}
                  </span>
                  <span
                    className={cn(
                      'font-bold tabular-nums',
                      state === 'over' ? 'text-red-400' : 'text-emerald-400'
                    )}
                  >
                    {state === 'over'
                      ? `-${formatRupiah(spent - budget)}`
                      : formatRupiah(remaining)}
                  </span>
                </div>

                {/* Breakdown mini */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Sarapan', spent: 10000, total: 10000 },
                    { label: 'Makan', spent: 35000, total: 40000 },
                    { label: 'Transport', spent: 0, total: 10000 },
                  ].map((item) => {
                    const itemPercent = Math.min(
                      (item.spent / item.total) * 100,
                      100
                    )
                    const itemDone = item.spent >= item.total
                    return (
                      <div
                        key={item.label}
                        className="rounded-xl bg-white/10 px-2.5 py-2"
                      >
                        <p className="text-[9px] text-white/60 uppercase tracking-wider mb-1 truncate">
                          {item.label}
                        </p>
                        <p className="text-[11px] font-semibold text-white tabular-nums mb-1.5">
                          {formatRupiah(item.spent)}
                        </p>
                        <div className="w-full h-0.5 rounded-full bg-white/20 overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              itemDone ? 'bg-red-400' : accent.bar
                            )}
                            style={{ width: `${itemPercent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}