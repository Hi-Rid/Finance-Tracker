import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { BudgetPage } from '@/components/budget/budget-page'
import { getCurrentMonth, getMonthRange } from '@/lib/utils/month'

export default async function BudgetPageContainer() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Profile default
    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .order('created_at', { ascending: true })
        .limit(1)

    const profile = profiles?.[0]

    if (!profile) {
        return (
            <PageWrapper>
                <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground">
                        Belum ada profile. Bikin profile dulu.
                    </p>
                </div>
            </PageWrapper>
        )
    }

    const currentMonth = getCurrentMonth()
    const { start, end } = getMonthRange(currentMonth)

    // Fetch data in parallel
    const [dailyItemsRes, categoriesRes, budgetPeriodsRes, budgetsRes, txRes] =
        await Promise.all([
            supabase
                .from('daily_budget_items')
                .select('*')
                .eq('profile_id', profile.id)
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: true }),
            supabase
                .from('categories')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_archived', false)
                .order('name'),
            supabase
                .from('budget_periods')
                .select('*')
                .eq('profile_id', profile.id)
                .order('month', { ascending: false })
                .limit(12),
            supabase
                .from('budgets')
                .select('*')
                .eq('profile_id', profile.id)
                .eq('month', currentMonth),
            supabase
                .from('transactions')
                .select('category_id, amount_idr, type')
                .eq('profile_id', profile.id)
                .eq('is_deleted', false)
                .eq('type', 'expense')
                .eq('exclude_from_budget', false)
                .gte('date', start)
                .lte('date', end),
        ])

    // Aggregate spend per category
    const spendMap = new Map<string, number>()
    for (const tx of txRes.data || []) {
        if (!tx.category_id) continue
        const current = spendMap.get(tx.category_id) || 0
        spendMap.set(tx.category_id, current + Number(tx.amount_idr))
    }
    const categorySpent = Array.from(spendMap.entries()).map(
        ([category_id, spent]) => ({ category_id, spent })
    )

    return (
        <PageWrapper>
            <BudgetPage
                profile={profile}
                initialMonth={currentMonth}
                dailyItems={dailyItemsRes.data || []}
                categories={categoriesRes.data || []}
                budgetPeriods={budgetPeriodsRes.data || []}
                budgets={budgetsRes.data || []}
                categorySpent={categorySpent}
            />
        </PageWrapper>
    )
}