'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
    MoreVertical,
    Plus,
    Minus,
    Pencil,
    Trash2,
    CheckCircle2,
    RotateCcw,
    Calendar,
    Trophy,
    TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Amount } from '@/components/ui/amount'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    GOAL_TYPE_LABELS,
    GOAL_TYPE_EMOJI,
    GOAL_TYPE_COLORS,
    type GoalType,
} from '@/lib/validators/goals'
import { formatDateShortWIB } from '@/lib/utils/datetime'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Goal = Database['public']['Tables']['goals']['Row']
type Contribution = Database['public']['Tables']['goal_contributions']['Row']

type Props = {
    goal: Goal
    contributions: Contribution[]
    onContribute: () => void
    onWithdraw: () => void
    onEdit: () => void
    onDelete: () => void
    onMarkAchieved: () => void
    onReactivate: () => void
}

export function GoalCard({
    goal,
    contributions,
    onContribute,
    onWithdraw,
    onEdit,
    onDelete,
    onMarkAchieved,
    onReactivate,
}: Props) {
    const type = goal.type as GoalType
    const color = GOAL_TYPE_COLORS[type] || '#64748b'
    const emoji = GOAL_TYPE_EMOJI[type] || '⭐'
    const typeLabel = GOAL_TYPE_LABELS[type] || 'Lainnya'

    const target = Number(goal.target_amount)
    const current = Number(goal.current_amount)
    const percent = target > 0 ? (current / target) * 100 : 0
    const remaining = Math.max(0, target - current)
    const isAchieved = goal.status === 'achieved'
    const isCancelled = goal.status === 'cancelled'
    const isDone = isAchieved || isCancelled

    // ============ DAYS LEFT ============
    let daysLeft: number | null = null
    if (goal.target_date && !isDone) {
        const targetD = new Date(goal.target_date).getTime()
        const now = Date.now()
        const diffDays = Math.ceil((targetD - now) / (1000 * 60 * 60 * 24))
        daysLeft = diffDays
    }

    // ============ MONTHLY SAVING NEEDED ============
    let monthlySaving: number | null = null
    if (daysLeft && daysLeft > 0 && remaining > 0) {
        const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30))
        monthlySaving = remaining / monthsLeft
    }

    // ============ COLOR VARIANTS ============
    const progressColor =
        percent >= 100
            ? '#10b981'
            : percent >= 75
                ? '#f59e0b'
                : percent >= 50
                    ? '#334DAF'
                    : color

    return (
        <div
            className={cn(
                'group relative rounded-xl md:rounded-2xl border bg-card overflow-hidden transition-all',
                'hover:shadow-md hover:border-brand/40',
                isAchieved
                    ? 'border-emerald-300 dark:border-emerald-500/40 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-500/[0.05]'
                    : isCancelled
                        ? 'border-slate-200 dark:border-white/10 opacity-60'
                        : 'border-slate-200 dark:border-white/10'
            )}
        >
            {/* Accent bar */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: progressColor }}
            />

            <div className="p-4 pl-5">
                {/* ============ HEADER ============ */}
                <div className="flex items-start gap-3 mb-3.5">
                    <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl"
                        style={{ backgroundColor: `${color}15` }}
                    >
                        {emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-0.5">
                            <h3
                                className={cn(
                                    'text-sm md:text-base font-bold leading-tight truncate flex-1',
                                    isDone && 'line-through text-muted-foreground'
                                )}
                            >
                                {goal.name}
                            </h3>
                            {isAchieved && (
                                <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                            )}
                        </div>
                        <p className="text-[10px] md:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            {typeLabel}
                        </p>
                    </div>

                    {/* Dropdown */}
                    <div className="-mt-1 -mr-1">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="h-7 w-7 shrink-0"
                                >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[180px]">
                                {!isDone && (
                                    <>
                                        <DropdownMenuItem
                                            onSelect={onContribute}
                                            className="whitespace-nowrap"
                                        >
                                            <Plus className="w-4 h-4 mr-2 shrink-0" />
                                            Setor Uang
                                        </DropdownMenuItem>
                                        {current > 0 && (
                                            <DropdownMenuItem
                                                onSelect={onWithdraw}
                                                className="whitespace-nowrap"
                                            >
                                                <Minus className="w-4 h-4 mr-2 shrink-0" />
                                                Tarik Uang
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onSelect={onEdit}
                                            className="whitespace-nowrap"
                                        >
                                            <Pencil className="w-4 h-4 mr-2 shrink-0" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onSelect={onMarkAchieved}
                                            className="whitespace-nowrap"
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" />
                                            Tandai Selesai
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                    </>
                                )}
                                {isAchieved && (
                                    <>
                                        <DropdownMenuItem
                                            onSelect={onReactivate}
                                            className="whitespace-nowrap"
                                        >
                                            <RotateCcw className="w-4 h-4 mr-2 shrink-0" />
                                            Aktifkan Lagi
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                    </>
                                )}
                                <DropdownMenuItem
                                    onSelect={onDelete}
                                    className="text-red-600 focus:text-red-600 whitespace-nowrap"
                                >
                                    <Trash2 className="w-4 h-4 mr-2 shrink-0" />
                                    Hapus
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* ============ AMOUNT ============ */}
                <div className="mb-3">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                        <Amount
                            value={current}
                            className={cn(
                                'text-xl md:text-2xl font-bold leading-none',
                                isAchieved
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-slate-900 dark:text-white'
                            )}
                        />
                        <span
                            className="text-xs md:text-sm font-bold tabular-nums shrink-0"
                            style={{ color: progressColor }}
                        >
                            {Math.round(percent)}%
                        </span>
                    </div>
                    <p className="text-[10px] md:text-[11px] text-muted-foreground flex items-center gap-1 flex-wrap">
                        <span>dari target</span>
                        <Amount
                            value={target}
                            className="inline text-[10px] md:text-[11px] font-semibold"
                        />
                    </p>
                </div>

                {/* ============ PROGRESS BAR ============ */}
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden mb-3">
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: `${Math.min(percent, 100)}%`,
                            backgroundColor: progressColor,
                        }}
                    />
                </div>

                {/* ============ META ============ */}
                <div className="space-y-1.5 mb-3">
                    {!isDone && remaining > 0 && (
                        <div className="flex items-center justify-between gap-2 text-[11px] md:text-xs">
                            <span className="text-muted-foreground">
                                Kurang
                            </span>
                            <Amount
                                value={remaining}
                                className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums"
                            />
                        </div>
                    )}

                    {goal.target_date && (
                        <div className="flex items-center justify-between gap-2 text-[11px] md:text-xs">
                            <span className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                Target
                            </span>
                            <span
                                className={cn(
                                    'font-semibold tabular-nums',
                                    daysLeft !== null && daysLeft < 0
                                        ? 'text-red-600 dark:text-red-400'
                                        : daysLeft !== null && daysLeft <= 30
                                            ? 'text-amber-600 dark:text-amber-400'
                                            : 'text-slate-700 dark:text-slate-300'
                                )}
                            >
                                {formatDateShortWIB(goal.target_date)}
                                {daysLeft !== null && !isDone && (
                                    <span className="text-muted-foreground font-normal ml-1">
                                        {daysLeft < 0
                                            ? `(${Math.abs(daysLeft)}h lewat)`
                                            : `(${daysLeft}h)`}
                                    </span>
                                )}
                            </span>
                        </div>
                    )}

                    {monthlySaving !== null && !isDone && (
                        <div className="flex items-center justify-between gap-2 text-[11px] md:text-xs">
                            <span className="flex items-center gap-1 text-muted-foreground">
                                <TrendingUp className="w-3 h-3" />
                                Nabung/bln
                            </span>
                            <Amount
                                value={monthlySaving}
                                className="font-semibold text-brand tabular-nums"
                            />
                        </div>
                    )}
                </div>

                {/* ============ ACTIONS (kalau aktif) ============ */}
                {!isDone && (
                    <Button
                        onClick={onContribute}
                        variant="primary"
                        size="sm"
                        className="w-full h-9 gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Setor Uang
                    </Button>
                )}

                {isAchieved && (
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <p className="text-[11px] md:text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            Target tercapai! 🎉
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}