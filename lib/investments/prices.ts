import { createClient } from '@/lib/supabase/server'
import { fetchYahooPrices } from './yahoo'
import { fetchCryptoPrices, isCryptoTickerSupported } from './coingecko'
import { PRICE_CACHE_TTL_MS, type PriceSource, type AssetPriceResult } from './types'
import type { Database } from '@/types/database'

type Asset = Database['public']['Tables']['assets']['Row']
type Detail = Database['public']['Tables']['investment_details']['Row']
type AssetWithDetail = { asset: Asset; detail: Detail | null }

/**
 * Ambil harga terkini untuk list assets, dengan caching.
 *
 * Alur:
 * 1. Cek cache per aset (asset_prices terbaru)
 * 2. Kalau cache < 15 menit → pakai
 * 3. Kalau expired → fetch API (yahoo/coingecko)
 * 4. Simpan hasil fetch ke cache
 * 5. Kalau API gagal → pakai cache lama (apapun umurnya)
 * 6. Kalau gak ada cache sama sekali → pakai current_value / (quantity × multiplier)
 */
export async function getLatestPrices(
    items: AssetWithDetail[]
): Promise<Map<string, AssetPriceResult>> {
    const result = new Map<string, AssetPriceResult>()
    if (items.length === 0) return result

    const supabase = await createClient()
    const now = Date.now()

    // ============ 1. Ambil cache terbaru per asset ============
    const assetIds = items.map((i) => i.asset.id)

    const { data: cachedRows } = await supabase
        .from('asset_prices')
        .select('asset_id, price, currency, source, fetched_at')
        .in('asset_id', assetIds)
        .order('fetched_at', { ascending: false })

    const cache = new Map<string, AssetPriceResult>()
    for (const row of cachedRows || []) {
        if (!cache.has(row.asset_id)) {
            cache.set(row.asset_id, {
                asset_id: row.asset_id,
                price: Number(row.price),
                currency: row.currency,
                source: row.source as PriceSource,
                fetched_at: row.fetched_at,
            })
        }
    }

    // ============ 2. Split: fresh vs stale ============
    const stale: AssetWithDetail[] = []

    for (const item of items) {
        const c = cache.get(item.asset.id)
        if (c) {
            const age = now - new Date(c.fetched_at).getTime()
            if (age < PRICE_CACHE_TTL_MS) {
                result.set(item.asset.id, c)
                continue
            }
        }
        stale.push(item)
    }

    if (stale.length === 0) return result

    // ============ 3. Fetch API untuk stale items ============
    const stockItems: AssetWithDetail[] = []
    const cryptoItems: AssetWithDetail[] = []
    const manualItems: AssetWithDetail[] = []

    for (const item of stale) {
        const type = item.asset.type
        const ticker = item.detail?.ticker

        if (type === 'stock' && ticker) {
            stockItems.push(item)
        } else if (type === 'crypto' && ticker && isCryptoTickerSupported(ticker)) {
            cryptoItems.push(item)
        } else {
            manualItems.push(item)
        }
    }

    // ============ 4. Fetch paralel ============
    const [stockPrices, cryptoPrices] = await Promise.all([
        stockItems.length > 0
            ? fetchYahooPrices(stockItems.map((i) => i.detail!.ticker!))
            : Promise.resolve(new Map<string, number>()),
        cryptoItems.length > 0
            ? fetchCryptoPrices(cryptoItems.map((i) => i.detail!.ticker!))
            : Promise.resolve(new Map<string, number>()),
    ])

    // ============ 5. Gabung + siapkan insert ke cache ============
    const toInsert: Array<{
        asset_id: string
        price: number
        currency: string
        source: PriceSource
    }> = []

    const applyResult = (
        item: AssetWithDetail,
        price: number,
        source: PriceSource
    ) => {
        const entry: AssetPriceResult = {
            asset_id: item.asset.id,
            price,
            currency: 'IDR',
            source,
            fetched_at: new Date().toISOString(),
        }
        result.set(item.asset.id, entry)
        toInsert.push({
            asset_id: item.asset.id,
            price,
            currency: 'IDR',
            source,
        })
    }

    for (const item of stockItems) {
        const ticker = item.detail!.ticker!.trim().toUpperCase()
        const price = stockPrices.get(ticker)
        if (price) {
            applyResult(item, price, 'yahoo')
        } else {
            fallbackToCache(item, cache, result)
        }
    }

    for (const item of cryptoItems) {
        const ticker = item.detail!.ticker!.trim().toUpperCase()
        const price = cryptoPrices.get(ticker)
        if (price) {
            applyResult(item, price, 'coingecko')
        } else {
            fallbackToCache(item, cache, result)
        }
    }

    // Manual items — gak fetch API, pakai current_value atau cache lama
    for (const item of manualItems) {
        fallbackToCache(item, cache, result)
    }

    // ============ 6. Bulk insert ke cache (fire-and-forget) ============
    if (toInsert.length > 0) {
        // Gak await — biar gak blocking response
        supabase
            .from('asset_prices')
            .insert(toInsert)
            .then(({ error }) => {
                if (error) console.error('[prices] cache insert failed:', error)
            })
    }

    return result
}

/**
 * Fallback kalau API gagal:
 * 1. Pakai cache lama (apapun umurnya)
 * 2. Kalau gak ada, pakai current_value / (quantity × multiplier) — dianggap harga beli terakhir
 */
function fallbackToCache(
    item: AssetWithDetail,
    cache: Map<string, AssetPriceResult>,
    result: Map<string, AssetPriceResult>
) {
    const c = cache.get(item.asset.id)
    if (c) {
        result.set(item.asset.id, c)
        return
    }

    // Gak ada cache sama sekali — derive dari current_value
    const asset = item.asset
    const quantity = Number(asset.quantity)
    const multiplier = asset.type === 'stock' ? 100 : 1
    const derivedPrice =
        quantity > 0 ? Number(asset.current_value) / (quantity * multiplier) : 0

    result.set(asset.id, {
        asset_id: asset.id,
        price: derivedPrice,
        currency: asset.currency,
        source: 'manual',
        fetched_at: asset.current_value_updated_at || asset.updated_at,
    })
}