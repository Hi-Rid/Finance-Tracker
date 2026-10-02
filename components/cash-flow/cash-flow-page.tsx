'use client'

import { useMemo, useState, useEffect } from 'react'
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    ChevronDown,
    Loader2,
    Info,
    Calendar,
    Filter,
    ArrowRight,
    Receipt,
} from 'lucide-react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Area,
    AreaChart,
} from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { Amount } from '@/components/ui/amount'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { HideAmountsButton } from '@/components/shared/hide-amounts-button'
import { createClient } from '@/lib/supabase/client'
import { useHideAmounts } from '@/lib/stores/hide-amounts'
import { formatDateGroupWIB, formatTimeWIB } from '@/lib/utils/datetime'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Category = Database['public']['Tables']['categories']['Row']
type Account = Database['public']['Tables']['accounts']['Row']
type Transaction = Database['public']['Tables']['transactions']['Row']

type Props = {
    cashFlowHistory: Array<{
        month: string
        income: number | string
        expense: number | string
        net: number | string
    }>
    categories: Category[]
    accounts: Account[]
    profileId: string
}

type Range = '3M' | '6M' | '1Y'

const RANGE_OPTIONS: { value: Range; label: string; months: number }[] = [
    { value: '3M', label: '3 Bulan', months: 3 },
    { value: '6M', label: '6 Bulan', months: 6 },
    { value: '1Y', label: '1 Tahun', months: 12 },
]

function formatMonthShort(month: string): string {
    const [y, m] = month.split('-')
    const d = new Date(Number(y), Number(m) - 1, 1)
    return d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
}

