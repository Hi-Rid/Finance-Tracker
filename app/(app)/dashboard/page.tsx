import {
  Wallet,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Target,
  Heart,
  Receipt,
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { PageWrapper, PageHeader } from '@/components/layout/page-wrapper'
import { NetWorthCard } from '@/components/dashboard/net-worth-card'
import { CashFlowCard } from '@/components/dashboard/cash-flow-card'
import { InvestmentCard } from '@/components/dashboard/investment-card'
import { DonutChart } from '@/components/charts/donut-chart'
import { LineChart } from '@/components/charts/line-chart'
import { DailyBudgetFloating } from '@/components/dashboard/daily-budget-floating'
import { DailyBudgetDesktopCard } from '@/components/dashboard/daily-budget-desktop-card'
import { CHART_COLORS, CATEGORY_COLORS } from '@/lib/colors'
import { FadeIn } from '@/components/shared/fade-in'
import { createClient } from '@/lib/supabase/server'
import { computeDailyBudget, getTodayWIBRange } from '@/lib/utils/daily-budget'
import { getMonthRange, getCurrentMonth, formatMonthShort } from '@/lib/utils/month'
import { Amount } from '@/components/ui/amount'
import { cn } from '@/lib/utils'

function formatDateGroup(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()

  const dWIB = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
  const todayWIB = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayWIB = yesterday.toLocaleDateString('en-CA', {
    timeZone: 'Asia/Jakarta',
  })

  if (dWIB === todayWIB) return 'Hari ini'
  if (dWIB === yesterdayWIB) return 'Kemarin'

  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    timeZone: 'Asia/Jakarta',
  })
}

