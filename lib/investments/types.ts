import type { Database } from '@/types/database'

type AssetRow = Database['public']['Tables']['assets']['Row']
type InvestmentDetailRow = Database['public']['Tables']['investment_details']['Row']

export type AssetType = 'property' | 'vehicle' | 'gold' | 'stock' | 'crypto' | 'mutual_fund' | 'collectible' | 'other'

export type PriceSource = 'yahoo' | 'coingecko' | 'manual'

export type AssetPriceResult = {
    asset_id: string
    price: number
    currency: string
    source: PriceSource
    fetched_at: string
    error?: string
}

export type InvestmentPosition = {
    asset: AssetRow
    detail: InvestmentDetailRow | null
    latest_price: number
    price_source: PriceSource
    price_fetched_at: string | null

    // Computed
    lot_held: number
    avg_price: number
    invested: number
    market_value: number
    pl: number
    pl_percent: number
}

export type PortfolioSummary = {
    trading_balance: number
    total_invested: number
    total_market_value: number
    net_pl: number
    net_pl_percent: number
    realized_pl: number
    total_equity: number
    open_positions: number
}

export type PortfolioData = {
    summary: PortfolioSummary
    positions: InvestmentPosition[]
}

// Tipe aset yang dianggap "investment" (punya ticker & harga pasar)
export const INVESTMENT_ASSET_TYPES: AssetType[] = [
    'stock',
    'crypto',
    'mutual_fund',
    'gold',   // ← tambah ini
]

// Cache TTL
export const PRICE_CACHE_TTL_MS = 15 * 60 * 1000 // 15 menit

export type SearchSuggestion = {
    ticker: string
    symbol: string
    name: string
    exchange: string
    currency: string
    type: 'stock' | 'crypto' | 'mutual_fund'
    source: 'yahoo' | 'curated'
    extra?: string
}