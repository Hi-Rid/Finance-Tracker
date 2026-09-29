'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-wrapper'
import { HideAmountsButton } from '@/components/shared/hide-amounts-button'
import { Button } from '@/components/ui/button'
import { MonthPicker } from './month-picker'
import { DailyItemsList } from './daily-items-list'
import { MonthSummaryCard } from './month-summary-card'
import { MonthlyBudgetList } from './monthly-budget-list'
import { AIBudgetWizard } from './ai-budget-wizard'
import { getCurrentMonth } from '@/lib/utils/month'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type DailyItem = Database['public']['Tables']['daily_budget_items']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type BudgetPeriod = Database['public']['Tables']['budget_periods']['Row']
type Budget = Database['public']['Tables']['budgets']['Row']

type CategorySpent = {
    category_id: string
    spent: number
}

type BudgetPageProps = {
    profile: Profile
    initialMonth: string
    dailyItems: DailyItem[]
    categories: Category[]
    budgetPeriods: BudgetPeriod[]
    budgets: Budget[]
    categorySpent: CategorySpent[]
}

export function BudgetPage({
    profile,
    initialMonth,
    dailyItems,
    categories,
    budgetPeriods,
    budgets,
    categorySpent,
}: BudgetPageProps) {
    const [month, setMonth] = useState(initialMonth || getCurrentMonth())
    const [aiWizardOpen, setAiWizardOpen] = useState(false)

    const currentPeriod = budgetPeriods.find((p) => p.month === month) || null
    const income = Number(currentPeriod?.income || 0)

    return (
        <>
            <PageHeader
                title="Budget"
                description="Rencanakan & track pengeluaran lu"
            />

            {/* Row: Month Picker + Actions */}
            <div className="flex flex-col md:flex-row md:items-center gap-2.5 md:gap-3 mb-3 md:mb-4">
                <div className="flex-1 min-w-0">
                    <MonthPicker value={month} onChange={setMonth} />
                </div>

                <div className="flex items-center gap-2 shrink-0 justify-end">
                    <HideAmountsButton size="icon-sm" />
                    <Button
                        size="sm"
                        onClick={() => setAiWizardOpen(true)}
                        disabled={income <= 0}
                        className={cn(
                            'gap-1.5 h-9 md:h-10 px-3 md:px-4',
                            'bg-gradient-to-br from-brand to-brand/85 hover:from-brand/95 hover:to-brand/80',
                            'text-white font-semibold',
                            'shadow-md shadow-brand/25 hover:shadow-lg hover:shadow-brand/30',
                            'border border-brand/40',
                            'transition-all'
                        )}
                    >
                        <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">
                            AI Auto-Budgeting
                        </span>
                        <span className="sm:hidden">AI Budget</span>
                    </Button>
                </div>
            </div>

            {income <= 0 && (
                <div className="mb-3 md:mb-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-3 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                    <div className="text-xs text-muted-foreground leading-relaxed">
                        <strong className="text-foreground">Tips:</strong>{' '}
                        Set income bulan ini dulu (klik card Income & Alokasi
                        di bawah), baru pakai fitur AI Auto-Budgeting.
                    </div>
                </div>
            )}

            <div className="space-y-3 md:space-y-4">
                <MonthSummaryCard
                    profileId={profile.id}
                    month={month}
                    period={currentPeriod}
                    dailyItems={dailyItems}
                />

                <DailyItemsList
                    items={dailyItems}
                    categories={categories}
                    monthlyBudgets={budgets}
                    profileId={profile.id}
                    month={month}
                />

                <MonthlyBudgetList
                    budgets={budgets}
                    categories={categories}
                    categorySpent={categorySpent}
                    profileId={profile.id}
                    month={month}
                />
            </div>

            <AIBudgetWizard
                open={aiWizardOpen}
                onOpenChange={setAiWizardOpen}
                profileId={profile.id}
                month={month}
                income={income}
                onSuccess={() => setAiWizardOpen(false)}
            />
        </>
    )
}