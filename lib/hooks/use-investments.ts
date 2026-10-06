'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { smartCapitalize, formatRupiah } from '@/lib/normalize'
import { useTrackedAction } from './use-tracked-action'
import type {
    CreateInvestmentInput,
    BuyMoreInput,
    SellInput,
    DividendInput,
} from '@/lib/validators/investment'

const CATEGORY_MAP: Record<string, string> = {
    stock: 'Stocks',
    crypto: 'Crypto',
    mutual_fund: 'Mutual Fund',
    gold: 'Gold',
    bond: 'Bond',
}

function getLotMultiplier(type: string): number {
    return type === 'stock' ? 100 : 1
}

function getUnitLabel(type: string): string {
    if (type === 'stock') return 'lot'
    if (type === 'gold') return 'gram'
    if (type === 'bond') return 'unit'
    return 'unit'
}

export function useInvestments() {
    const router = useRouter()
    const supabase = createClient()
    const track = useTrackedAction()

    const findCategoryId = useCallback(
        async (uid: string, type: string): Promise<string | null> => {
            const name = CATEGORY_MAP[type]
            if (!name) return null
            const { data } = await supabase
                .from('categories')
                .select('id')
                .eq('user_id', uid)
                .eq('name', name)
                .maybeSingle()
            return data?.id || null
        },
        [supabase]
    )

    // ============================================================
    // INTERNAL: buy more (dipakai createInvestment untuk anti-duplicate)
    // ============================================================
    const buyMoreInternal = useCallback(
        async (params: {
            uid: string
            assetId: string
            assetProfileId: string
            assetType: string
            assetName: string
            currentQuantity: number
            currentAvgPrice: number
            detailId: string | null
            newQuantity: number
            newPrice: number
            fee: number
            date: string
            accountId: string
            note?: string
        }) => {
            const {
                uid,
                assetId,
                assetProfileId,
                assetType,
                assetName,
                currentQuantity,
                currentAvgPrice,
                detailId,
                newQuantity,
                newPrice,
                fee,
                date,
                accountId,
                note,
            } = params

            const multiplier = getLotMultiplier(assetType)
            const newTotalQty = currentQuantity + newQuantity
            const newAvg =
                newTotalQty > 0
                    ? (currentQuantity * currentAvgPrice + newQuantity * newPrice) /
                    newTotalQty
                    : newPrice

            const totalAmount = newQuantity * newPrice * multiplier + fee

            const { data: acc } = await supabase
                .from('accounts')
                .select('name, current_balance')
                .eq('id', accountId)
                .single()

            if (acc && totalAmount > Number(acc.current_balance)) {
                toast.error(
                    `Saldo ${acc.name} tidak cukup. Butuh ${formatRupiah(totalAmount)}, tersedia ${formatRupiah(Number(acc.current_balance))}`
                )
                return { success: false }
            }

            const categoryId = await findCategoryId(uid, assetType)

            const { data: tx, error: txErr } = await supabase
                .from('transactions')
                .insert({
                    user_id: uid,
                    profile_id: assetProfileId,
                    date: new Date(date).toISOString(),
                    name: `Beli ${assetName}`,
                    type: 'expense',
                    account_id: accountId,
                    category_id: categoryId,
                    amount: totalAmount,
                    amount_idr: totalAmount,
                    currency: 'IDR',
                    exchange_rate: 1,
                    status: 'cleared',
                    exclude_from_budget: true,
                    exclude_from_daily_budget: true,
                    note: note?.trim() || null,
                })
                .select()
                .single()

            if (txErr) {
                console.error('[buyMore] insert transaction failed:', txErr)
                toast.error('Gagal catat transaksi')
                return { success: false }
            }

            await supabase.from('investment_transactions').insert({
                asset_id: assetId,
                date: new Date(date).toISOString(),
                type: 'buy',
                quantity: newQuantity,
                price: newPrice,
                amount: newQuantity * newPrice * multiplier,
                fee,
                transaction_id: tx.id,
            })

            const newTotalCost =
                currentQuantity * currentAvgPrice * multiplier +
                newQuantity * newPrice * multiplier
            await supabase
                .from('assets')
                .update({
                    quantity: newTotalQty,
                    purchase_price: newTotalCost,
                    current_value: newTotalQty * newPrice * multiplier,
                    current_value_updated_at: new Date().toISOString(),
                })
                .eq('id', assetId)

            if (detailId) {
                await supabase
                    .from('investment_details')
                    .update({ lot: newTotalQty, avg_price: newAvg })
                    .eq('id', detailId)
            }

            return { success: true, wasMerged: true }
        },
        [supabase, findCategoryId]
    )

    // ============================================================
    // CREATE
    // ============================================================
    const createInvestment = useCallback(
        async (data: CreateInvestmentInput, profileId: string) => {
            return track(async () => {
                const {
                    data: { user },
                } = await supabase.auth.getUser()
                if (!user) {
                    toast.error('Anda belum login')
                    return { success: false }
                }

                const uid = user.id
                const multiplier = getLotMultiplier(data.asset_type)
                const totalAmount = data.quantity * data.avg_price * multiplier
                const ticker = data.ticker?.trim().toUpperCase() || null

                const { data: acc } = await supabase
                    .from('accounts')
                    .select('name, current_balance')
                    .eq('id', data.account_id)
                    .single()

                if (acc && totalAmount > Number(acc.current_balance)) {
                    toast.error(
                        `Saldo ${acc.name} tidak cukup. Butuh ${formatRupiah(totalAmount)}, tersedia ${formatRupiah(Number(acc.current_balance))}`
                    )
                    return { success: false }
                }

                // Anti-duplicate: cek kalau ticker udah ada → merge
                if (data.asset_type !== 'gold' && ticker) {
                    const { data: existing } = await supabase
                        .from('investment_details')
                        .select(
                            `
              id,
              asset_id,
              avg_price,
              assets!inner(id, name, type, quantity, profile_id, is_archived)
            `
                        )
                        .eq('ticker', ticker)
                        .eq('assets.profile_id', profileId)
                        .eq('assets.is_archived', false)
                        .maybeSingle()

                    if (existing && existing.assets) {
                        const asset: any = Array.isArray(existing.assets)
                            ? existing.assets[0]
                            : existing.assets

                        toast.info(`${ticker} sudah ada - ditambahkan ke posisi.`)

                        const result = await buyMoreInternal({
                            uid,
                            assetId: existing.asset_id,
                            assetProfileId: asset.profile_id,
                            assetType: asset.type,
                            assetName: asset.name,
                            currentQuantity: Number(asset.quantity),
                            currentAvgPrice: existing.avg_price
                                ? Number(existing.avg_price)
                                : 0,
                            detailId: existing.id,
                            newQuantity: data.quantity,
                            newPrice: data.avg_price,
                            fee: 0,
                            date: data.purchase_date,
                            accountId: data.account_id,
                            note: data.note,
                        })

                        if (result.success) router.refresh()
                        return result
                    }
                }

                const categoryId = await findCategoryId(uid, data.asset_type)

                const { data: asset, error: assetErr } = await supabase
                    .from('assets')
                    .insert({
                        user_id: uid,
                        profile_id: profileId,
                        name: smartCapitalize(data.name),
                        type: data.asset_type,
                        currency: 'IDR',
                        quantity: data.quantity,
                        unit: getUnitLabel(data.asset_type),
                        purchase_date: data.purchase_date,
                        purchase_price: totalAmount,
                        current_value: totalAmount,
                        current_value_updated_at: new Date().toISOString(),
                        account_id: data.account_id,
                        is_liquid:
                            data.asset_type !== 'mutual_fund' && data.asset_type !== 'gold',
                        depreciation_method: 'none',
                        depreciation_rate: 0,
                        note: data.note?.trim() || null,
                    })
                    .select()
                    .single()

                if (assetErr || !asset) {
                    toast.error(assetErr?.message || 'Gagal membuat asset')
                    return { success: false }
                }

                await supabase.from('investment_details').insert({
                    asset_id: asset.id,
                    ticker: ticker,
                    broker: data.broker?.trim() || null,
                    exchange: data.exchange?.trim() || null,
                    lot: data.quantity,
                    avg_price: data.avg_price,
                    equity: totalAmount,
                })

                const { data: tx, error: txErr } = await supabase
                    .from('transactions')
                    .insert({
                        user_id: uid,
                        profile_id: profileId,
                        date: new Date(data.purchase_date).toISOString(),
                        name: `Beli ${data.name}`,
                        type: 'expense',
                        account_id: data.account_id,
                        category_id: categoryId,
                        amount: totalAmount,
                        amount_idr: totalAmount,
                        currency: 'IDR',
                        exchange_rate: 1,
                        status: 'cleared',
                        exclude_from_budget: true,
                        exclude_from_daily_budget: true,
                        exclude_from_reports: false,
                        note: data.note?.trim() || null,
                    })
                    .select()
                    .single()

                if (txErr) {
                    toast.error('Asset dibuat, tapi transaksi gagal dicatat')
                    router.refresh()
                    return { success: false }
                }

                await supabase.from('investment_transactions').insert({
                    asset_id: asset.id,
                    date: new Date(data.purchase_date).toISOString(),
                    type: 'buy',
                    quantity: data.quantity,
                    price: data.avg_price,
                    amount: totalAmount,
                    fee: 0,
                    transaction_id: tx.id,
                })

                toast.success('Investasi ditambahkan')
                router.refresh()
                return { success: true, assetId: asset.id }
            }, 'Menambahkan investasi...')
        },
        [supabase, router, findCategoryId, buyMoreInternal, track]
    )

    // ============================================================
    // BUY MORE
    // ============================================================
    const buyMore = useCallback(
        async (data: BuyMoreInput) => {
            return track(async () => {
                const {
                    data: { user },
                } = await supabase.auth.getUser()
                if (!user) return { success: false }

                const uid = user.id

                const { data: asset } = await supabase
                    .from('assets')
                    .select('*, investment_details(*)')
                    .eq('id', data.asset_id)
                    .single()

                if (!asset) {
                    toast.error('Asset tidak ditemukan')
                    return { success: false }
                }

                const detail = Array.isArray(asset.investment_details)
                    ? asset.investment_details[0]
                    : asset.investment_details

                const result = await buyMoreInternal({
                    uid,
                    assetId: asset.id,
                    assetProfileId: asset.profile_id,
                    assetType: asset.type,
                    assetName: asset.name,
                    currentQuantity: Number(asset.quantity),
                    currentAvgPrice: detail?.avg_price ? Number(detail.avg_price) : 0,
                    detailId: detail?.id || null,
                    newQuantity: data.quantity,
                    newPrice: data.price,
                    fee: data.fee,
                    date: data.date,
                    accountId: data.account_id,
                    note: data.note,
                })

                if (result.success) {
                    toast.success(
                        `Beli ${data.quantity} ${getUnitLabel(asset.type)} ${asset.name}`
                    )
                    router.refresh()
                }
                return result
            }, 'Memproses pembelian...')
        },
        [supabase, router, buyMoreInternal, track]
    )

    // ============================================================
    // SELL
    // ============================================================
    const sell = useCallback(
        async (data: SellInput) => {
            return track(async () => {
                const {
                    data: { user },
                } = await supabase.auth.getUser()
                if (!user) return { success: false }

                const uid = user.id

                const { data: asset } = await supabase
                    .from('assets')
                    .select('*, investment_details(*)')
                    .eq('id', data.asset_id)
                    .single()

                if (!asset) {
                    toast.error('Asset tidak ditemukan')
                    return { success: false }
                }

                const detail = Array.isArray(asset.investment_details)
                    ? asset.investment_details[0]
                    : asset.investment_details

                const multiplier = getLotMultiplier(asset.type)
                const currentQty = Number(asset.quantity)

                if (data.quantity > currentQty) {
                    toast.error(
                        `Hanya punya ${currentQty}, tidak bisa jual ${data.quantity}`
                    )
                    return { success: false }
                }

                const grossAmount = data.quantity * data.price * multiplier
                const netAmount = grossAmount - data.fee
                const newQty = currentQty - data.quantity
                const shouldArchive = newQty === 0

                const categoryId = await findCategoryId(uid, asset.type)

                const { data: tx, error: txErr } = await supabase
                    .from('transactions')
                    .insert({
                        user_id: uid,
                        profile_id: asset.profile_id,
                        date: new Date(data.date).toISOString(),
                        name: `Jual ${asset.name}`,
                        type: 'income',
                        account_id: data.account_id,
                        category_id: categoryId,
                        amount: netAmount,
                        amount_idr: netAmount,
                        currency: 'IDR',
                        exchange_rate: 1,
                        status: 'cleared',
                        exclude_from_budget: true,
                        exclude_from_daily_budget: true,
                        note: data.note?.trim() || null,
                    })
                    .select()
                    .single()

                if (txErr) {
                    toast.error('Gagal catat transaksi')
                    return { success: false }
                }

                await supabase.from('investment_transactions').insert({
                    asset_id: asset.id,
                    date: new Date(data.date).toISOString(),
                    type: 'sell',
                    quantity: data.quantity,
                    price: data.price,
                    amount: grossAmount,
                    fee: data.fee,
                    transaction_id: tx.id,
                })

                await supabase
                    .from('assets')
                    .update({
                        quantity: newQty,
                        current_value: newQty * data.price * multiplier,
                        current_value_updated_at: new Date().toISOString(),
                        is_archived: shouldArchive,
                    })
                    .eq('id', asset.id)

                if (detail) {
                    await supabase
                        .from('investment_details')
                        .update({ lot: newQty })
                        .eq('id', detail.id)
                }

                toast.success(
                    `Jual ${data.quantity} ${getUnitLabel(asset.type)} ${asset.name}`
                )
                router.refresh()
                return { success: true }
            }, 'Memproses penjualan...')
        },
        [supabase, router, findCategoryId, track]
    )

    // ============================================================
    // DIVIDEND
    // ============================================================
    const dividend = useCallback(
        async (data: DividendInput) => {
            return track(async () => {
                const {
                    data: { user },
                } = await supabase.auth.getUser()
                if (!user) return { success: false }

                const uid = user.id

                const { data: asset } = await supabase
                    .from('assets')
                    .select('id, name, profile_id')
                    .eq('id', data.asset_id)
                    .single()

                if (!asset) {
                    toast.error('Asset tidak ditemukan')
                    return { success: false }
                }

                const { data: dividendCat } = await supabase
                    .from('categories')
                    .select('id')
                    .eq('user_id', uid)
                    .eq('name', 'Dividend')
                    .maybeSingle()

                const { data: tx, error: txErr } = await supabase
                    .from('transactions')
                    .insert({
                        user_id: uid,
                        profile_id: asset.profile_id,
                        date: new Date(data.date).toISOString(),
                        name: `Dividend ${asset.name}`,
                        type: 'income',
                        account_id: data.account_id,
                        category_id: dividendCat?.id || null,
                        amount: data.amount,
                        amount_idr: data.amount,
                        currency: 'IDR',
                        exchange_rate: 1,
                        status: 'cleared',
                        exclude_from_budget: true,
                        exclude_from_daily_budget: true,
                        note: data.note?.trim() || null,
                    })
                    .select()
                    .single()

                if (txErr) {
                    toast.error('Gagal catat dividend')
                    return { success: false }
                }

                await supabase.from('investment_transactions').insert({
                    asset_id: asset.id,
                    date: new Date(data.date).toISOString(),
                    type: 'dividend',
                    quantity: 0,
                    price: 0,
                    amount: data.amount,
                    fee: 0,
                    transaction_id: tx.id,
                })

                toast.success(`Dividend ${asset.name} dicatat`)
                router.refresh()
                return { success: true }
            }, 'Mencatat dividend...')
        },
        [supabase, router, track]
    )

    return { createInvestment, buyMore, sell, dividend }
}