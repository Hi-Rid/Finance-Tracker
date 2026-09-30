import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { getLatestPrices } from './prices'
import { computePortfolio, computeRealizedPl } from './portfolio'
import { INVESTMENT_ASSET_TYPES } from './types'
import type { PortfolioData } from './types'

type InvTxRow = {
    asset_id: string
    type: string
    quantity: number
    amount: number
    date: string
}

/**
 * Fetch portfolio lengkap: assets + details + prices + summary.
 * Dipanggil dari server component `/investments`.
 */
export async function getPortfolioData(
    profileId: string
): Promise<PortfolioData> {
    const supabase = await createClient()

    // ============ 1. Fetch assets (cuma investment types) ============
    const { data: assets } = await supabase
        .from('assets')
        .select('*')
        .eq('profile_id', profileId)
        .in('type', INVESTMENT_ASSET_TYPES)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })

    const assetList = assets || []

    if (assetList.length === 0) {
        return computePortfolio({
            assets: [],
            details: [],
            prices: new Map(),
            tradingBalance: await getTradingBalance(supabase, profileId),
            realizedPl: 0,
        })
    }

    const assetIds = assetList.map((a) => a.id)

    // ============ 2. Fetch details + transactions paralel ============
    const [detailsRes, invTxsRes, tradingBalance] = await Promise.all([
        supabase.from('investment_details').select('*').in('asset_id', assetIds),
        supabase
            .from('investment_transactions')
            .select('asset_id, type, quantity, amount, date')
            .in('asset_id', assetIds)
            .order('date', { ascending: true }),
        getTradingBalance(supabase, profileId),
    ])

    const details = detailsRes.data || []
    const invTxs = (invTxsRes.data || []) as InvTxRow[]

    // ============ 3. Compute realized P/L per asset ============
    const txsByAsset = new Map<string, InvTxRow[]>()
    for (const tx of invTxs) {
        if (!txsByAsset.has(tx.asset_id)) txsByAsset.set(tx.asset_id, [])
        txsByAsset.get(tx.asset_id)!.push(tx)
    }

    let realizedPl = 0
    for (const asset of assetList) {
        const txs = txsByAsset.get(asset.id) || []
        const multiplier = asset.type === 'stock' ? 100 : 1
        realizedPl += computeRealizedPl(txs, multiplier)
    }

    // ============ 4. Fetch prices ============
    const items = assetList.map((asset) => ({
        asset,
        detail: details.find((d) => d.asset_id === asset.id) || null,
    }))

    const prices = await getLatestPrices(items)

    // ============ 5. Compute ============
    return computePortfolio({
        assets: assetList,
        details,
        prices,
        tradingBalance,
        realizedPl,
    })
}

async function getTradingBalance(
    supabase: Awaited<ReturnType<typeof createClient>>,
    profileId: string
): Promise<number> {
    const { data } = await supabase
        .from('accounts')
        .select('current_balance')
        .eq('profile_id', profileId)
        .eq('type', 'investment')
        .eq('is_archived', false)

    return (data || []).reduce((sum, a) => sum + Number(a.current_balance), 0)
}

// ============================================================
// ASSET DETAIL - fetch 1 asset lengkap untuk /investments/[id]
// ============================================================

export type AssetDetailData = {
    asset: any
    detail: any | null
    priceEntry: {
        asset_id: string
        price: number
        currency: string
        source: string
        fetched_at: string
    } | null
    transactions: any[]
    cashTransactions: any[]
    accountMap: Record<string, string>
    metrics: {
        lotHeld: number
        avgPrice: number
        currentPrice: number
        invested: number
        marketValue: number
        pl: number
        plPercent: number
    }
}

export async function getAssetDetail(
    assetId: string,
    profileId: string
): Promise<AssetDetailData | null> {
    const supabase = await createClient()

    const { data: asset } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .eq('profile_id', profileId)
        .single()

    if (!asset) return null

    const [detailRes, invTxsRes] = await Promise.all([
        supabase
            .from('investment_details')
            .select('*')
            .eq('asset_id', assetId)
            .maybeSingle(),
        supabase
            .from('investment_transactions')
            .select('*')
            .eq('asset_id', assetId)
            .order('date', { ascending: false }),
    ])

    const detail = detailRes.data
    const invTxs = (invTxsRes.data || []) as any[]

    // ============ Latest price ============
    const prices = await getLatestPrices([{ asset, detail }])
    const priceEntryRaw = prices.get(assetId) || null

    // ============ Metrics ============
    const multiplier = asset.type === 'stock' ? 100 : 1
    const lotHeld = Number(asset.quantity)
    const avgPrice = detail?.avg_price ? Number(detail.avg_price) : 0
    const currentPrice = priceEntryRaw?.price || 0
    const invested = lotHeld * avgPrice * multiplier
    const marketValue = lotHeld * currentPrice * multiplier
    const pl = marketValue - invested
    const plPercent = invested > 0 ? (pl / invested) * 100 : 0

    // ============ Linked cash transactions ============
    const txIds = invTxs
        .map((t) => t.transaction_id)
        .filter((id): id is string => !!id)

    let cashTxs: any[] = []
    if (txIds.length > 0) {
        const { data } = await supabase
            .from('transactions')
            .select('id, name, type, amount_idr, account_id, date')
            .in('id', txIds)
        cashTxs = data || []
    }

    // ============ Account names map ============
    const accountIds = Array.from(
        new Set(cashTxs.map((t) => t.account_id).filter(Boolean))
    )

    const accountMap: Record<string, string> = {}
    if (accountIds.length > 0) {
        const { data } = await supabase
            .from('accounts')
            .select('id, name')
            .in('id', accountIds as string[])

            ; (data || []).forEach((a) => {
                accountMap[a.id] = a.name
            })
    }

    return {
        asset,
        detail,
        priceEntry: priceEntryRaw
            ? {
                asset_id: assetId,
                price: priceEntryRaw.price,
                currency: priceEntryRaw.currency,
                source: priceEntryRaw.source,
                fetched_at: priceEntryRaw.fetched_at,
            }
            : null,
        transactions: invTxs,
        cashTransactions: cashTxs,
        accountMap,
        metrics: {
            lotHeld,
            avgPrice,
            currentPrice,
            invested,
            marketValue,
            pl,
            plPercent,
        },
    }
}