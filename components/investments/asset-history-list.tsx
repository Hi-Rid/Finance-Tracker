'use client'

import { TrendingDown, TrendingUp, Gift, Circle } from 'lucide-react'
import { Amount } from '@/components/ui/amount'
import { formatDateGroupWIB, formatTimeWIB } from '@/lib/utils/datetime'
import { cn } from '@/lib/utils'

type InvTx = {
    id: string
    type: string
    quantity: number
    price: number
    amount: number
    fee: number
    note: string | null
    date: string
    transaction_id: string | null
}

type AssetHistoryListProps = {
    transactions: InvTx[]
    assetType: string
    accountMap: Record<string, string>
    cashTransactions: Array<{
        id: string
        name: string
        type: string
        amount_idr: number
        account_id: string | null
        date: string
    }>
}

function getTxMeta(type: string) {
    if (type === 'buy')
        return {
            Icon: TrendingDown,
            label: 'Beli',
            color: 'text-red-600 dark:text-red-400',
            bg: 'bg-red-500/10',
            sign: 'negative' as const,
        }
    if (type === 'sell')
        return {
            Icon: TrendingUp,
            label: 'Jual',
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-500/10',
            sign: 'positive' as const,
        }
    if (type === 'dividend')
        return {
            Icon: Gift,
            label: 'Dividend',
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-500/10',
            sign: 'positive' as const,
        }
    return {
        Icon: Circle,
        label: type,
        color: 'text-slate-500',
        bg: 'bg-slate-500/10',
        sign: 'none' as const,
    }
}

function getQtyLabel(type: string) {
    if (type === 'stock') return 'lot'
    if (type === 'gold') return 'gr'
    if (type === 'bond') return 'unit'
    return 'unit'
}

function groupByDateKey(txs: InvTx[]) {
    const groups: Record<string, InvTx[]> = {}
    for (const t of txs) {
        const key = new Date(t.date).toLocaleDateString('en-CA', {
            timeZone: 'Asia/Jakarta',
        })
        if (!groups[key]) groups[key] = []
        groups[key].push(t)
    }
    return groups
}

export function AssetHistoryList({
    transactions,
    assetType,
    accountMap,
    cashTransactions,
}: AssetHistoryListProps) {
    const cashTxMap = new Map(cashTransactions.map((t) => [t.id, t]))
    const qtyLabel = getQtyLabel(assetType)

    if (transactions.length === 0) {
        return (
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">
                    Belum ada riwayat transaksi
                </p>
            </div>
        )
    }

    const grouped = groupByDateKey(transactions)
    const sortedDates = Object.keys(grouped).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
    )

    return (
        <div className="space-y-4">
            {sortedDates.map((dateKey) => (
                <div key={dateKey}>
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
                        {formatDateGroupWIB(grouped[dateKey][0].date)}
                    </p>

                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-card overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
                        {grouped[dateKey].map((tx) => {
                            const meta = getTxMeta(tx.type)
                            const Icon = meta.Icon
                            const cashTx = tx.transaction_id
                                ? cashTxMap.get(tx.transaction_id)
                                : null
                            const accountName = cashTx?.account_id
                                ? accountMap[cashTx.account_id]
                                : null

                            return (
                                <div key={tx.id} className="flex items-center gap-3 p-4">
                                    <div
                                        className={cn(
                                            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                                            meta.bg
                                        )}
                                    >
                                        <Icon className={cn('w-4 h-4', meta.color)} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline justify-between gap-2">
                                            <p className="text-sm font-semibold">{meta.label}</p>
                                            <Amount
                                                value={Number(tx.amount)}
                                                sign={meta.sign}
                                                className={cn('text-sm font-bold shrink-0', meta.color)}
                                            />
                                        </div>

                                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                            <span className="tabular-nums">
                                                {formatTimeWIB(tx.date)}
                                            </span>

                                            {tx.type !== 'dividend' && Number(tx.quantity) > 0 && (
                                                <>
                                                    <span>·</span>
                                                    <span className="tabular-nums">
                                                        {tx.quantity} {qtyLabel} @{' '}
                                                        <Amount
                                                            value={Number(tx.price)}
                                                            className="inline text-[11px] font-medium"
                                                        />
                                                    </span>
                                                </>
                                            )}

                                            {Number(tx.fee) > 0 && (
                                                <>
                                                    <span>·</span>
                                                    <span className="inline-flex items-center gap-1 tabular-nums">
                                                        fee{' '}
                                                        <Amount
                                                            value={Number(tx.fee)}
                                                            className="inline text-[11px] font-medium"
                                                        />
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        {accountName && (
                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                                via {accountName}
                                            </p>
                                        )}

                                        {tx.note && (
                                            <p className="text-[11px] text-muted-foreground mt-1 italic line-clamp-1">
                                                &quot;{tx.note}&quot;
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    )
}