'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { smartCapitalize, formatRupiah } from '@/lib/normalize'
import type {
    WishlistInput,
    ContributeInput,
    WithdrawInput,
    PurchaseWishlistInput,
    DecisionInput,
} from '@/lib/validators/wishlist'

type WishlistInputWithImage = WishlistInput & {
    image_url?: string | null
    image_source?: 'auto' | 'manual' | null
}

const BUCKET = 'wishlist-images'
const COOLING_OFF_DAYS = 3
const REFUND_TYPE = 'envelope_cancel' as const

function extractStoragePath(url: string | null | undefined): string | null {
    if (!url) return null
    const match = url.match(/wishlist-images\/(.+)$/)
    return match?.[1] || null
}

export function useWishlists() {
    const router = useRouter()
    const supabase = createClient()

    // ============================================================
    // INTERNAL: refund envelope balance
    // ============================================================
    const refundEnvelope = useCallback(
        async (params: {
            userId: string
            profileId: string
            envelopeAccountId: string
            wishlistName: string
            note: string
        }): Promise<{ success: boolean; amount: number }> => {
            const {
                userId,
                profileId,
                envelopeAccountId,
                wishlistName,
                note,
            } = params

            const { data: envelope } = await supabase
                .from('accounts')
                .select('current_balance')
                .eq('id', envelopeAccountId)
                .maybeSingle()

            const balance = Number(envelope?.current_balance || 0)
            if (balance <= 0) return { success: true, amount: 0 }

            const { data: lastDeposit } = await supabase
                .from('transactions')
                .select('account_id')
                .eq('to_account_id', envelopeAccountId)
                .eq('is_internal', true)
                .eq('internal_ref_type', 'envelope_deposit')
                .order('date', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (!lastDeposit?.account_id) {
                return { success: true, amount: 0 }
            }

            const { error: refundErr } = await supabase
                .from('transactions')
                .insert({
                    user_id: userId,
                    profile_id: profileId,
                    date: new Date().toISOString(),
                    name: `Refund ${wishlistName}`,
                    type: 'transfer',
                    account_id: envelopeAccountId,
                    to_account_id: lastDeposit.account_id,
                    category_id: null,
                    amount: balance,
                    amount_idr: balance,
                    currency: 'IDR',
                    exchange_rate: 1,
                    status: 'cleared',
                    exclude_from_budget: true,
                    exclude_from_daily_budget: true,
                    exclude_from_reports: true,
                    is_internal: true,
                    internal_ref_type: REFUND_TYPE,
                    internal_ref_id: envelopeAccountId,
                    note,
                })

            if (refundErr) {
                console.error('[refund] insert failed:', refundErr)
                return { success: false, amount: 0 }
            }

            return { success: true, amount: balance }
        },
        [supabase]
    )

    // ============================================================
    // CREATE
    // ============================================================
    const createWishlist = useCallback(
        async (data: WishlistInputWithImage, profileId: string) => {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) {
                toast.error('Lu belum login')
                return { success: false }
            }

            const isUrgent = data.priority === 'urgent'

            const { data: created, error } = await supabase
                .from('wishlists')
                .insert({
                    user_id: user.id,
                    profile_id: profileId,
                    name: smartCapitalize(data.name),
                    category: data.category?.trim() || null,
                    priority: data.priority,
                    target_price: data.target_price,
                    currency: data.currency,
                    link: data.link?.trim() || null,
                    target_date: data.target_date || null,
                    reason: data.reason?.trim() || null,
                    mood: data.mood || null,
                    alternatives: data.alternatives?.trim() || null,
                    note: data.note?.trim() || null,
                    image_url: data.image_url || null,
                    image_source: data.image_source || null,
                    status: isUrgent ? 'planned' : 'cooling_off',
                    cooling_off_until: isUrgent
                        ? null
                        : new Date(
                            Date.now() +
                            COOLING_OFF_DAYS * 24 * 60 * 60 * 1000
                        ).toISOString(),
                    saved_amount: 0,
                })
                .select()
                .single()

            if (error || !created) {
                toast.error(error?.message || 'Gagal bikin wishlist')
                return { success: false, error }
            }

            const { data: envelope } = await supabase
                .from('accounts')
                .insert({
                    user_id: user.id,
                    profile_id: profileId,
                    name: `Envelope: ${created.name}`,
                    type: 'envelope',
                    currency: 'IDR',
                    initial_balance: 0,
                    current_balance: 0,
                    linked_wishlist_id: created.id,
                })
                .select()
                .single()

            if (envelope) {
                await supabase
                    .from('wishlists')
                    .update({ envelope_account_id: envelope.id })
                    .eq('id', created.id)
            }

            toast.success(
                isUrgent
                    ? 'Wishlist ditambahkan (urgent)'
                    : 'Wishlist ditambahkan',
                {
                    description: isUrgent
                        ? 'Priority urgent — cooling-off dilewati.'
                        : `Cooling-off ${COOLING_OFF_DAYS} hari mulai sekarang.`,
                }
            )
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    // ============================================================
    // UPDATE
    // ============================================================
    const updateWishlist = useCallback(
        async (id: string, data: Partial<WishlistInputWithImage>) => {
            const normalized: any = {
                ...data,
                ...(data.name ? { name: smartCapitalize(data.name) } : {}),
                ...(data.category !== undefined
                    ? { category: data.category?.trim() || null }
                    : {}),
                ...(data.link !== undefined
                    ? { link: data.link?.trim() || null }
                    : {}),
                ...(data.reason !== undefined
                    ? { reason: data.reason?.trim() || null }
                    : {}),
                ...(data.alternatives !== undefined
                    ? { alternatives: data.alternatives?.trim() || null }
                    : {}),
                ...(data.note !== undefined
                    ? { note: data.note?.trim() || null }
                    : {}),
                ...(data.image_url !== undefined
                    ? { image_url: data.image_url || null }
                    : {}),
                ...(data.image_source !== undefined
                    ? { image_source: data.image_source || null }
                    : {}),
            }

            if (data.priority === 'urgent') {
                const { data: current } = await supabase
                    .from('wishlists')
                    .select('status')
                    .eq('id', id)
                    .maybeSingle()

                if (current?.status === 'cooling_off') {
                    normalized.status = 'planned'
                    normalized.cooling_off_until = null
                }
            }

            const { error } = await supabase
                .from('wishlists')
                .update(normalized)
                .eq('id', id)

            if (error) {
                toast.error(error.message)
                return { success: false, error }
            }

            toast.success('Wishlist diupdate')
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    // ============================================================
    // DECISION CHECK
    // ============================================================
    const saveDecision = useCallback(
        async (wishlistId: string, answers: DecisionInput) => {
            const score =
                answers.need +
                answers.alternative +
                answers.durability +
                answers.consistency +
                answers.finance +
                answers.mood

            const { error } = await supabase
                .from('wishlists')
                .update({
                    decision_score: score,
                    decision_answers: answers,
                })
                .eq('id', wishlistId)

            if (error) {
                console.error('[decision] save failed:', error)
                toast.error('Gagal simpan decision check')
                return { success: false, error }
            }

            toast.success(`Decision check tersimpan — skor ${score}/30`)
            router.refresh()
            return { success: true, score }
        },
        [supabase, router]
    )

    // ============================================================
    // CONTRIBUTE
    // ============================================================
    const contribute = useCallback(
        async (wishlistId: string, data: ContributeInput) => {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) {
                toast.error('Lu belum login')
                return { success: false }
            }

            const { data: wishlist } = await supabase
                .from('wishlists')
                .select(
                    'id, name, envelope_account_id, saved_amount, target_price, status, profile_id'
                )
                .eq('id', wishlistId)
                .maybeSingle()

            if (!wishlist?.envelope_account_id) {
                toast.error('Envelope gak ditemukan')
                return { success: false }
            }

            const { data: sourceAcc } = await supabase
                .from('accounts')
                .select('name, current_balance')
                .eq('id', data.account_id)
                .single()

            if (sourceAcc && data.amount > Number(sourceAcc.current_balance)) {
                toast.error(
                    `Saldo ${sourceAcc.name} tidak cukup. Tersedia ${formatRupiah(Number(sourceAcc.current_balance))}`
                )
                return { success: false }
            }

            const { error: txErr } = await supabase
                .from('transactions')
                .insert({
                    user_id: user.id,
                    profile_id: wishlist.profile_id,
                    date: new Date(data.date).toISOString(),
                    name: `Setor ${wishlist.name}`,
                    type: 'transfer',
                    account_id: data.account_id,
                    to_account_id: wishlist.envelope_account_id,
                    category_id: null,
                    amount: data.amount,
                    amount_idr: data.amount,
                    currency: 'IDR',
                    exchange_rate: 1,
                    status: 'cleared',
                    exclude_from_budget: true,
                    exclude_from_daily_budget: true,
                    exclude_from_reports: true,
                    is_internal: true,
                    internal_ref_type: 'envelope_deposit',
                    internal_ref_id: wishlist.envelope_account_id,
                    note: data.note?.trim() || null,
                })

            if (txErr) {
                console.error('[contribute] failed:', txErr)
                toast.error('Gagal setor')
                return { success: false, error: txErr }
            }

            const newSaved = Number(wishlist.saved_amount) + data.amount
            let newStatus = wishlist.status
            const target = Number(wishlist.target_price)
            const isDone = ['purchased', 'cancelled'].includes(wishlist.status)
            if (!isDone) {
                if (newSaved >= target) newStatus = 'ready'
                else if (
                    newSaved > 0 &&
                    ['planned', 'cooling_off'].includes(wishlist.status)
                )
                    newStatus = 'saving'
            }

            await supabase
                .from('wishlists')
                .update({ saved_amount: newSaved, status: newStatus })
                .eq('id', wishlistId)

            toast.success(`Setor ${formatRupiah(data.amount)} berhasil`, {
                description:
                    newStatus === 'ready' && wishlist.status !== 'ready'
                        ? '🎉 Tabungan udah cukup! Siap dibeli.'
                        : undefined,
            })
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    // ============================================================
    // WITHDRAW
    // ============================================================
    const withdraw = useCallback(
        async (wishlistId: string, data: WithdrawInput) => {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) {
                toast.error('Lu belum login')
                return { success: false }
            }

            const { data: wishlist } = await supabase
                .from('wishlists')
                .select(
                    'id, name, envelope_account_id, saved_amount, target_price, status, profile_id'
                )
                .eq('id', wishlistId)
                .maybeSingle()

            if (!wishlist?.envelope_account_id) {
                toast.error('Envelope gak ditemukan')
                return { success: false }
            }

            const { data: envelope } = await supabase
                .from('accounts')
                .select('current_balance')
                .eq('id', wishlist.envelope_account_id)
                .single()

            if (!envelope || data.amount > Number(envelope.current_balance)) {
                toast.error(
                    `Saldo envelope cuma ${formatRupiah(Number(envelope?.current_balance || 0))}`
                )
                return { success: false }
            }

            const { error: txErr } = await supabase
                .from('transactions')
                .insert({
                    user_id: user.id,
                    profile_id: wishlist.profile_id,
                    date: new Date(data.date).toISOString(),
                    name: `Tarik dari ${wishlist.name}`,
                    type: 'transfer',
                    account_id: wishlist.envelope_account_id,
                    to_account_id: data.account_id,
                    category_id: null,
                    amount: data.amount,
                    amount_idr: data.amount,
                    currency: 'IDR',
                    exchange_rate: 1,
                    status: 'cleared',
                    exclude_from_budget: true,
                    exclude_from_daily_budget: true,
                    exclude_from_reports: true,
                    is_internal: true,
                    internal_ref_type: 'envelope_withdraw',
                    internal_ref_id: wishlist.envelope_account_id,
                    note: data.note?.trim() || null,
                })

            if (txErr) {
                console.error('[withdraw] failed:', txErr)
                toast.error('Gagal tarik')
                return { success: false, error: txErr }
            }

            const newSaved = Math.max(
                0,
                Number(wishlist.saved_amount) - data.amount
            )
            let newStatus = wishlist.status
            if (
                newStatus === 'ready' &&
                newSaved < Number(wishlist.target_price)
            ) {
                newStatus = newSaved > 0 ? 'saving' : 'planned'
            }

            await supabase
                .from('wishlists')
                .update({ saved_amount: newSaved, status: newStatus })
                .eq('id', wishlistId)

            toast.success(`Tarik ${formatRupiah(data.amount)} berhasil`)
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    // ============================================================
    // PURCHASE
    // ============================================================
    const purchaseWishlist = useCallback(
        async (wishlistId: string, data: PurchaseWishlistInput) => {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) {
                toast.error('Lu belum login')
                return { success: false }
            }

            const { data: wishlist } = await supabase
                .from('wishlists')
                .select(
                    'id, name, envelope_account_id, target_price, status, profile_id'
                )
                .eq('id', wishlistId)
                .maybeSingle()

            if (!wishlist?.envelope_account_id) {
                toast.error('Envelope gak ditemukan')
                return { success: false }
            }

            const { data: envelope } = await supabase
                .from('accounts')
                .select('id, current_balance')
                .eq('id', wishlist.envelope_account_id)
                .single()

            if (!envelope) {
                toast.error('Envelope gak ditemukan')
                return { success: false }
            }

            const balance = Number(envelope.current_balance)
            if (balance < data.amount) {
                toast.error(
                    `Saldo envelope kurang. Tersedia ${formatRupiah(balance)}`
                )
                return { success: false }
            }

            const { data: tx, error: txErr } = await supabase
                .from('transactions')
                .insert({
                    user_id: user.id,
                    profile_id: wishlist.profile_id,
                    date: new Date(data.date).toISOString(),
                    name: `Beli ${wishlist.name}`,
                    type: 'expense',
                    account_id: wishlist.envelope_account_id,
                    category_id: data.category_id || null,
                    amount: data.amount,
                    amount_idr: data.amount,
                    currency: 'IDR',
                    exchange_rate: 1,
                    status: 'cleared',
                    exclude_from_budget: false,
                    exclude_from_daily_budget: true,
                    exclude_from_reports: false,
                    is_internal: false,
                    internal_ref_type: 'wishlist_purchase',
                    internal_ref_id: wishlistId,
                    note: data.note?.trim() || null,
                })
                .select()
                .single()

            if (txErr || !tx) {
                console.error('[purchase] failed:', txErr)
                toast.error('Gagal bikin transaksi')
                return { success: false, error: txErr }
            }

            const sisa = balance - data.amount
            if (sisa > 0) {
                await refundEnvelope({
                    userId: user.id,
                    profileId: wishlist.profile_id,
                    envelopeAccountId: wishlist.envelope_account_id,
                    wishlistName: wishlist.name,
                    note: 'Sisa saldo envelope setelah beli',
                })
            }

            await supabase
                .from('wishlists')
                .update({
                    status: 'purchased',
                    purchased_at: new Date().toISOString(),
                    purchased_transaction_id: tx.id,
                })
                .eq('id', wishlistId)

            await supabase
                .from('accounts')
                .update({ is_archived: true })
                .eq('id', wishlist.envelope_account_id)

            toast.success(`🎉 ${wishlist.name} dibeli!`)
            router.refresh()
            return { success: true }
        },
        [supabase, router, refundEnvelope]
    )

    // ============================================================
    // CANCEL
    // ============================================================
    const cancelWishlist = useCallback(
        async (id: string) => {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) {
                toast.error('Lu belum login')
                return { success: false }
            }

            const { data: wishlist } = await supabase
                .from('wishlists')
                .select('id, name, envelope_account_id, profile_id')
                .eq('id', id)
                .maybeSingle()

            if (!wishlist) {
                toast.error('Wishlist gak ditemukan')
                return { success: false }
            }

            if (wishlist.envelope_account_id) {
                const refundResult = await refundEnvelope({
                    userId: user.id,
                    profileId: wishlist.profile_id,
                    envelopeAccountId: wishlist.envelope_account_id,
                    wishlistName: wishlist.name,
                    note: 'Refund karena wishlist dibatalkan',
                })

                if (refundResult.amount > 0) {
                    toast.info(
                        `Refund ${formatRupiah(refundResult.amount)} ke akun asal`
                    )
                }

                await supabase
                    .from('accounts')
                    .update({ is_archived: true })
                    .eq('id', wishlist.envelope_account_id)
            }

            const { error } = await supabase
                .from('wishlists')
                .update({ status: 'cancelled' })
                .eq('id', id)

            if (error) {
                toast.error(error.message)
                return { success: false, error }
            }

            toast.success('Wishlist dibatalkan')
            router.refresh()
            return { success: true }
        },
        [supabase, router, refundEnvelope]
    )

    // ============================================================
    // DELETE
    // ============================================================
    const deleteWishlist = useCallback(
        async (id: string) => {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) {
                toast.error('Lu belum login')
                return { success: false }
            }

            const { data: wishlist } = await supabase
                .from('wishlists')
                .select('id, name, image_url, envelope_account_id, profile_id')
                .eq('id', id)
                .maybeSingle()

            if (wishlist?.envelope_account_id) {
                const refundResult = await refundEnvelope({
                    userId: user.id,
                    profileId: wishlist.profile_id,
                    envelopeAccountId: wishlist.envelope_account_id,
                    wishlistName: wishlist.name,
                    note: 'Refund sebelum delete',
                })

                if (refundResult.amount > 0) {
                    toast.info(
                        `Refund ${formatRupiah(refundResult.amount)} ke akun asal`
                    )
                }
            }

            const { error } = await supabase
                .from('wishlists')
                .delete()
                .eq('id', id)

            if (error) {
                toast.error(error.message)
                return { success: false, error }
            }

            const storagePath = extractStoragePath(wishlist?.image_url)
            if (storagePath) {
                supabase.storage
                    .from(BUCKET)
                    .remove([storagePath])
                    .then(({ error: rmErr }) => {
                        if (rmErr)
                            console.warn(
                                '[wishlist] image delete failed:',
                                rmErr
                            )
                    })
            }

            toast.success('Wishlist dihapus')
            router.refresh()
            return { success: true }
        },
        [supabase, router, refundEnvelope]
    )

    // ============================================================
    // UPDATE STATUS
    // ============================================================
    const updateStatus = useCallback(
        async (id: string, status: string) => {
            const { error } = await supabase
                .from('wishlists')
                .update({ status })
                .eq('id', id)

            if (error) {
                toast.error(error.message)
                return { success: false, error }
            }

            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    return {
        createWishlist,
        updateWishlist,
        deleteWishlist,
        updateStatus,
        contribute,
        withdraw,
        purchaseWishlist,
        cancelWishlist,
        saveDecision,
    }
}