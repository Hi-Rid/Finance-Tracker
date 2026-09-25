/**
 * Mapping ticker crypto → CoinGecko ID
 * Kalau ticker gak ada di mapping, skip (fallback manual input).
 */
const TICKER_TO_COINGECKO: Record<string, string> = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    USDT: 'tether',
    USDC: 'usd-coin',
    BNB: 'binancecoin',
    SOL: 'solana',
    XRP: 'ripple',
    ADA: 'cardano',
    DOGE: 'dogecoin',
    DOT: 'polkadot',
    MATIC: 'matic-network',
    AVAX: 'avalanche-2',
    LINK: 'chainlink',
    ATOM: 'cosmos',
    LTC: 'litecoin',
    UNI: 'uniswap',
    AAVE: 'aave',
    NEAR: 'near',
    ALGO: 'algorand',
    FIL: 'filecoin',
}

/**
 * Fetch harga crypto dalam IDR dari CoinGecko (free tier).
 * Return Map<ticker, price_idr>.
 */
export async function fetchCryptoPrices(
    tickers: string[]
): Promise<Map<string, number>> {
    const result = new Map<string, number>()
    if (tickers.length === 0) return result

    // Filter yang ada di mapping
    const pairs: Array<{ ticker: string; id: string }> = []
    for (const t of tickers) {
        const upper = t.trim().toUpperCase()
        const id = TICKER_TO_COINGECKO[upper]
        if (id) pairs.push({ ticker: upper, id })
    }

    if (pairs.length === 0) return result

    const ids = pairs.map((p) => p.id).join(',')
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=idr`

    try {
        const res = await fetch(url, {
            // Jangan cache di Next.js — cache kita sendiri di tabel asset_prices
            cache: 'no-store',
            headers: { accept: 'application/json' },
        })

        if (!res.ok) {
            console.error(`[coingecko] HTTP ${res.status}`)
            return result
        }

        const data = (await res.json()) as Record<string, { idr?: number }>

        for (const { ticker, id } of pairs) {
            const price = data[id]?.idr
            if (typeof price === 'number' && isFinite(price) && price > 0) {
                result.set(ticker, price)
            }
        }
    } catch (err) {
        console.error('[coingecko] fetch failed:', err)
    }

    return result
}

/**
 * Cek apakah ticker ini didukung CoinGecko.
 */
export function isCryptoTickerSupported(ticker: string): boolean {
    return ticker.trim().toUpperCase() in TICKER_TO_COINGECKO
}