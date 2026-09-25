import type { Database } from '@/types/database'

type InvTx = {
    type: string
    quantity: number
    amount: number
    date: string
}

/**
 * Compute cumulative invested (cost basis) per bulan.
 * Return array: { month: 'YYYY-MM', value: number }
 */
export function computeInvestmentHistory(
    txs: InvTx[],
    months: number
): Array<{ month: string; value: number }> {
    const now = new Date()
    const buckets: Array<{ month: string; value: number }> = []

    // Build map: YYYY-MM → net invested
    const monthlyNet = new Map<string, number>()

    for (const tx of txs) {
        const d = new Date(tx.date)
        const monthKey = d.toLocaleDateString('en-CA', {
            timeZone: 'Asia/Jakarta',
        }).slice(0, 7) // "YYYY-MM"

        const amount = Number(tx.amount) || 0
        const delta =
            tx.type === 'buy'
                ? amount
                : tx.type === 'sell'
                    ? -amount
                    : 0 // dividend/split/bonus gak ngubah cost basis

        monthlyNet.set(monthKey, (monthlyNet.get(monthKey) || 0) + delta)
    }

    // Build cumulative from N months ago to now
    let cumulative = 0
    const startMonth = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)

    for (let i = 0; i < months; i++) {
        const d = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1)
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

        cumulative += monthlyNet.get(monthKey) || 0

        buckets.push({
            month: monthKey,
            value: cumulative,
        })
    }

    return buckets
}

export function formatInvestmentMonth(month: string): string {
    const [y, m] = month.split('-')
    const d = new Date(Number(y), Number(m) - 1, 1)
    return d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
}