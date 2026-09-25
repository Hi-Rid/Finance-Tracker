import YahooFinance from 'yahoo-finance2'

// v3: instantiate once, reuse
const yahooFinance = new YahooFinance({
    suppressNotices: ['yahooSurvey'],
})

/**
 * IDX ticker otomatis pakai suffix .JK
 */
export function toYahooTicker(ticker: string): string {
    const t = ticker.trim().toUpperCase()
    if (t.includes('.') || t.includes('-')) return t
    return `${t}.JK`
}

/**
 * Fetch harga 1 ticker.
 */
export async function fetchYahooPrice(ticker: string): Promise<number | null> {
    try {
        const symbol = toYahooTicker(ticker)
        const quote: any = await yahooFinance.quote(symbol)
        const price = quote?.regularMarketPrice
        if (typeof price !== 'number' || !isFinite(price) || price <= 0) return null
        return price
    } catch (err) {
        console.error(`[yahoo] fetch ${ticker} failed:`, err)
        return null
    }
}

/**
 * Fetch batch harga. Max 20 per request.
 */
export async function fetchYahooPrices(
    tickers: string[]
): Promise<Map<string, number>> {
    const result = new Map<string, number>()
    if (tickers.length === 0) return result

    const unique = Array.from(new Set(tickers.map((t) => t.trim().toUpperCase())))
    const BATCH_SIZE = 20

    for (let i = 0; i < unique.length; i += BATCH_SIZE) {
        const batch = unique.slice(i, i + BATCH_SIZE)
        const symbols = batch.map(toYahooTicker)

        try {
            const quotes: any = await yahooFinance.quote(symbols)
            const arr: any[] = Array.isArray(quotes) ? quotes : [quotes]

            for (const q of arr) {
                if (!q || typeof q !== 'object') continue
                const symbol = q.symbol as string | undefined
                const price = q.regularMarketPrice as number | undefined
                if (!symbol || typeof price !== 'number' || !isFinite(price)) continue

                const originalTicker = symbol.replace(/\.JK$/, '')
                const match = batch.find((t) => t === originalTicker)
                if (match) result.set(match, price)
            }
        } catch (err) {
            console.error(`[yahoo] batch ${i} failed:`, err)
        }
    }

    return result
}

/**
 * Search ticker untuk autocomplete.
 * Return max 15 hasil.
 */
export type YahooSearchResult = {
    symbol: string
    ticker: string
    name: string
    exchange: string
    currency: string
    type: 'stock' | 'etf' | 'index'
}

export async function searchYahooTickers(
    query: string
): Promise<YahooSearchResult[]> {
    if (!query || query.trim().length < 1) return []

    try {
        const res: any = await yahooFinance.search(query.trim(), {
            quotesCount: 15,
            newsCount: 0,
            enableFuzzyQuery: true,
        })

        const quotes = res?.quotes || []

        return quotes
            .filter((q: any) => {
                // Filter: cuma equity/ETF, exclude crypto (kita handle terpisah)
                if (!q.symbol) return false
                const type = q.quoteType?.toUpperCase()
                return type === 'EQUITY' || type === 'ETF' || type === 'MUTUALFUND'
            })
            .map((q: any) => ({
                symbol: q.symbol,
                ticker: q.symbol.replace(/\.JK$/, ''),
                name: q.longname || q.shortname || q.symbol,
                exchange: q.exchange || q.exchDisp || '',
                currency: q.currency || 'IDR',
                type: 'stock' as const,
            }))
    } catch (err) {
        console.error('[yahoo] search failed:', err)
        return []
    }
}