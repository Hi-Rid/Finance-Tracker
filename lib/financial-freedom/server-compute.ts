import { createClient } from '@/lib/supabase/server'
import { getCurrentMonth, getMonthRange, addMonths } from '@/lib/utils/month'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

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
 * Resolve supabase client: pakai yang dikirim, atau fallback ke cookie-based.
 * Di cron, caller WAJIB kirim admin client (RLS bypass).
 * Di user flow, caller bisa gak kirim → fallback ke cookie client.
 */
async function resolveSupabase(
    client?: SupabaseClient<Database>
): Promise<SupabaseClient<Database>> {
    return client ?? (await createClient())
}

/**
 * Hitung net worth untuk FI Progress.
 *
 * Definisi:
 * - Semua accounts non-archived (cash, bank, ewallet, investment, envelope)
 * - Investment assets non-archived (stock, crypto, mutual_fund, gold, bond)
 * - MINUS active debts (utang outstanding)
 *
 * Kenapa exclude property/vehicle: bukan investable asset buat FI.
 */
export async function computeNetWorth(
    profileId: string,
    supabase?: SupabaseClient<Database>
): Promise<NetWorthBreakdown> {
    const sb = await resolveSupabase(supabase)

    const [accountsRes, assetsRes, debtsRes] = await Promise.all([
        sb
            .from('accounts')
            .select('current_balance')
            .eq('profile_id', profileId)
            .eq('is_archived', false),
        sb
            .from('assets')
            .select('current_value')
            .eq('profile_id', profileId)
            .eq('is_archived', false)
            .in('type', INVESTMENT_ASSET_TYPES as unknown as string[]),
        sb
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

export async function computeAvgMonthlyExpense(
    profileId: string,
    supabase?: SupabaseClient<Database>
): Promise<number> {
    const sb = await resolveSupabase(supabase)

    const currentMonth = getCurrentMonth()
    const threeMonthsAgo = addMonths(currentMonth, -3)
    const { start } = getMonthRange(threeMonthsAgo)
    const { end } = getMonthRange(currentMonth)

    const { data } = await sb
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

export async function computeMonthlyIncome(
    profileId: string,
    supabase?: SupabaseClient<Database>
): Promise<{ value: number; source: 'budget' | 'transactions' | 'none' }> {
    const sb = await resolveSupabase(supabase)
    const currentMonth = getCurrentMonth()

    // Priority 1: budget_periods bulan ini
    const { data: period } = await sb
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

    const { data } = await sb
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

export async function computeTopCategories(
    profileId: string,
    userId: string,
    limit = 5,
    supabase?: SupabaseClient<Database>
): Promise<CategorySpending[]> {
    const sb = await resolveSupabase(supabase)

    const currentMonth = getCurrentMonth()
    const threeMonthsAgo = addMonths(currentMonth, -3)
    const { start } = getMonthRange(threeMonthsAgo)
    const { end } = getMonthRange(currentMonth)

    const [txRes, catRes] = await Promise.all([
        sb
            .from('transactions')
            .select('category_id, amount_idr')
            .eq('profile_id', profileId)
            .eq('is_deleted', false)
            .eq('type', 'expense')
            .eq('exclude_from_reports', false)
            .gte('date', start)
            .lte('date', end),
        sb.from('categories').select('id, name').eq('user_id', userId),
    ])

    const catMap = new Map((catRes.data || []).map((c) => [c.id, c.name]))
    const agg = new Map<string, number>()

    for (const tx of txRes.data || []) {
        if (!tx.category_id) continue
        agg.set(
            tx.category_id,
            (agg.get(tx.category_id) || 0) + Number(tx.amount_idr)
        )
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
    supabase?: SupabaseClient<Database>
}): Promise<FinancialFreedomServerData> {
    const { profileId, userId, supabase } = params

    const [netWorth, avgExpense, income, topCategories] = await Promise.all([
        computeNetWorth(profileId, supabase),
        computeAvgMonthlyExpense(profileId, supabase),
        computeMonthlyIncome(profileId, supabase),
        computeTopCategories(profileId, userId, 5, supabase),
    ])

    return { netWorth, avgExpense, income, topCategories }
}