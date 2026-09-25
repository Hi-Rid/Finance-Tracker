import type { Database } from '@/types/database'
import type {
    AssetType,
    InvestmentPosition,
    PortfolioData,
    PortfolioSummary,
} from './types'
import type { AssetPriceResult } from './types'

type Asset = Database['public']['Tables']['assets']['Row']
type Detail = Database['public']['Tables']['investment_details']['Row']

/**
 * IDX saham: 1 lot = 100 lembar.
 * Crypto, mutual fund: 1 unit = 1.
 */
export function getLotMultiplier(type: AssetType): number {
    return type === 'stock' ? 100 : 1
}

type ComputeInput = {
    assets: Asset[]
    details: Detail[]
    prices: Map<string, AssetPriceResult>
    tradingBalance: number
    realizedPl?: number
}

export function computePortfolio(input: ComputeInput): PortfolioData {
    const { assets, details, prices, tradingBalance, realizedPl = 0 } = input

    const detailByAssetId = new Map(details.map((d) => [d.asset_id, d]))

    const positions: InvestmentPosition[] = assets
        .filter((a) => !a.is_archived && Number(a.quantity) > 0)
        .map((asset) => {
            const detail = detailByAssetId.get(asset.id) || null
            const priceEntry = prices.get(asset.id)

            const lotHeld = Number(asset.quantity)
            const multiplier = getLotMultiplier(asset.type as AssetType)
            const avgPrice = detail?.avg_price ? Number(detail.avg_price) : 0
            const currentPrice = priceEntry?.price || 0

            const invested = lotHeld * avgPrice * multiplier
            const marketValue = lotHeld * currentPrice * multiplier
            const pl = marketValue - invested
            const plPercent = invested > 0 ? (pl / invested) * 100 : 0

            return {
                asset,
                detail,
                latest_price: currentPrice,
                price_source: priceEntry?.source || 'manual',
                price_fetched_at: priceEntry?.fetched_at || null,
                lot_held: lotHeld,
                avg_price: avgPrice,
                invested,
                market_value: marketValue,
                pl,
                pl_percent: plPercent,
            }
        })
        .sort((a, b) => b.market_value - a.market_value)

    // ============ Summary ============
    const totalInvested = positions.reduce((s, p) => s + p.invested, 0)
    const totalMarketValue = positions.reduce((s, p) => s + p.market_value, 0)
    const netPl = totalMarketValue - totalInvested
    const netPlPercent = totalInvested > 0 ? (netPl / totalInvested) * 100 : 0

    const summary: PortfolioSummary = {
        trading_balance: tradingBalance,
        total_invested: totalInvested,
        total_market_value: totalMarketValue,
        net_pl: netPl,
        net_pl_percent: netPlPercent,
        realized_pl: realizedPl,
        total_equity: tradingBalance + totalMarketValue,
        open_positions: positions.length,
    }

    return { summary, positions }
}

/**
 * Hitung realized P/L dari seri investment_transactions.
 *
 * Pakai average cost method (konsisten dengan Stockbit):
 *   - Buy    : qty += lot, cost += amount
 *   - Sell   : avg = cost/qty; realized += (sell_price - avg) × lot_sold; qty -= lot; cost -= avg × lot_sold
 *   - Dividend: gak ngubah cost basis
 *
 * @param txs         investment_transactions untuk 1 asset, sorted by date asc
 * @param multiplier  100 untuk saham (1 lot = 100 lembar), 1 untuk lainnya
 * @returns           total realized P/L (bisa negatif kalau loss)
 */
export function computeRealizedPl(
    txs: Array<{ type: string; quantity: number; amount: number }>,
    multiplier: number
): number {
    let runningQty = 0
    let runningCost = 0
    let realized = 0

    for (const tx of txs) {
        const qty = Number(tx.quantity) || 0
        const amount = Number(tx.amount) || 0

        if (tx.type === 'buy') {
            runningQty += qty
            runningCost += amount
        } else if (tx.type === 'sell') {
            if (runningQty <= 0) continue

            const avgCostPerLot = runningCost / runningQty
            const soldQty = Math.min(qty, runningQty)
            const costBasis = avgCostPerLot * soldQty
            const proceeds = amount // gross proceeds (belum dikurangi fee)

            realized += proceeds - costBasis

            runningQty -= soldQty
            runningCost -= costBasis
        }
        // dividend / split / bonus: skip — gak ngubah cost basis
    }

    return realized
}