function formatMonthLong(month: string): string {
    const [y, m] = month.split('-')
    const d = new Date(Number(y), Number(m) - 1, 1)
    return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

export function CashFlowPage({
    cashFlowHistory,
    categories,
    accounts,
    profileId,
}: Props) {
    const [range, setRange] = useState<Range>('6M')
    const [expandedMonth, setExpandedMonth] = useState<string | null>(null)
    const [filterAccount, setFilterAccount] = useState<string>('all')
    const { hidden } = useHideAmounts()

    const catMap = useMemo(() => {
        const map = new Map<string, Category>()
        categories.forEach((c) => map.set(c.id, c))
        return map
    }, [categories])

    const accountMap = useMemo(() => {
        const map = new Map<string, Account>()
        accounts.forEach((a) => map.set(a.id, a))
        return map
    }, [accounts])

    // ============ CHART DATA ============
    const chartData = useMemo(() => {
        const months = RANGE_OPTIONS.find((r) => r.value === range)?.months || 6
        const sliced = cashFlowHistory.slice(0, months).reverse()

        return sliced.map((h) => ({
            month: h.month,
            label: formatMonthShort(h.month),
            income: Number(h.income),
            expense: Number(h.expense),
            net: Number(h.net),
        }))
    }, [cashFlowHistory, range])

    // ============ SUMMARY ============
    const summary = useMemo(() => {
        const months = RANGE_OPTIONS.find((r) => r.value === range)?.months || 6
        const sliced = cashFlowHistory.slice(0, months)

        const totalIncome = sliced.reduce((s, h) => s + Number(h.income), 0)
        const totalExpense = sliced.reduce((s, h) => s + Number(h.expense), 0)
        const net = totalIncome - totalExpense
        const avgMonthlyIncome = sliced.length > 0 ? totalIncome / sliced.length : 0
        const avgMonthlyExpense = sliced.length > 0 ? totalExpense / sliced.length : 0
        const avgMonthlyNet = sliced.length > 0 ? net / sliced.length : 0

        return {
            totalIncome,
            totalExpense,
            net,
            avgMonthlyIncome,
            avgMonthlyExpense,
            avgMonthlyNet,
            monthsCount: sliced.length,
        }
    }, [cashFlowHistory, range])

    if (cashFlowHistory.length === 0) {
        return (
            <Card>
                <CardContent>
                    <EmptyState
                        icon={TrendingUp}
                        title="Belum ada data"
                        description="Catat transaksi dulu biar cash flow bisa ditampilkan."
                    />
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4 md:space-y-5">
            {/* ============ TOOLBAR ============ */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center p-0.5 md:p-1 rounded-lg md:rounded-xl bg-slate-100 dark:bg-white/5 gap-0.5 md:gap-1">
                    {RANGE_OPTIONS.map((opt) => {
                        const isActive = range === opt.value
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setRange(opt.value)}
                                className={cn(
                                    'px-2.5 md:px-3.5 py-1.5 md:py-2 rounded-md md:rounded-lg text-[11px] md:text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
                                    isActive
                                        ? 'bg-white dark:bg-white/10 text-brand shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                )}
                            >
                                {opt.label}
                            </button>
                        )
                    })}
                </div>
                <HideAmountsButton size="icon-sm" />
            </div>

            {/* ============ SUMMARY CARDS ============ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4">
                <StatCard
                    icon={ArrowDownRight}
                    label="Total Masuk"
                    value={summary.totalIncome}
                    color="#10b981"
                    sub={`${summary.monthsCount} bulan`}
                />
                <StatCard
                    icon={ArrowUpRight}
                    label="Total Keluar"
                    value={summary.totalExpense}
                    color="#ef4444"
                    sub={`${summary.monthsCount} bulan`}
                />
                <StatCard
                    icon={Wallet}
                    label="Net Total"
                    value={summary.net}
                    color={summary.net >= 0 ? '#334DAF' : '#ef4444'}
                    sub={summary.net >= 0 ? 'Surplus' : 'Defisit'}
                />
                <StatCard
                    icon={TrendingUp}
                    label="Avg Net/Bulan"
                    value={summary.avgMonthlyNet}
                    color={summary.avgMonthlyNet >= 0 ? '#f59e0b' : '#ef4444'}
                    sub="Rata-rata bulanan"
                />
            </div>

            {/* ============ MAIN CHART ============ */}
            <Card className="py-0 gap-0">
                <CardContent className="p-4 md:p-6">
                    <div className="flex items-center gap-2 mb-3 md:mb-5">
                        <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                        <div>
                            <h3 className="text-sm md:text-base font-bold">
                                Trend Cash Flow
                            </h3>
                            <p className="text-[10px] md:text-xs text-muted-foreground">
                                Income, expense, dan net per bulan
                            </p>
                        </div>
                    </div>
                    <div className="w-full h-[280px] md:h-[340px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={chartData}
                                margin={{
                                    top: 10,
                                    right: 8,
                                    left: -8,
                                    bottom: 0,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="currentColor"
                                    className="text-slate-200 dark:text-white/5"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="label"
                                    stroke="currentColor"
                                    className="text-slate-400 dark:text-slate-500"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={8}
                                />
                                <YAxis
                                    stroke="currentColor"
                                    className="text-slate-400 dark:text-slate-500"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    width={52}
                                    tickFormatter={(v) => {
                                        if (hidden) return '•••'
                                        if (Math.abs(v) >= 1_000_000_000)
                                            return `${(v / 1_000_000_000).toFixed(1)}M`
                                        if (Math.abs(v) >= 1_000_000) {
                                            const jt = v / 1_000_000
                                            return jt >= 100 || jt <= -100
                                                ? `${jt.toFixed(0)}jt`
                                                : `${jt.toFixed(1)}jt`
                                        }
                                        return `${(v / 1_000).toFixed(0)}rb`
                                    }}
                                />
                                <Tooltip
                                    cursor={{
                                        stroke: 'var(--color-border)',
                                        strokeWidth: 1,
                                        strokeDasharray: '3 3',
                                    }}
                                    contentStyle={{
                                        backgroundColor: 'var(--color-card)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        padding: '10px 14px',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                                    }}
                                    formatter={(value: any, name: any) => {
                                        if (hidden) return ['•••', name]
                                        return [
                                            `Rp ${Number(value).toLocaleString('id-ID')}`,
                                            name,
                                        ]
                                    }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    content={() => (
                                        <div className="flex items-center justify-center gap-5 pt-4 pb-1">
                                            <LegendDot
                                                color="#10b981"
                                                label="Income"
                                            />
                                            <LegendDot
                                                color="#ef4444"
                                                label="Expense"
                                            />
                                            <LegendDot
                                                color="#334DAF"
                                                label="Net"
                                            />
                                        </div>
                                    )}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="income"
                                    name="Income"
                                    stroke="#10b981"
                                    strokeWidth={2.5}
                                    dot={{ r: 3, strokeWidth: 2, fill: 'var(--color-card)' }}
                                    activeDot={{ r: 5, strokeWidth: 2 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="expense"
                                    name="Expense"
                                    stroke="#ef4444"
                                    strokeWidth={2.5}
                                    dot={{ r: 3, strokeWidth: 2, fill: 'var(--color-card)' }}
                                    activeDot={{ r: 5, strokeWidth: 2 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="net"
                                    name="Net"
                                    stroke="#334DAF"
                                    strokeWidth={2.5}
                                    strokeDasharray="6 4"
                                    dot={{ r: 3, strokeWidth: 2, fill: 'var(--color-card)' }}
                                    activeDot={{ r: 5, strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* ============ MONTHLY BREAKDOWN ============ */}
            <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="text-sm md:text-base font-bold">
                        Detail Per Bulan
                    </h3>
                    <span className="text-[10px] md:text-xs text-muted-foreground">
                        Klik untuk expand
                    </span>
                </div>

                <div className="space-y-2">
                    {cashFlowHistory
                        .slice(
                            0,
                            RANGE_OPTIONS.find((r) => r.value === range)
                                ?.months || 6
                        )
                        .map((h) => (
                            <MonthRow
                                key={h.month}
                                month={h.month}
                                income={Number(h.income)}
                                expense={Number(h.expense)}
                                net={Number(h.net)}
                                profileId={profileId}
                                catMap={catMap}
                                accountMap={accountMap}
                                filterAccount={filterAccount}
                                onFilterAccountChange={setFilterAccount}
                                accounts={accounts}
                                isExpanded={expandedMonth === h.month}
                                onToggle={() =>
                                    setExpandedMonth(
                                        expandedMonth === h.month
                                            ? null
                                            : h.month
                                    )
                                }
                            />
                        ))}
                </div>
            </div>

            {/* ============ INFO ============ */}
            <div className="rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-3 md:p-4 flex gap-2.5">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[11px] md:text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Cash flow dihitung dari transaksi tipe income & expense.
                    Transfer antar akun & transaksi dengan flag{' '}
                    <strong>exclude from reports</strong> gak dihitung.
                </p>
            </div>
        </div>
    )
}

// ============================================================
// MONTH ROW (expandable)
// ============================================================

function MonthRow({
    month,
    income,
    expense,
    net,
    profileId,
    catMap,
    accountMap,
    filterAccount,
    onFilterAccountChange,
    accounts,
    isExpanded,
    onToggle,
}: {
    month: string
    income: number
    expense: number
    net: number
    profileId: string
    catMap: Map<string, Category>
    accountMap: Map<string, Account>
    filterAccount: string
    onFilterAccountChange: (v: string) => void
    accounts: Account[]
    isExpanded: boolean
    onToggle: () => void
}) {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(false)
    const [loaded, setLoaded] = useState(false)
    const supabase = createClient()

    // ============ FETCH TRANSACTIONS ON EXPAND ============
    useEffect(() => {
        if (!isExpanded || loaded) return

        async function fetchTxs() {
            setLoading(true)
            const [y, m] = month.split('-').map(Number)
            const start = new Date(y, m - 1, 1)
            const end = new Date(y, m, 1)

            const { data } = await supabase
                .from('transactions')
                .select('*')
                .eq('profile_id', profileId)
                .eq('is_deleted', false)
                .eq('exclude_from_reports', false)
                .in('type', ['income', 'expense'])
                .gte('date', start.toISOString())
                .lt('date', end.toISOString())
                .order('date', { ascending: false })

            setTransactions((data || []) as Transaction[])
            setLoaded(true)
            setLoading(false)
        }

        fetchTxs()
    }, [isExpanded, loaded, month, profileId, supabase])

    // ============ FILTER BY ACCOUNT ============
    const filtered = useMemo(() => {
        if (filterAccount === 'all') return transactions
        return transactions.filter((t) => t.account_id === filterAccount)
    }, [transactions, filterAccount])

    // ============ GROUP BY DATE ============
    const grouped = useMemo(() => {
        const groups = new Map<string, Transaction[]>()
        filtered.forEach((t) => {
            const key = new Date(t.date).toLocaleDateString('en-CA', {
                timeZone: 'Asia/Jakarta',
            })
            if (!groups.has(key)) groups.set(key, [])
            groups.get(key)!.push(t)
        })
        return Array.from(groups.entries()).sort(
            (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
        )
    }, [filtered])

    const netColor =
        net >= 0
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-red-600 dark:text-red-400'

    return (
        <div className="rounded-xl md:rounded-2xl border border-slate-200 dark:border-white/10 bg-card overflow-hidden">
            {/* Header */}
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center gap-3 p-3.5 md:p-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer text-left"
            >
                <div
                    className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                        net >= 0
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
                    )}
                >
                    <Calendar className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm md:text-base font-bold truncate">
                        {formatMonthLong(month)}
                    </p>
                    <div className="flex items-center gap-2 md:gap-3 mt-0.5 md:mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[10px] md:text-xs text-emerald-600 dark:text-emerald-400">
                            <ArrowDownRight className="w-3 h-3" />
                            <Amount value={income} className="text-[10px] md:text-xs" />
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] md:text-xs text-red-600 dark:text-red-400">
                            <ArrowUpRight className="w-3 h-3" />
                            <Amount value={expense} className="text-[10px] md:text-xs" />
                        </span>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                        Net
                    </p>
                    <Amount
                        value={net}
                        sign={net >= 0 ? 'positive' : 'negative'}
                        className={cn('text-sm md:text-base font-bold', netColor)}
                    />
                </div>
                <ChevronDown
                    className={cn(
                        'w-4 h-4 text-slate-400 transition-transform shrink-0',
                        isExpanded && 'rotate-180'
                    )}
                />
            </button>

            {/* Expanded content */}
            {isExpanded && (
                <div className="border-t border-slate-100 dark:border-white/5">
                    {/* Filter akun */}
                    <div className="px-3.5 md:px-4 py-2.5 flex items-center gap-2 border-b border-slate-100 dark:border-white/5">
                        <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <Select
                            value={filterAccount}
                            onValueChange={onFilterAccountChange}
                        >
                            <SelectTrigger className="h-8 w-full text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Akun</SelectItem>
                                {accounts.map((a) => (
                                    <SelectItem key={a.id} value={a.id}>
                                        {a.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Loading */}
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-brand" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-6 text-center">
                            <p className="text-xs text-muted-foreground">
                                {filterAccount === 'all'
                                    ? 'Belum ada transaksi di bulan ini'
                                    : 'Belum ada transaksi di akun ini'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-[400px] overflow-y-auto">
                            {grouped.map(([dateKey, items]) => (
                                <div key={dateKey}>
                                    {/* Date header */}
                                    <div className="px-3.5 md:px-4 py-1.5 bg-slate-50/60 dark:bg-white/[0.02] sticky top-0 backdrop-blur-sm">
                                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            {formatDateGroupWIB(
                                                items[0].date
                                            )}
                                        </p>
                                    </div>

                                    {/* Transactions */}
                                    {items.map((tx) => {
                                        const isIncome = tx.type === 'income'
                                        const cat = tx.category_id
                                            ? catMap.get(tx.category_id)
                                            : null
                                        const acc = tx.account_id
                                            ? accountMap.get(tx.account_id)
                                            : null

                                        return (
                                            <div
                                                key={tx.id}
                                                className="px-3.5 md:px-4 py-2.5 flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                                            >
                                                <div
                                                    className={cn(
                                                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                                                        isIncome
                                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                                    )}
                                                >
                                                    {isIncome ? (
                                                        <ArrowDownRight className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs md:text-sm font-medium truncate">
                                                        {tx.name}
                                                    </p>
                                                    <div className="flex items-center gap-1 md:gap-1.5 mt-0.5 text-[10px] md:text-[11px] text-slate-500 dark:text-slate-400">
                                                        <span className="tabular-nums shrink-0">
                                                            {formatTimeWIB(tx.date)}
                                                        </span>
                                                        {cat && (
                                                            <>
                                                                <span className="opacity-40">·</span>
                                                                <span className="truncate">
                                                                    {cat.name}
                                                                </span>
                                                            </>
                                                        )}
                                                        {acc && (
                                                            <>
                                                                <span className="opacity-40">·</span>
                                                                <span className="truncate">
                                                                    {acc.name}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <Amount
                                                    value={Number(tx.amount_idr)}
                                                    sign={isIncome ? 'positive' : 'negative'}
                                                    className={cn(
                                                        'text-xs md:text-sm font-bold shrink-0 tabular-nums',
                                                        isIncome
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : 'text-slate-900 dark:text-white'
                                                    )}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ============================================================
// HELPERS
// ============================================================

function StatCard({
    icon: Icon,
    label,
    value,
    color,
    sub,
}: {
    icon: any
    label: string
    value: number
    color: string
    sub?: string
}) {
    return (
        <div className="rounded-xl md:rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-3 md:p-4">
            <div
                className="w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center mb-2 md:mb-3"
                style={{ backgroundColor: `${color}15` }}
            >
                <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" style={{ color }} />
            </div>
            <p className="text-[9px] md:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 md:mb-1">
                {label}
            </p>
            <Amount
                value={value}
                className="text-base md:text-xl font-bold leading-tight block break-all"
            />
            {sub && (
                <p className="text-[10px] md:text-[11px] text-muted-foreground mt-1 truncate">
                    {sub}
                </p>
            )}
        </div>
    )
}

function LegendDot({ color, label }: { color: string; label: string }) {
    return (
        <div className="flex items-center gap-2">
            <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
            />
            <span className="text-xs text-muted-foreground font-medium">
                {label}
            </span>
        </div>
    )
}