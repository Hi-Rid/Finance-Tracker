'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    ArrowLeft,
    Plus,
    Minus,
    Gift,
    Building2,
    Bitcoin,
    LineChart,
    Coins,
    FileText,
    TrendingUp,
    RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Amount } from '@/components/ui/amount'
import { HideAmountsButton } from '@/components/shared/hide-amounts-button'
import { cn } from '@/lib/utils'
import { InvestmentDialogs, type DialogState } from './investment-dialogs'
import { AssetHistoryList } from './asset-history-list'
import type { AssetDetailData } from '@/lib/investments/actions'
import type { Database } from '@/types/database'

type Account = Database['public']['Tables']['accounts']['Row']

type AssetDetailProps = {
    data: AssetDetailData
    profileId: string
    accounts: Account[]
}

function getTypeMeta(type: string) {
    if (type === 'stock') return { Icon: Building2, label: 'Saham' }
    if (type === 'crypto') return { Icon: Bitcoin, label: 'Crypto' }
    if (type === 'mutual_fund') return { Icon: LineChart, label: 'Reksadana' }
    if (type === 'gold') return { Icon: Coins, label: 'Emas' }
    if (type === 'bond') return { Icon: FileText, label: 'Obligasi' }
    return { Icon: TrendingUp, label: type }
}

function getQtyLabel(type: string): string {
    if (type === 'stock') return 'lot'
    if (type === 'gold') return 'gram'
    if (type === 'bond') return 'unit'
    return 'unit'
}

function getPriceLabel(type: string): string {
    if (type === 'stock') return 'Harga / Lembar'
    if (type === 'gold') return 'Harga / Gram'
    return 'Harga / Unit'
}

function plBg(value: number) {
    if (value > 0)
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
    if (value < 0)
        return 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
    return 'bg-slate-500/10 border-slate-500/30 text-slate-700 dark:text-slate-300'
}

export function AssetDetail({ data, profileId, accounts }: AssetDetailProps) {
    const { asset, detail, metrics, priceEntry } = data
    const { Icon, label: typeLabel } = getTypeMeta(asset.type)
    const qtyLabel = getQtyLabel(asset.type)
    const ticker = detail?.ticker || asset.name
    const isProfit = metrics.pl >= 0

    const [dialog, setDialog] = useState<DialogState>({ type: 'none' })
    const closeDialog = () => setDialog({ type: 'none' })

    const position = {
        asset,
        detail,
        latest_price: metrics.currentPrice,
        price_source: priceEntry?.source || 'manual',
        price_fetched_at: priceEntry?.fetched_at || null,
        lot_held: metrics.lotHeld,
        avg_price: metrics.avgPrice,
        invested: metrics.invested,
        market_value: metrics.marketValue,
        pl: metrics.pl,
        pl_percent: metrics.plPercent,
    }

    return (
        <>
            <div className="space-y-5 md:space-y-6">
                {/* Top bar */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <Link href="/investments">
                            <ArrowLeft className="w-4 h-4" />
                            Portfolio
                        </Link>
                    </Button>

                    <HideAmountsButton size="icon-sm" />
                </div>

                {/* Hero card */}
                <div className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-card overflow-hidden shadow-sm">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200/60 dark:via-white/10 to-transparent" />

                    <div className="p-5 md:p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 mb-5">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center shrink-0">
                                    <Icon className="w-6 h-6 text-brand" strokeWidth={2.2} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                        <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">
                                            {ticker}
                                        </h1>
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand shrink-0">
                                            {typeLabel}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {asset.name}
                                    </p>
                                </div>
                            </div>

                            <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
                                {detail?.broker && (
                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400">
                                        {detail.broker}
                                    </span>
                                )}
                                {detail?.exchange && (
                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400">
                                        {detail.exchange}
                                    </span>
                                )}
                                {priceEntry && (
                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span>
                                            {priceEntry.source === 'yahoo' && 'Yahoo Finance'}
                                            {priceEntry.source === 'coingecko' && 'CoinGecko'}
                                            {priceEntry.source === 'manual' && 'Manual'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Market value */}
                        <div className="mb-5">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                                Market Value
                            </p>
                            <Amount
                                value={metrics.marketValue}
                                className="text-3xl md:text-4xl font-bold tracking-tight"
                            />
                        </div>

                        {/* P/L badge */}
                        <div
                            className={cn(
                                'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold',
                                plBg(metrics.pl)
                            )}
                        >
                            <Amount
                                value={metrics.pl}
                                sign={isProfit ? 'positive' : 'negative'}
                                className="text-xs font-semibold"
                            />
                            <span className="opacity-60">·</span>
                            <span className="tabular-nums">
                                {isProfit ? '+' : '−'}
                                {Math.abs(metrics.plPercent).toFixed(2)}%
                            </span>
                        </div>

                        {/* Grid */}
                        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <MetricCell
                                label="Lot"
                                value={String(metrics.lotHeld)}
                                sub={qtyLabel}
                            />
                            <AmountCell
                                label="Avg"
                                value={metrics.avgPrice}
                                sub={getPriceLabel(asset.type).replace('Harga / ', '')}
                            />
                            <AmountCell
                                label="Current"
                                value={metrics.currentPrice}
                                sub={priceEntry?.source || 'manual'}
                                loading={!priceEntry && metrics.currentPrice === 0}
                            />
                            <AmountCell
                                label="Invested"
                                value={metrics.invested}
                                sub="Cost basis"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="px-5 md:px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex gap-2">
                        <Button
                            variant="primary"
                            size="sm"
                            className="flex-1"
                            onClick={() => setDialog({ type: 'buy-more', position: position as any })}
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Beli Lagi
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                            onClick={() => setDialog({ type: 'sell', position: position as any })}
                        >
                            <Minus className="w-3.5 h-3.5" />
                            Jual
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                            onClick={() => setDialog({ type: 'dividend', position: position as any })}
                        >
                            <Gift className="w-3.5 h-3.5" />
                            Dividend
                        </Button>
                    </div>
                </div>

                {/* History */}
                <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h2 className="text-base font-semibold">Riwayat Transaksi</h2>
                        <span className="text-xs text-muted-foreground tabular-nums">
                            {data.transactions.length} transaksi
                        </span>
                    </div>

                    <AssetHistoryList
                        transactions={data.transactions}
                        assetType={asset.type}
                        accountMap={data.accountMap}
                        cashTransactions={data.cashTransactions}
                    />
                </div>
            </div>

            <InvestmentDialogs
                state={dialog}
                onClose={closeDialog}
                profileId={profileId}
                accounts={accounts}
            />
        </>
    )
}

function MetricCell({
    label,
    value,
    sub,
    loading = false,
}: {
    label: string
    value: string
    sub?: string
    loading?: boolean
}) {
    return (
        <div>
            <div className="flex items-center gap-1 mb-1">
                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {label}
                </p>
                {loading && <RefreshCw className="w-2.5 h-2.5 text-slate-400 animate-spin" />}
            </div>
            <p className="text-sm font-bold tabular-nums truncate">{value}</p>
            {sub && (
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{sub}</p>
            )}
        </div>
    )
}

function AmountCell({
    label,
    value,
    sub,
    loading = false,
}: {
    label: string
    value: number
    sub?: string
    loading?: boolean
}) {
    return (
        <div>
            <div className="flex items-center gap-1 mb-1">
                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {label}
                </p>
                {loading && <RefreshCw className="w-2.5 h-2.5 text-slate-400 animate-spin" />}
            </div>
            <Amount
                value={value}
                className="text-sm font-bold truncate"
            />
            {sub && (
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{sub}</p>
            )}
        </div>
    )
}