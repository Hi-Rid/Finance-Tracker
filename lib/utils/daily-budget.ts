import type { Database } from '@/types/database'

type DailyItem = Database['public']['Tables']['daily_budget_items']['Row']
type TransactionInput = {
    category_id: string | null
    daily_item_id: string | null
    amount_idr: number
}

export type DailyBudgetBreakdownItem = {
    label: string
    spent: number
    total: number
}

export type DailyBudgetData = {
    totalBudget: number
    totalSpent: number
    percentage: number
    remaining: number
    items: DailyBudgetBreakdownItem[]
    unassignedSpent: number
    hasSetup: boolean
}

/**
 * Compute daily budget.
 *
 * Setiap transaksi di-match ke daily item lewat `daily_item_id`.
 * Transaksi tanpa `daily_item_id` = "unassigned" (gak masuk breakdown item,
 * tapi tetep masuk total spent).
 */
export function computeDailyBudget(
    items: DailyItem[],
    todayTransactions: TransactionInput[]
): DailyBudgetData {
    const activeItems = items.filter((i) => i.is_active)
    const totalBudget = activeItems.reduce((s, i) => s + Number(i.amount), 0)
    const totalSpent = todayTransactions.reduce(
        (s, t) => s + Number(t.amount_idr),
        0
    )

    if (activeItems.length === 0) {
        return {
            totalBudget: 0,
            totalSpent,
            percentage: 0,
            remaining: 0,
            items: [],
            unassignedSpent: totalSpent,
            hasSetup: false,
        }
    }

    // Per-item spend = sum transaksi dengan daily_item_id = item.id
    const breakdownItems: DailyBudgetBreakdownItem[] = activeItems.map(
        (item) => {
            const itemSpent = todayTransactions
                .filter((t) => t.daily_item_id === item.id)
                .reduce((s, t) => s + Number(t.amount_idr), 0)

            return {
                label: item.name,
                spent: itemSpent,
                total: Number(item.amount),
            }
        }
    )

    // Unassigned = transaksi tanpa daily_item_id
    const unassignedSpent = todayTransactions
        .filter((t) => !t.daily_item_id)
        .reduce((s, t) => s + Number(t.amount_idr), 0)

    const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
    const remaining = totalBudget - totalSpent

    return {
        totalBudget,
        totalSpent,
        percentage,
        remaining,
        items: breakdownItems,
        unassignedSpent,
        hasSetup: true,
    }
}

/**
 * Cek apakah date string jatuh di hari ini (WIB).
 */
export function isTodayWIB(dateStr: string): boolean {
    const d = new Date(dateStr)
    const now = new Date()

    const dateWIB = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
    const todayWIB = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

    return dateWIB === todayWIB
}

/**
 * Get range "hari ini" dalam UTC untuk query Supabase.
 */
export function getTodayWIBRange(): { start: string; end: string } {
    const now = new Date()

    // Get current date in WIB as YYYY-MM-DD (timezone-agnostic)
    const wibDateStr = now.toLocaleDateString('en-CA', {
        timeZone: 'Asia/Jakarta',
    })

    // WIB midnight (UTC+7) — explicit, gak gantung server TZ
    const startWIB = new Date(`${wibDateStr}T00:00:00+07:00`)
    const endWIB = new Date(startWIB)
    endWIB.setDate(endWIB.getDate() + 1)

    return {
        start: startWIB.toISOString(),
        end: endWIB.toISOString(),
    }
}