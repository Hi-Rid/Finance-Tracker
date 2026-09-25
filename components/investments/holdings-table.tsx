'use client'

import { Building2, Bitcoin, LineChart, TrendingUp, MoreVertical, Plus, Minus, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatRupiah } from '@/lib/normalize'
import { cn } from '@/lib/utils'
import type { InvestmentPosition } from '@/lib/investments/types'

type HoldingsTableProps = {
    positions: InvestmentPosition[]
    onSell: (position: InvestmentPosition) => void
    onDividend: (position: InvestmentPosition) => void
    onBuyMore: (position: InvestmentPosition) => void
}

function getTypeMeta(type: string) {
    if (type === 'stock') return { Icon: Building2, label: 'Saham' }
    if (type === 'crypto') return { Icon: Bitcoin, label: 'Crypto' }
    if (type === 'mutual_fund') return { Icon: LineChart, label: 'Reksadana' }
    return { Icon: TrendingUp, label: type }
}

function plColor(value: number) {
    if (value > 0) return 'text-emerald-600 dark:text-emerald-400'
    if (value < 0) return 'text-red-600 dark:text-red-400'
    return 'text-slate-500 dark:text-slate-400'
}

function plBg(value: number) {
    if (value > 0) return 'bg-emerald-500/10 border-emerald-500/20'
    if (value < 0) return 'bg-red-500/10 border-red-500/20'
    return 'bg-slate-500/10 border-slate-500/20'
}

export function HoldingsTable({
    positions,
    onSell,
    onDividend,
    onBuyMore,
}: HoldingsTableProps) {
    if (positions.length === 0) {
        return null
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {positions.map((p) => (
                <HoldingCard
                    key={p.asset.id}
                    position={p}
                    onSell={() => onSell(p)}
                    onDividend={() => onDividend(p)}
                    onBuyMore={() => onBuyMore(p)}
                />
            ))}
        </div>
    )
}

function HoldingCard({
    position,
    onSell,
    onDividend,
    onBuyMore,
}: {
    position: InvestmentPosition
    onSell: () => void
    onDividend: () => void
    onBuyMore: () => void
}) {
    const { Icon, label } = getTypeMeta(position.asset.type)
    const isProfit = position.pl > 0
    const isLoss = position.pl < 0
    const ticker = position.detail?.ticker || position.asset.name

    return (
        <div className="group relative rounded-2xl border border-slate-200 dark:border-white/10 bg-card overflow-hidden shadow-sm hover:shadow-md hover:border-brand/30 transition-all">
            {/* Top shine */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200/60 dark:via-white/10 to-transparent" />

            <div className="p-5">
                {/* ============ Header ============ */}
                <div className="flex items-start justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-brand" strokeWidth={2.2} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <h3 className="text-base font-bold tracking-tight truncate">
                                    {ticker}
                                </h3>
                                <Badge
                                    variant="outline"
                                    className="text-[9px] px-1.5 py-0 shrink-0 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-white/20"
                                >
                                    {label}
                                </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">
                                {position.asset.name}
                            </p>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="shrink-0 -mt-1 -mr-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[180px]">
                            <DropdownMenuItem onSelect={onBuyMore} className="whitespace-nowrap">
                                <Plus className="w-4 h-4 mr-2 shrink-0" />
                                Beli Lagi
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={onSell} className="whitespace-nowrap">
                                <Minus className="w-4 h-4 mr-2 shrink-0" />
                                Jual
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={onDividend} className="whitespace-nowrap">
                                <Gift className="w-4 h-4 mr-2 shrink-0" />
                                Catat Dividend
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* ============ Hero: Market Value + P/L badge ============ */}
                <div className="mb-5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Market Value
                    </p>
                    <div className="flex items-baseline justify-between gap-3 flex-wrap">
                        <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                            {formatRupiah(position.market_value)}
                        </p>
                        <div
                            className={cn(
                                'inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-bold tabular-nums',
                                plBg(position.pl),
                                plColor(position.pl)
                            )}
                        >
                            {isProfit && '+'}
                            {isLoss && '−'}
                            {Math.abs(position.pl_percent).toFixed(2)}%
                        </div>
                    </div>
                    <p className={cn('text-xs font-medium tabular-nums mt-1', plColor(position.pl))}>
                        {isProfit ? '+' : isLoss ? '−' : ''}
                        {formatRupiah(Math.abs(position.pl))} P/L
                    </p>
                </div>

                {/* ============ Breakdown 3-col ============ */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                    <Metric label="Lot" value={String(position.lot_held)} />
                    <Metric label="Avg" value={formatRupiah(position.avg_price)} />
                    <Metric label="Current" value={formatRupiah(position.latest_price)} />
                </div>
            </div>

            {/* ============ Invested footer ============ */}
            <div className="px-5 py-3 bg-slate-50/60 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Total Invested
                </span>
                <span className="text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                    {formatRupiah(position.invested)}
                </span>
            </div>
        </div>
    )
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                {label}
            </p>
            <p className="text-xs font-semibold tabular-nums text-slate-900 dark:text-white truncate">
                {value}
            </p>
        </div>
    )
}