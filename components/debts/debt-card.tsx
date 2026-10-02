'use client'

import {
    MoreVertical,
    Pencil,
    Trash2,
    CheckCircle2,
    Calendar,
    TrendingDown,
    TrendingUp,
    Wallet,
    AlertTriangle,
    HandCoins,
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
    DEBT_TYPE_COLORS,
    DEBT_TYPE_LABELS,
    type DebtType,
} from '@/lib/validators/debts'
import { formatDateShortWIB } from '@/lib/utils/datetime'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Debt = Database['public']['Tables']['debts']['Row']

type Props = {
    debt: Debt
    onPay: () => void
    onEdit: () => void
    onDelete: () => void
    onMarkPaid: () => void
}

export function DebtCard({ debt, onPay, onEdit, onDelete, onMarkPaid }: Props) {
    const type = debt.type as DebtType
    const typeColor = DEBT_TYPE_COLORS[type] || '#64748b'
    const typeLabel = DEBT_TYPE_LABELS[type] || type
    const isDebt = type === 'debt'
    const TypeIcon = isDebt ? TrendingDown : TrendingUp

    const principal = Number(debt.principal)
    const outstanding = Number(debt.outstanding)
    const paid = principal - outstanding
    const percent = principal > 0 ? (paid / principal) * 100 : 0
    const isPaid = debt.status === 'paid'
    const isOverdue = debt.status === 'overdue'
    const isCancelled = debt.status === 'cancelled'
    const isDone = isPaid || isCancelled

    // Days left
    let daysLeft: number | null = null
    if (debt.due_date && !isDone) {
        const dueD = new Date(debt.due_date).getTime()
        const now = Date.now()
        daysLeft = Math.ceil((dueD - now) / (1000 * 60 * 60 * 24))
    }

    const progressColor = isPaid
        ? '#10b981'
        : isOverdue
            ? '#ef4444'
            : typeColor

    return (
        <div
            className={cn(
                'group relative rounded-xl md:rounded-2xl border bg-card overflow-hidden transition-all',
                'hover:shadow-md hover:border-brand/40',
                isPaid
                    ? 'border-emerald-300 dark:border-emerald-500/40 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-500/[0.05]'
                    : isCancelled
                        ? 'border-slate-200 dark:border-white/10 opacity-60'
                        : isOverdue
                            ? 'border-red-300 dark:border-red-500/40 bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-500/[0.05]'
                            : 'border-slate-200 dark:border-white/10'
            )}
        >
            {/* Accent bar */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: progressColor }}
            />

            <div className="p-4 pl-5">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${typeColor}15` }}
                    >
                        <TypeIcon
                            className="w-4.5 h-4.5"
                            style={{ color: typeColor }}
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-0.5">
                            <h3
                                className={cn(
                                    'text-sm md:text-base font-bold leading-tight truncate flex-1',
                                    isDone && 'line-through text-muted-foreground'
                                )}
                            >
                                {debt.name}
                            </h3>
                            {isPaid && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            )}
                            {isOverdue && (
                                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                            )}
                        </div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            {typeLabel}
                        </p>
                    </div>
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
                                            onSelect={onPay}
                                            className="whitespace-nowrap"
                                        >
                                            <HandCoins className="w-4 h-4 mr-2 shrink-0" />
                                            {isDebt ? 'Bayar' : 'Terima'}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onSelect={onMarkPaid}
                                            className="whitespace-nowrap"
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" />
                                            Tandai Lunas
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onSelect={onEdit}
                                            className="whitespace-nowrap"
                                        >
                                            <Pencil className="w-4 h-4 mr-2 shrink-0" />
                                            Edit
                                        </DropdownMenuItem>
                                    </>
                                )}
                                <DropdownMenuSeparator />
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

                {/* Amount */}
                <div className="mb-3">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                        <div className="min-w-0">
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">
                                Sisa
                            </p>
                            <Amount
                                value={outstanding}
                                className={cn(
                                    'text-xl md:text-2xl font-bold leading-none block',
                                    isPaid
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : isOverdue
                                            ? 'text-red-600 dark:text-red-400'
                                            : 'text-slate-900 dark:text-white'
                                )}
                            />
                        </div>
                        <span
                            className="text-xs md:text-sm font-bold tabular-nums shrink-0"
                            style={{ color: progressColor }}
                        >
                            {Math.round(percent)}%
                        </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 flex-wrap">
                        <span>dari</span>
                        <Amount
                            value={principal}
                            className="inline text-[10px] font-semibold"
                        />
                    </p>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden mb-3">
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: `${Math.min(percent, 100)}%`,
                            backgroundColor: progressColor,
                        }}
                    />
                </div>

                {/* Meta */}
                <div className="space-y-1.5 mb-3">
                    {paid > 0 && !isPaid && (
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="text-muted-foreground">
                                Udah dibayar
                            </span>
                            <Amount
                                value={paid}
                                className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums"
                            />
                        </div>
                    )}

                    {debt.due_date && (
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                Jatuh tempo
                            </span>
                            <span
                                className={cn(
                                    'font-semibold tabular-nums',
                                    daysLeft !== null && daysLeft < 0 && !isDone
                                        ? 'text-red-600 dark:text-red-400'
                                        : daysLeft !== null && daysLeft <= 7 && !isDone
                                            ? 'text-amber-600 dark:text-amber-400'
                                            : 'text-slate-700 dark:text-slate-300'
                                )}
                            >
                                {formatDateShortWIB(debt.due_date)}
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

                    {Number(debt.interest_rate) > 0 && (
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="text-muted-foreground">
                                Bunga
                            </span>
                            <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                                {(Number(debt.interest_rate) * 100).toFixed(2)}%/thn
                            </span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                {!isDone && (
                    <Button
                        onClick={onPay}
                        variant="primary"
                        size="sm"
                        className="w-full h-9 gap-1.5"
                        style={{
                            backgroundColor: typeColor,
                            borderColor: typeColor,
                        }}
                    >
                        <Wallet className="w-3.5 h-3.5" />
                        {isDebt ? 'Bayar' : 'Terima'}
                    </Button>
                )}

                {isPaid && (
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                            Lunas 🎉
                        </p>
                    </div>
                )}

                {isOverdue && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                        <p className="text-[11px] font-bold text-red-700 dark:text-red-400">
                            Telat {daysLeft !== null ? Math.abs(daysLeft) : 0} hari
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}