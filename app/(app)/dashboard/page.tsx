import {
  Wallet,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Target,
  Heart,
  Receipt,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ProgressRing } from '@/components/ui/progress-ring'
import { Button } from '@/components/ui/button'
import { PageWrapper, PageHeader } from '@/components/layout/page-wrapper'
import { StatCard } from '@/components/dashboard/stat-card'
import { MiniAreaChart } from '@/components/charts/mini-area-chart'
import { DonutChart } from '@/components/charts/donut-chart'
import { LineChart } from '@/components/charts/line-chart'
import { DailyBudgetFloating } from '@/components/dashboard/daily-budget-floating'
import { CHART_COLORS, CATEGORY_COLORS } from '@/lib/colors'
import { FadeIn } from '@/components/shared/fade-in'

const netWorthHistory = [8.5, 9.2, 9.8, 10.5, 11.2, 12.5]
const cashFlowHistory = [2.1, 3.2, 2.8, 4.1, 3.5, 4.8]
const investmentHistory = [1.5, 1.8, 2.2, 2.5, 3.0, 3.5]

const expenseByCategory = [
  { name: 'Meals', value: 620000, color: CATEGORY_COLORS[0] },
  { name: 'Transport', value: 145000, color: CATEGORY_COLORS[1] },
  { name: 'Hygiene', value: 130000, color: CATEGORY_COLORS[2] },
  { name: 'Wifi', value: 50000, color: CATEGORY_COLORS[3] },
  { name: 'Other', value: 80000, color: CATEGORY_COLORS[4] },
]

const monthlyTrend = [
  { name: 'Mei', income: 5.0, expense: 3.2, saving: 1.8 },
  { name: 'Jun', income: 5.0, expense: 2.9, saving: 2.1 },
  { name: 'Jul', income: 5.0, expense: 3.5, saving: 1.5 },
  { name: 'Agu', income: 5.0, expense: 3.0, saving: 2.0 },
  { name: 'Sep', income: 5.0, expense: 3.8, saving: 1.2 },
  { name: 'Okt', income: 5.0, expense: 3.4, saving: 1.6 },
]

const recentTransactions = [
  { id: 1, name: 'Gacoan lv 4', amount: -15000, category: 'Meals' },
  { id: 2, name: 'Gaji Oktober', amount: 5000000, category: 'Income' },
  { id: 3, name: 'Jago susu', amount: -8000, category: 'Meals' },
  { id: 4, name: 'Bensin', amount: -30000, category: 'Transport' },
]

