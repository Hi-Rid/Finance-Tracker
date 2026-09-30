import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { getCurrentMonth, getMonthRange, addMonths } from '@/lib/utils/month'

// ============================================================
// NET WORTH - investable only
// ============================================================

const INVESTMENT_ASSET_TYPES = [
    'stock',
    'crypto',
    'mutual_fund',
    'gold',
    'bond',
] as const

export type NetWorthBreakdown = {
    accounts: number
    assets: number
    debts: number
    total: number
}

/**
 * Hitung net worth untuk FI Progress.
 *
 * Definisi (dari plan Final Decision #1 → opsi B):
 * - Semua accounts non-archived (cash, bank, ewallet, investment, envelope)
 * - Investment assets non-archived (stock, crypto, mutual_fund, gold, bond)
 * - MINUS active debts (utang outstanding)
 *
 * Kenapa exclude property/vehicle: bukan investable asset buat FI.
 */
export async function computeNetWorth(
    profileId: string
): Promise<NetWorthBreakdown> {
    const supabase = await createClient()

    const [accountsRes, assetsRes, debtsRes] = await Promise.all([
        supabase
            .from('accounts')
            .select('current_balance')
            .eq('profile_id', profileId)
            .eq('is_archived', false),
        supabase
            .from('assets')
            .select('current_value')
            .eq('profile_id', profileId)
            .eq('is_archived', false)
            .in('type', INVESTMENT_ASSET_TYPES as unknown as string[]),
        supabase
            .from('debts')
            .select('outstanding')
            .eq('profile_id', profileId)
            .eq('status', 'active'),
    ])

    const accounts = (accountsRes.data || []).reduce(
        (s, a) => s + Number(a.current_balance),
        0
    )
    const assets = (assetsRes.data || []).reduce(
        (s, a) => s + Number(a.current_value),
        0
    )
    const debts = (debtsRes.data || []).reduce(
        (s, d) => s + Number(d.outstanding),
        0
    )

    return { accounts, assets, debts, total: accounts + assets - debts }
}

// ============================================================
// AVERAGE EXPENSE - 3 bulan terakhir
// ============================================================

/**
 * Rata-rata monthly expense dari 3 bulan terakhir (WIB).
 *
 * Filter:
 * - type = 'expense'
 * - exclude_from_reports = false (paling ketat & konsisten)
 * - is_deleted = false
 *
 * Fallback kalau belum ada transaksi expense: pakai 0
 * (page nanti handle: kalau 0, section parameter minta user override manual).
 */
export async function computeAvgMonthlyExpense(
    profileId: string
): Promise<number> {
    const supabase = await createClient()

    const currentMonth = getCurrentMonth()
    const threeMonthsAgo = addMonths(currentMonth, -3)
    const { start } = getMonthRange(threeMonthsAgo)
    const { end } = getMonthRange(currentMonth)

    const { data } = await supabase
        .from('transactions')
        .select('amount_idr')
        .eq('profile_id', profileId)
        .eq('is_deleted', false)
        .eq('type', 'expense')
        .eq('exclude_from_reports', false)
        .gte('date', start)
        .lte('date', end)

    const total = (data || []).reduce((s, t) => s + Number(t.amount_idr), 0)
    return total / 3
}

// ============================================================
// AVERAGE INCOME - hybrid
// ============================================================

/**
 * Income bulanan dengan prioritas:
 * 1. `budget_periods.income` bulan ini (kalau user set di /budget)
 * 2. Avg income transactions 3 bulan terakhir (fallback)
 *
 * Return { value, source } biar UI bisa nunjukin asalnya.
 */
export async function computeMonthlyIncome(
    profileId: string
): Promise<{ value: number; source: 'budget' | 'transactions' | 'none' }> {
    const supabase = await createClient()
    const currentMonth = getCurrentMonth()

    // Priority 1: budget_periods bulan ini
    const { data: period } = await supabase
        .from('budget_periods')
        .select('income')
        .eq('profile_id', profileId)
        .eq('month', currentMonth)
        .maybeSingle()

    if (period && Number(period.income) > 0) {
        return { value: Number(period.income), source: 'budget' }
    }

    // Priority 2: avg income 3 bulan
    const threeMonthsAgo = addMonths(currentMonth, -3)
    const { start } = getMonthRange(threeMonthsAgo)
    const { end } = getMonthRange(currentMonth)

    const { data } = await supabase
        .from('transactions')
        .select('amount_idr')
        .eq('profile_id', profileId)
        .eq('is_deleted', false)
        .eq('type', 'income')
        .eq('exclude_from_reports', false)
        .gte('date', start)
        .lte('date', end)

    const total = (data || []).reduce((s, t) => s + Number(t.amount_idr), 0)
    if (total > 0) {
        return { value: total / 3, source: 'transactions' }
    }

    return { value: 0, source: 'none' }
}

// ============================================================
// TOP EXPENSE CATEGORIES (buat AI context)
// ============================================================

export type CategorySpending = {
    name: string
    amount: number
    percent: number
}

/**
 * Top N kategori expense dari 3 bulan terakhir.
 * Buat AI context - biar advisor bisa tunjuk mana yang bisa dipangkas.
 */
export async function computeTopCategories(
    profileId: string,
    userId: string,
    limit = 5
): Promise<CategorySpending[]> {
    const supabase = await createClient()

    const currentMonth = getCurrentMonth()
    const threeMonthsAgo = addMonths(currentMonth, -3)
    const { start } = getMonthRange(threeMonthsAgo)
    const { end } = getMonthRange(currentMonth)

    const [txRes, catRes] = await Promise.all([
        supabase
            .from('transactions')
            .select('category_id, amount_idr')
            .eq('profile_id', profileId)
            .eq('is_deleted', false)
            .eq('type', 'expense')
            .eq('exclude_from_reports', false)
            .gte('date', start)
            .lte('date', end),
        supabase.from('categories').select('id, name').eq('user_id', userId),
    ])

    const catMap = new Map((catRes.data || []).map((c) => [c.id, c.name]))
    const agg = new Map<string, number>()

    for (const tx of txRes.data || []) {
        if (!tx.category_id) continue
        agg.set(tx.category_id, (agg.get(tx.category_id) || 0) + Number(tx.amount_idr))
    }

    const grandTotal = Array.from(agg.values()).reduce((s, v) => s + v, 0)
    if (grandTotal <= 0) return []

    return Array.from(agg.entries())
        .map(([catId, amount]) => ({
            name: catMap.get(catId) || 'Tanpa kategori',
            amount: amount / 3, // monthly avg
            percent: (amount / grandTotal) * 100,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, limit)
}

// ============================================================
// COMPOSITE - 1 call, semua server data
// ============================================================

export type FinancialFreedomServerData = {
    netWorth: NetWorthBreakdown
    avgExpense: number
    income: { value: number; source: 'budget' | 'transactions' | 'none' }
    topCategories: CategorySpending[]
}

export async function fetchFinancialFreedomServerData(params: {
    profileId: string
    userId: string
}): Promise<FinancialFreedomServerData> {
    const [netWorth, avgExpense, income, topCategories] = await Promise.all([
        computeNetWorth(params.profileId),
        computeAvgMonthlyExpense(params.profileId),
        computeMonthlyIncome(params.profileId),
        computeTopCategories(params.profileId, params.userId),
    ])

    return { netWorth, avgExpense, income, topCategories }
}