'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/layout/page-wrapper'
import { MonthPicker } from './month-picker'
import { DailyItemsList } from './daily-items-list'
import { MonthSummaryCard } from './month-summary-card'
import { MonthlyBudgetList } from './monthly-budget-list'
import { getCurrentMonth } from '@/lib/utils/month'
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

    const currentPeriod = budgetPeriods.find((p) => p.month === month) || null

    return (
        <>
            <PageHeader
                title="Budget"
                description="Rencanakan & track pengeluaran lu"
            />

            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
                <MonthPicker value={month} onChange={setMonth} />
            </div>

            <div className="space-y-5">
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
        </>
    )
}