export default function DashboardPage() {
  return (
    <PageWrapper>
      {/* Header */}
      <FadeIn delay={0}>
        <PageHeader
          title="Dashboard"
          description="Ringkasan keuangan lu hari ini"
          action={
            <Button variant="primary" size="sm">
              <Receipt className="w-4 h-4" />
              Catat Transaksi
            </Button>
          }
        />
      </FadeIn>

      {/* Row 1 — Stat Cards */}
      <FadeIn delay={0.05}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          <StatCard
            title="Net Worth"
            value="Rp 12.500.000"
            icon={<Wallet className="w-5 h-5" />}
            trend={2.5}
            sparklineData={netWorthHistory}
            accentColor={CHART_COLORS.primary}
          />
          <StatCard
            title="Cash Flow"
            value="Rp 4.800.000"
            icon={<TrendingUp className="w-5 h-5" />}
            trend={8.3}
            sparklineData={cashFlowHistory}
            accentColor={CHART_COLORS.success}
          />
          <StatCard
            title="Investasi"
            value="Rp 3.500.000"
            icon={<ArrowUpRight className="w-5 h-5" />}
            trend={-1.2}
            sparklineData={investmentHistory}
            accentColor={CHART_COLORS.warning}
          />
        </div>
      </FadeIn>

      {/* Row 2 — Chart + Daily Budget */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Net Worth Trend</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  6 bulan terakhir
                </p>
              </div>
              <Badge variant="success">
                <TrendingUp className="w-3 h-3" />
                +47%
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <MiniAreaChart data={netWorthHistory} height={220} />
              </div>
            </CardContent>
          </Card>

          <div className="hidden md:block">
            <Card>
              <CardHeader>
                <CardTitle>Daily Budget</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Senin, 19 Okt 2026
                </p>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <ProgressRing
                  value={64}
                  label="Terpakai"
                  size={160}
                  strokeWidth={14}
                />
                <div className="mt-6 w-full space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Terpakai</span>
                    <span className="font-semibold tabular-nums">Rp 45.000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sisa</span>
                    <span className="font-semibold tabular-nums text-emerald-600">
                      Rp 25.000
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </FadeIn>

      {/* Row 3 — Donut + Line Chart */}
      <FadeIn delay={0.15}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Pengeluaran per Kategori</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Breakdown bulan ini
              </p>
            </CardHeader>
            <CardContent>
              <DonutChart
                data={expenseByCategory}
                totalLabel="Total"
                height={220}
              />
              <div className="grid grid-cols-2 gap-2 mt-4">
                {expenseByCategory.map((cat) => (
                  <div
                    key={cat.name}
                    className="flex items-center gap-2 text-xs"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-muted-foreground flex-1 truncate">
                      {cat.name}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {Math.round((cat.value / 1025000) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
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
                  { key: 'income', label: 'Income', color: CHART_COLORS.success },
                  { key: 'expense', label: 'Expense', color: CHART_COLORS.danger },
                  { key: 'saving', label: 'Saving', color: CHART_COLORS.primary },
                ]}
                height={260}
                format="juta"
              />
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Row 4 — Budget Progress + Recent Transactions */}
      <FadeIn delay={0.2}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Budget Bulan Ini</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Sisa 12 hari lagi
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { label: 'Meals', used: 620000, total: 940000 },
                { label: 'Transport', used: 145000, total: 180000 },
                { label: 'Hygiene', used: 130000, total: 130000 },
              ].map((budget) => {
                const percentage = (budget.used / budget.total) * 100
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Transaksi Terakhir</CardTitle>
              <Button variant="ghost" size="sm">
                Lihat Semua
              </Button>
            </CardHeader>
            <CardContent className="space-y-1">
              {recentTransactions.map((tx) => {
                const isIncome = tx.amount > 0
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isIncome
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-red-500/10 text-red-600'
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{tx.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {tx.category}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`text-sm font-semibold tabular-nums ${
                        isIncome ? 'text-emerald-600' : 'text-foreground'
                      }`}
                    >
                      {isIncome ? '+' : ''}Rp{' '}
                      {Math.abs(tx.amount).toLocaleString('id-ID')}
                    </p>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Row 5 — Wishlist & Goals */}
      <FadeIn delay={0.25}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-400/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <CardTitle>Wishlist Aktif</CardTitle>
                <p className="text-sm text-muted-foreground">
                  3 item hampir tercapai
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'Meja Etife', saved: 350000, target: 542500 },
                { name: 'Luther Loafer', saved: 620000, target: 802000 },
              ].map((item) => {
                const percent = (item.saved / item.target) * 100
                return (
                  <div key={item.name}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {Math.round(percent)}%
                      </span>
                    </div>
                    <Progress value={percent} variant="default" />
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <CardTitle>Goals</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Progress menuju target
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'Emergency Fund', saved: 5000000, target: 15000000 },
                { name: 'Liburan Bali', saved: 2000000, target: 5000000 },
              ].map((goal) => {
                const percent = (goal.saved / goal.target) * 100
                return (
                  <div key={goal.name}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">{goal.name}</span>
                      <span className="text-muted-foreground tabular-nums">
                        Rp {(goal.saved / 1000000).toFixed(1)}jt /{' '}
                        {(goal.target / 1000000).toFixed(1)}jt
                      </span>
                    </div>
                    <Progress value={percent} variant="success" />
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Mobile Floating Daily Budget */}
      <DailyBudgetFloating spent={61000} budget={70000} />
    </PageWrapper>
  )
}