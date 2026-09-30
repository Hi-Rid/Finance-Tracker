'use client'

import { useState } from 'react'
import {
    Crown,
    TrendingUp,
    Calendar,
    Target,
    ArrowRight,
    Eye,
    EyeOff,
    ChevronDown,
    Info,
    Wallet,
    PiggyBank,
    CreditCard,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Amount } from '@/components/ui/amount'
import { Progress } from '@/components/ui/progress'
import { useHideAmounts } from '@/lib/stores/hide-amounts'
import { formatFiDate } from '@/lib/utils/financial-freedom'
import { cn } from '@/lib/utils'
import type { ResolvedFiParams } from '@/lib/utils/financial-freedom'
import type { FiServerData } from '@/lib/financial-freedom/types'

type Props = {
    resolved: ResolvedFiParams
    profileName: string
    serverData: FiServerData
}

export function FiHero({ resolved, profileName, serverData }: Props) {
    const { hidden, toggle } = useHideAmounts()
    const [breakdownOpen, setBreakdownOpen] = useState(false)

    const {
        fiNumber,
        currentNetWorth,
        fiProgress,
        fiDate,
        yearsToFi,
        nextMilestone,
        fiMultiplier,
        fiType,
        savingsRate,
        monthlyIncome,
        monthlyExpense,
    } = resolved

    const isAchieved = fiProgress >= 100
    const progressClamped = Math.min(fiProgress, 100)

    const variant = isAchieved
        ? 'success'
        : fiProgress >= 75
            ? 'success'
            : fiProgress >= 50
                ? 'warning'
                : 'default'

    const gap = nextMilestone
        ? Math.max(0, nextMilestone.target_amount - currentNetWorth)
        : 0

    const { accounts, assets, debts } = serverData.netWorth

    return (
        <Card className="relative overflow-hidden py-0 gap-0">
            <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-brand/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

            <CardContent className="relative p-4 sm:p-6 md:p-8">
                {/* Top */}
                <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className="relative shrink-0">
                            <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 blur-lg opacity-40" />
                            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                                <Crown
                                    className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                                    strokeWidth={2.4}
                                />
                            </div>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest leading-none mb-1">
                                Financial Freedom
                            </p>
                            <p className="text-xs sm:text-sm font-semibold tracking-tight leading-none truncate">
                                {profileName}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={toggle}
                        className={cn(
                            'w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0',
                            'text-slate-500 dark:text-slate-400',
                            'bg-slate-100 dark:bg-white/5',
                            'hover:bg-slate-200 dark:hover:bg-white/10 hover:text-brand dark:hover:text-white',
                            'transition-colors cursor-pointer'
                        )}
                        aria-label={hidden ? 'Tampilkan nominal' : 'Sembunyikan nominal'}
                    >
                        {hidden ? (
                            <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                    </button>
                </div>

                {/* FI Number */}
                <div className="mb-4 sm:mb-6">
                    <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
                        Target FI ({fiType} · {fiMultiplier}×)
                    </p>
                    <Amount
                        value={fiNumber}
                        className={cn(
                            'text-2xl sm:text-4xl md:text-6xl font-bold tracking-tight leading-none block break-all',
                            isAchieved
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-brand'
                        )}
                    />
                </div>

                {/* Progress */}
                <div className="mb-4 sm:mb-6">
                    <div className="flex items-end justify-between mb-2 gap-2 sm:gap-3">
                        <div className="min-w-0 flex-1">
                            <button
                                type="button"
                                onClick={() => setBreakdownOpen((v) => !v)}
                                className="flex items-center gap-1.5 group cursor-pointer"
                            >
                                <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest truncate">
                                    Aset Produktif
                                </p>
                                <ChevronDown
                                    className={cn(
                                        'w-3 h-3 text-muted-foreground transition-transform shrink-0',
                                        breakdownOpen && 'rotate-180'
                                    )}
                                />
                            </button>
                            <Amount
                                value={currentNetWorth}
                                className="text-base sm:text-2xl md:text-3xl font-bold tracking-tight block mt-1 break-all"
                            />
                        </div>
                        <div className="text-right shrink-0">
                            <p
                                className={cn(
                                    'text-2xl sm:text-4xl md:text-5xl font-bold tabular-nums leading-none',
                                    isAchieved
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-brand'
                                )}
                            >
                                {fiProgress.toFixed(1)}
                                <span className="text-base sm:text-xl md:text-2xl opacity-60">
                                    %
                                </span>
                            </p>
                        </div>
                    </div>

                    <Progress
                        value={progressClamped}
                        variant={variant}
                        className="h-2.5 sm:h-3"
                    />

                    {breakdownOpen && (
                        <div className="mt-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] p-3 space-y-2">
                            <BreakdownRow
                                icon={Wallet}
                                label="Saldo Akun"
                                value={accounts}
                                color="#334DAF"
                            />
                            <BreakdownRow
                                icon={PiggyBank}
                                label="Investasi"
                                value={assets}
                                color="#10b981"
                            />
                            {debts > 0 && (
                                <BreakdownRow
                                    icon={CreditCard}
                                    label="Utang"
                                    value={-debts}
                                    color="#ef4444"
                                    negative
                                />
                            )}
                            <div className="pt-2 mt-1 border-t border-slate-200 dark:border-white/10 flex justify-between items-center">
                                <span className="text-xs font-bold text-foreground">
                                    Total
                                </span>
                                <Amount
                                    value={currentNetWorth}
                                    className="text-sm font-bold text-brand"
                                />
                            </div>
                            <div className="flex items-start gap-2 pt-1">
                                <Info className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                    Cuma aset produktif (cash + investasi - utang). Properti &
                                    kendaraan gak dihitung karena gak generate income.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <StatCell
                        icon={Calendar}
                        label="Estimasi FI"
                        value={
                            isAchieved
                                ? 'Tercapai'
                                : fiDate
                                    ? formatFiDate(fiDate)
                                    : 'Belum bisa dihitung'
                        }
                        sub={
                            yearsToFi !== null && yearsToFi > 0
                                ? `${yearsToFi.toFixed(1)} tahun lagi`
                                : undefined
                        }
                    />
                    <StatCell
                        icon={TrendingUp}
                        label="Sisa ke FI"
                        value={Math.max(0, fiNumber - currentNetWorth)}
                        isAmount
                    />
                    <StatCell
                        icon={Target}
                        label="Next Milestone"
                        value={nextMilestone ? nextMilestone.label : 'Semua tercapai!'}
                        sub={
                            nextMilestone
                                ? `Kurang Rp ${Math.round(gap).toLocaleString('id-ID')}`
                                : undefined
                        }
                        accent={nextMilestone ? nextMilestone.emoji : '👑'}
                        className="col-span-2 md:col-span-1"
                    />
                </div>

                {/* Savings rate row */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <SmallStat
                        label="Savings Rate"
                        value={`${savingsRate.toFixed(1)}%`}
                        accent={
                            savingsRate >= 50
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : savingsRate >= 20
                                    ? 'text-brand'
                                    : 'text-amber-600 dark:text-amber-400'
                        }
                    />
                    <SmallStat
                        label="Nabung / Bulan"
                        valueNode={
                            <Amount
                                value={resolved.monthlySaving}
                                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white break-all"
                            />
                        }
                        sub={
                            hidden
                                ? undefined
                                : `dari Rp ${Math.round(monthlyIncome).toLocaleString('id-ID')} - Rp ${Math.round(monthlyExpense).toLocaleString('id-ID')}`
                        }
                    />
                    <SmallStat
                        label="Return Bersih"
                        value={`${(resolved.realReturn * 100).toFixed(1)}%`}
                        sub="setelah inflasi"
                        className="col-span-2 md:col-span-1"
                    />
                </div>

                {/* Next milestone callout */}
                {nextMilestone && (
                    <div className="rounded-xl sm:rounded-2xl bg-gradient-to-r from-brand/5 to-transparent border border-brand/20 p-3 sm:p-4 flex items-center gap-3">
                        <div className="text-xl sm:text-2xl shrink-0">
                            {nextMilestone.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-brand uppercase tracking-widest mb-0.5">
                                Selanjutnya
                            </p>
                            <p className="text-xs sm:text-sm font-bold truncate">
                                {nextMilestone.label}
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-snug mt-0.5">
                                {nextMilestone.description}
                            </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-brand shrink-0" />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function StatCell({
    icon: Icon,
    label,
    value,
    sub,
    isAmount = false,
    accent,
    className,
}: {
    icon?: any
    label: string
    value: string | number
    sub?: string
    isAmount?: boolean
    accent?: string
    className?: string
}) {
    return (
        <div
            className={cn(
                'rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-3 sm:p-3.5',
                className
            )}
        >
            <div className="flex items-center gap-1.5 mb-1.5">
                {accent ? (
                    <span className="text-sm leading-none">{accent}</span>
                ) : Icon ? (
                    <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                ) : null}
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest truncate">
                    {label}
                </p>
            </div>
            {isAmount && typeof value === 'number' ? (
                <Amount
                    value={value}
                    className="text-xs sm:text-base font-bold tracking-tight block break-all"
                />
            ) : (
                <p className="text-xs sm:text-base font-bold tracking-tight truncate">
                    {value}
                </p>
            )}
            {sub && (
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    {sub}
                </p>
            )}
        </div>
    )
}

function SmallStat({
    label,
    value,
    valueNode,
    sub,
    accent,
    className,
}: {
    label: string
    value?: string
    valueNode?: React.ReactNode
    sub?: string
    accent?: string
    className?: string
}) {
    return (
        <div
            className={cn(
                'rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-3 sm:p-3.5',
                className
            )}
        >
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest truncate mb-1.5">
                {label}
            </p>
            {valueNode ? (
                valueNode
            ) : (
                <p
                    className={cn(
                        'text-xs sm:text-sm font-bold tabular-nums tracking-tight truncate',
                        accent
                    )}
                >
                    {value}
                </p>
            )}
            {sub && (
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-snug">
                    {sub}
                </p>
            )}
        </div>
    )
}

function BreakdownRow({
    icon: Icon,
    label,
    value,
    color,
    negative = false,
}: {
    icon: any
    label: string
    value: number
    color: string
    negative?: boolean
}) {
    return (
        <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
                <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${color}18` }}
                >
                    <Icon className="w-3 h-3" style={{ color }} />
                </div>
                <span className="text-xs text-muted-foreground truncate">{label}</span>
            </div>
            <Amount
                value={Math.abs(value)}
                sign={negative ? 'negative' : 'none'}
                className="text-xs font-semibold shrink-0"
            />
        </div>
    )
}