function groupTransactionsByDate<T extends { date: string }>(
  transactions: T[]
): Array<{ date: string; items: T[] }> {
  const map = new Map<string, T[]>()

  for (const tx of transactions) {
    const key = new Date(tx.date).toLocaleDateString('en-CA', {
      timeZone: 'Asia/Jakarta',
    })
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(tx)
  }

  return Array.from(map.entries())
    .map(([_, items]) => ({
      date: items[0].date,
      items,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_default', true)
    .order('created_at', { ascending: true })
    .limit(1)

  const profileId = profiles?.[0]?.id

  // ============ State variables ============
  let dailyBudgetData = {
    totalBudget: 0,
    totalSpent: 0,
    percentage: 0,
    remaining: 0,
    items: [] as Array<{ label: string; spent: number; total: number }>,
    unassignedSpent: 0,
    hasSetup: false,
  }

  let currentNetWorth = 0
  let netWorthTrend = 0
  let netWorthHistory: Array<{ month: string; value: number }> = []

  let currentCashFlow = 0
  let cashFlowTrend = 0
  let cashFlowSparkline: number[] = []
  let cashFlowLabels: string[] = []

  let currentInvestment = 0
  let investmentTrend = 0
  let investmentSparkline: number[] = []
  let investmentLabels: string[] = []

  let recentTransactions: Array<{
    id: string
    name: string
    amount_idr: number
    type: string
    date: string
    category_name: string | null
    account_name: string | null
  }> = []

  let expenseByCategory: Array<{
    name: string
    value: number
    color: string
  }> = []

  let monthlyTrend: Array<{
    name: string
    income: number
    expense: number
    saving: number
  }> = []

  let budgetProgress: Array<{
    label: string
    used: number
    total: number
  }> = []

  if (profileId) {
    const { start, end } = getTodayWIBRange()
    const currentMonth = getCurrentMonth()
    const { start: monthStart, end: monthEnd } = getMonthRange(currentMonth)

    const [
      itemsRes,
      todayTxRes,
      recentTxRes,
      categoriesRes,
      accountsRes,
      netWorthHistoryRes,
      allAccountsRes,
      cashFlowHistoryRes,
      expenseByCategoryRes,
      budgetPeriodsRes,
      budgetsRes,
    ] = await Promise.all([
      supabase
        .from('daily_budget_items')
        .select('*')
        .eq('profile_id', profileId)
        .order('sort_order', { ascending: true }),
      supabase
        .from('transactions')
        .select('category_id, daily_item_id, amount_idr')
        .eq('profile_id', profileId)
        .eq('is_deleted', false)
        .eq('type', 'expense')
        .eq('exclude_from_daily_budget', false)
        .gte('date', start)
        .lt('date', end),
      supabase
        .from('transactions')
        .select('id, name, amount_idr, type, date, category_id, account_id')
        .eq('profile_id', profileId)
        .eq('is_deleted', false)
        .order('date', { ascending: false })
        .limit(5),
      supabase.from('categories').select('*').eq('user_id', user.id),
      supabase
        .from('accounts')
        .select('id, name, type')
        .eq('profile_id', profileId),
      supabase.rpc('get_net_worth_history', {
        p_profile_id: profileId,
        p_months: 12,
      }),
      supabase
        .from('accounts')
        .select('type, current_balance')
        .eq('profile_id', profileId),
      supabase.rpc('get_cash_flow_history', {
        p_profile_id: profileId,
        p_months: 12,
      }),
      // Expense by category — bulan ini
      supabase
        .from('transactions')
        .select('category_id, amount_idr')
        .eq('profile_id', profileId)
        .eq('is_deleted', false)
        .eq('type', 'expense')
        .gte('date', monthStart)
        .lt('date', monthEnd),
      supabase
        .from('budget_periods')
        .select('*')
        .eq('profile_id', profileId)
        .eq('month', currentMonth)
        .maybeSingle(),
      supabase
        .from('budgets')
        .select('category_id, amount')
        .eq('profile_id', profileId)
        .eq('month', currentMonth),
    ])

    // ============ Daily budget ============
    dailyBudgetData = computeDailyBudget(
      itemsRes.data || [],
      (todayTxRes.data || []).map((t) => ({
        category_id: t.category_id,
        daily_item_id: t.daily_item_id,
        amount_idr: Number(t.amount_idr),
      }))
    )

    // ============ Categories map ============
    const catMap = new Map<string, { name: string; color: string }>()
    const catFullMap = new Map<string, { name: string; color: string }>()
      ; (categoriesRes.data || []).forEach((c) => {
        catMap.set(c.id, { name: c.name, color: c.color || '#64748b' })
        catFullMap.set(c.id, { name: c.name, color: c.color || '#64748b' })
      })

    const accMap = new Map<string, string>()
      ; (accountsRes.data || []).forEach((a) => {
        accMap.set(a.id, a.name)
      })

    // ============ Recent transactions ============
    recentTransactions = (recentTxRes.data || []).map((tx) => ({
      id: tx.id,
      name: tx.name,
      amount_idr: Number(tx.amount_idr),
      type: tx.type,
      date: tx.date,
      category_name: tx.category_id
        ? catMap.get(tx.category_id)?.name || null
        : null,
      account_name: tx.account_id ? accMap.get(tx.account_id) || null : null,
    }))

    // ============ Net worth + Investment ============
    let totalNetWorth = 0
    let totalInvestment = 0
      ; (allAccountsRes.data || []).forEach((a) => {
        const balance = Number(a.current_balance)
        totalNetWorth += balance
        if (a.type === 'investment') totalInvestment += balance
      })
    currentNetWorth = totalNetWorth
    currentInvestment = totalInvestment

    const historyRaw = (netWorthHistoryRes.data || []) as Array<{
      month: string
      net_worth: number | string
    }>
    const historyAsc = [...historyRaw].reverse()
    netWorthHistory = historyAsc.map((h) => ({
      month: h.month,
      value: Number(h.net_worth),
    }))

    if (netWorthHistory.length >= 2) {
      const curr = netWorthHistory[netWorthHistory.length - 1].value
      const prev = netWorthHistory[netWorthHistory.length - 2].value
      if (prev !== 0) {
        netWorthTrend = ((curr - prev) / Math.abs(prev)) * 100
      } else if (curr > 0) {
        netWorthTrend = 100
      }
    }

    // ============ Cash flow ============
    const cfRaw = (cashFlowHistoryRes.data || []) as Array<{
      month: string
      income: number | string
      expense: number | string
      net: number | string
    }>
    const cfAsc = [...cfRaw].reverse()

    if (cfAsc.length >= 1) {
      currentCashFlow = Number(cfAsc[cfAsc.length - 1].net)
    }

    if (cfAsc.length >= 2) {
      const curr = Number(cfAsc[cfAsc.length - 1].net)
      const prev = Number(cfAsc[cfAsc.length - 2].net)
      if (prev !== 0) {
        cashFlowTrend = ((curr - prev) / Math.abs(prev)) * 100
      } else if (curr > 0) {
        cashFlowTrend = 100
      } else if (curr < 0) {
        cashFlowTrend = -100
      }
    }

    const last6 = cfAsc.slice(-6)
    cashFlowSparkline = last6.map((m) => Number(m.net))
    cashFlowLabels = last6.map((m) => {
      const [y, mo] = m.month.split('-')
      const d = new Date(Number(y), Number(mo) - 1, 1)
      return d.toLocaleDateString('id-ID', {
        month: 'short',
        year: '2-digit',
      })
    })

    // Investment sparkline (flat dulu karena belum ada history investasi)
    investmentSparkline = [currentInvestment, currentInvestment]
    investmentLabels = ['Sekarang', 'Sekarang']
    investmentTrend = 0

    // ============ Expense by category (real) ============
    const catAgg = new Map<string, number>()
      ; (expenseByCategoryRes.data || []).forEach((tx) => {
        if (!tx.category_id) return
        const curr = catAgg.get(tx.category_id) || 0
        catAgg.set(tx.category_id, curr + Number(tx.amount_idr))
      })

    expenseByCategory = Array.from(catAgg.entries())
      .map(([catId, value]) => {
        const cat = catFullMap.get(catId)
        return {
          name: cat?.name || 'Tanpa kategori',
          value,
          color: cat?.color || '#64748b',
        }
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)

    if (expenseByCategory.length === 0) {
      expenseByCategory = [
        { name: 'Belum ada data', value: 1, color: '#94a3b8' },
      ]
    }

    // ============ Monthly trend (real, 12 bulan) ============
    monthlyTrend = cfAsc.map((m) => ({
      name: formatMonthShort(m.month),
      income: Number(m.income) / 1_000_000,
      expense: Number(m.expense) / 1_000_000,
      saving: Number(m.net) / 1_000_000,
    }))

    // ============ Budget progress (real) ============
    const budgetsRaw = (budgetsRes.data || []) as Array<{
      category_id: string
      amount: number | string
    }>

    const spentByCat = new Map<string, number>()
      ; (expenseByCategoryRes.data || []).forEach((tx) => {
        if (!tx.category_id) return
        const curr = spentByCat.get(tx.category_id) || 0
        spentByCat.set(tx.category_id, curr + Number(tx.amount_idr))
      })

    budgetProgress = budgetsRaw.map((b) => {
      const cat = catFullMap.get(b.category_id)
      return {
        label: cat?.name || 'Tanpa nama',
        used: spentByCat.get(b.category_id) || 0,
        total: Number(b.amount),
      }
    })
  }

  const hasBudget = budgetProgress.length > 0

  return (
    <PageWrapper>
      {/* Header */}
      <FadeIn delay={0}>
        <PageHeader
          title="Dashboard"
          description="Ringkasan keuangan lu hari ini"
          action={
            <Button
              variant="primary"
              size="sm"
              asChild
              className="hidden md:inline-flex"
            >
              <Link href="/transactions?new=1">
                <Receipt className="w-4 h-4" />
                Catat Transaksi
              </Link>
            </Button>
          }
        />
      </FadeIn>

      {/* Row 1 — Net Worth + Daily Budget */}
      <FadeIn delay={0.05}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <div className="lg:col-span-2 h-full">
            <NetWorthCard
              value={currentNetWorth}
              trend={netWorthTrend}
              history={netWorthHistory}
            />
          </div>
          <div className="hidden lg:block h-full">
            <DailyBudgetDesktopCard data={dailyBudgetData} />
          </div>
        </div>
      </FadeIn>

      {/* Row 2 — Cash Flow + Investasi */}
      <FadeIn delay={0.07}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <CashFlowCard
            value={currentCashFlow}
            trend={cashFlowTrend}
            sparklineData={cashFlowSparkline}
            sparklineLabels={cashFlowLabels}
          />
          <InvestmentCard
            value={currentInvestment}
            trend={investmentTrend}
            sparklineData={investmentSparkline}
            sparklineLabels={investmentLabels}
          />
        </div>
      </FadeIn>

      {/* Row 3 — Transaksi + Pengeluaran */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
          {/* Transaksi Terakhir */}
          <Card className="lg:col-span-2 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Transaksi Terakhir</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {recentTransactions.length} transaksi terbaru
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/transactions">Lihat Semua</Link>
              </Button>
            </CardHeader>
            <CardContent className="flex-1">
              {recentTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    Belum ada transaksi
                  </p>
                  <Button variant="primary" size="sm" asChild>
                    <Link href="/transactions?new=1">
                      <Receipt className="w-4 h-4" />
                      Catat Transaksi
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  {groupTransactionsByDate(recentTransactions).map((group) => {
                    const dayNet = group.items.reduce((sum, tx) => {
                      if (tx.type === 'income') return sum + tx.amount_idr
                      if (tx.type === 'expense') return sum - tx.amount_idr
                      return sum
                    }, 0)

                    return (
                      <div key={group.date}>
                        <div className="flex items-center justify-between mb-2 px-2">
                          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {formatDateGroup(group.date)}
                          </p>
                          <Amount
                            value={dayNet}
                            sign="auto"
                            className={cn(
                              'text-[11px] font-semibold',
                              dayNet >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                            )}
                          />
                        </div>

                        <div className="space-y-0.5">
                          {group.items.map((tx) => {
                            const isIncome = tx.type === 'income'
                            const isTransfer = tx.type === 'transfer'
                            return (
                              <Link
                                key={tx.id}
                                href="/transactions"
                                className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div
                                    className={cn(
                                      'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                                      isIncome
                                        ? 'bg-emerald-500/10 text-emerald-600'
                                        : isTransfer
                                          ? 'bg-brand/10 text-brand'
                                          : 'bg-red-500/10 text-red-600'
                                    )}
                                  >
                                    {isIncome ? (
                                      <ArrowDownRight className="w-4 h-4" />
                                    ) : (
                                      <ArrowUpRight className="w-4 h-4" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate leading-tight">
                                      {tx.name}
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                      {tx.category_name || 'Tanpa kategori'}
                                      {tx.account_name && ` · ${tx.account_name}`}
                                    </p>
                                  </div>
                                </div>
                                <Amount
                                  value={tx.amount_idr}
                                  sign={
                                    isIncome
                                      ? 'positive'
                                      : isTransfer
                                        ? 'none'
                                        : 'negative'
                                  }
                                  className={cn(
                                    'text-sm font-semibold shrink-0 ml-2',
                                    isIncome
                                      ? 'text-emerald-600'
                                      : isTransfer
                                        ? 'text-brand'
                                        : 'text-slate-900 dark:text-white'
                                  )}
                                />
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pengeluaran per Kategori */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Pengeluaran per Kategori</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Breakdown bulan ini
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <DonutChart
                data={expenseByCategory}
                totalLabel="Total"
                height={220}
              />
              <div className="mt-5 flex-1 space-y-2.5">
                {expenseByCategory.map((cat) => {
                  const total = expenseByCategory.reduce(
                    (s, c) => s + c.value,
                    0
                  )
                  return (
                    <div
                      key={cat.name}
                      className="flex items-center gap-2.5 text-xs"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-slate-600 dark:text-slate-300 flex-1 truncate font-medium">
                        {cat.name}
                      </span>
                      <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                        {total > 0
                          ? Math.round((cat.value / total) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Row 4 — Trend Bulanan (full width) */}
      <FadeIn delay={0.15}>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Trend Bulanan</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Income, expense, saving (dalam juta)
            </p>
          </CardHeader>
          <CardContent>
            <LineChart
              data={monthlyTrend}
              series={[
                {
                  key: 'income',
                  label: 'Income',
                  color: CHART_COLORS.success,
                },
                {
                  key: 'expense',
                  label: 'Expense',
                  color: CHART_COLORS.danger,
                },
                {
                  key: 'saving',
                  label: 'Saving',
                  color: CHART_COLORS.primary,
                },
              ]}
              height={280}
              format="juta"
            />
          </CardContent>
        </Card>
      </FadeIn>

      {/* Row 5 — Budget Bulan Ini */}
      <FadeIn delay={0.2}>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Budget Bulan Ini</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {hasBudget
                ? `${budgetProgress.length} kategori di-budget`
                : 'Belum ada budget'}
            </p>
          </CardHeader>
          <CardContent>
            {hasBudget ? (
              <div className="space-y-5">
                {budgetProgress.map((budget) => {
                  const percentage =
                    budget.total > 0
                      ? (budget.used / budget.total) * 100
                      : 0
                  const variant =
                    percentage >= 100
                      ? 'danger'
                      : percentage >= 80
                        ? 'warning'
                        : 'success'
                  return (
                    <div key={budget.label}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">{budget.label}</span>
                        <span className="text-muted-foreground tabular-nums">
                          Rp {budget.used.toLocaleString('id-ID')} /{' '}
                          Rp {budget.total.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <Progress value={percentage} variant={variant} />
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <p className="text-sm text-muted-foreground">
                  Belum ada budget bulan ini
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/budget">Setup Budget</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      {/* Mobile Floating Daily Budget */}
      <DailyBudgetFloating data={dailyBudgetData} />
    </PageWrapper>
  )
}