'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { smartCapitalize, formatRupiah } from '@/lib/normalize'
import { useTrackedAction } from './use-tracked-action'
import type { DebtInput, PaymentInput } from '@/lib/validators/debts'

export function useDebts() {
    const router = useRouter()
    const supabase = createClient()
    const track = useTrackedAction()

    // ============================================================
    // CREATE
    // ============================================================
    const createDebt = useCallback(
        async (data: DebtInput, profileId: string) => {
            return track(async () => {
                const {
                    data: { user },
                } = await supabase.auth.getUser()
                if (!user) {
                    toast.error('Anda belum login')
                    return { success: false }
                }

                const { error } = await supabase.from('debts').insert({
                    user_id: user.id,
                    profile_id: profileId,
                    type: data.type,
                    name: smartCapitalize(data.name),
                    principal: data.principal,
                    outstanding: data.outstanding ?? data.principal,
                    interest_rate: (data.interest_rate || 0) / 100,
                    currency: 'IDR',
                    start_date: data.start_date,
                    due_date: data.due_date || null,
                    status: 'active',
                    note: data.note?.trim() || null,
                })

                if (error) {
                    console.error('[debts] create failed:', error)
                    toast.error(
                        'Gagal membuat ' + (data.type === 'debt' ? 'utang' : 'piutang')
                    )
                    return { success: false }
                }

                toast.success(
                    data.type === 'debt' ? 'Utang dicatat' : 'Piutang dicatat'
                )
                router.refresh()
                return { success: true }
            }, 'Menyimpan...')
        },
        [supabase, router, track]
    )

    // ============================================================
    // UPDATE
    // ============================================================
    const updateDebt = useCallback(
        async (id: string, data: Partial<DebtInput>) => {
            return track(async () => {
                const normalized: any = {
                    ...data,
                    ...(data.name ? { name: smartCapitalize(data.name) } : {}),
                    ...(data.interest_rate !== undefined
                        ? { interest_rate: data.interest_rate / 100 }
                        : {}),
                    ...(data.due_date !== undefined
                        ? { due_date: data.due_date || null }
                        : {}),
                    ...(data.note !== undefined
                        ? { note: data.note?.trim() || null }
                        : {}),
                }

                const { error } = await supabase
                    .from('debts')
                    .update(normalized)
                    .eq('id', id)

                if (error) {
                    console.error('[debts] update failed:', error)
                    toast.error('Gagal update')
                    return { success: false }
                }

                toast.success('Berhasil diupdate')
                router.refresh()
                return { success: true }
            }, 'Menyimpan perubahan...')
        },
        [supabase, router, track]
    )

    // ============================================================
    // DELETE
    // ============================================================
    const deleteDebt = useCallback(
        async (id: string) => {
            return track(async () => {
                const { error } = await supabase.from('debts').delete().eq('id', id)

                if (error) {
                    console.error('[debts] delete failed:', error)
                    toast.error('Gagal hapus')
                    return { success: false }
                }

                toast.success('Dihapus')
                router.refresh()
                return { success: true }
            }, 'Menghapus...')
        },
        [supabase, router, track]
    )

    // ============================================================
    // RECORD PAYMENT (auto-create transaction + sync ke split bill)
    // ============================================================
    const recordPayment = useCallback(
        async (debtId: string, data: PaymentInput) => {
            return track(async () => {
                const {
                    data: { user },
                } = await supabase.auth.getUser()
                if (!user) {
                    toast.error('Anda belum login')
                    return { success: false }
                }

                const { data: debt } = await supabase
                    .from('debts')
                    .select(
                        'id, name, type, principal, outstanding, status, profile_id, event_participant_id'
                    )
                    .eq('id', debtId)
                    .maybeSingle()

                if (!debt) {
                    toast.error('Tidak ditemukan')
                    return { success: false }
                }

                if (debt.status !== 'active' && debt.status !== 'overdue') {
                    toast.error('Sudah lunas atau dibatalkan')
                    return { success: false }
                }

                const outstanding = Number(debt.outstanding)
                if (data.amount > outstanding) {
                    toast.error(`Sisa hanya ${formatRupiah(outstanding)}`)
                    return { success: false }
                }

                const isDebt = debt.type === 'debt'
                const txType = isDebt ? 'expense' : 'income'
                const txName = isDebt
                    ? `Bayar ${debt.name}`
                    : `Terima dari ${debt.name}`

                const { data: tx, error: txErr } = await supabase
                    .from('transactions')
                    .insert({
                        user_id: user.id,
                        profile_id: debt.profile_id,
                        date: new Date(data.date).toISOString(),
                        name: txName,
                        type: txType,
                        account_id: data.account_id,
                        category_id: null,
                        amount: data.amount,
                        amount_idr: data.amount,
                        currency: 'IDR',
                        exchange_rate: 1,
                        status: 'cleared',
                        exclude_from_budget: true,
                        exclude_from_daily_budget: true,
                        exclude_from_reports: true,
                        note: data.note?.trim() || null,
                    })
                    .select()
                    .single()

                if (txErr || !tx) {
                    console.error('[debts] payment tx failed:', txErr)
                    toast.error('Gagal catat pembayaran')
                    return { success: false }
                }

                await supabase.from('debt_payments').insert({
                    debt_id: debtId,
                    date: new Date(data.date).toISOString(),
                    amount: data.amount,
                    account_id: data.account_id,
                    transaction_id: tx.id,
                    note: data.note?.trim() || null,
                })

                const newOutstanding = Math.max(0, outstanding - data.amount)
                const newStatus = newOutstanding === 0 ? 'paid' : 'active'

                await supabase
                    .from('debts')
                    .update({
                        outstanding: newOutstanding,
                        status: newStatus,
                    })
                    .eq('id', debtId)

                // Sync ke split bill participant kalau fully paid
                if (debt.event_participant_id && newStatus === 'paid') {
                    const { error: participantErr } = await supabase
                        .from('event_participants')
                        .update({
                            paid: true,
                            paid_at: new Date().toISOString(),
                            settled_transaction_id: tx.id,
                        })
                        .eq('id', debt.event_participant_id)

                    if (participantErr) {
                        console.error(
                            '[debts] sync to event_participants failed:',
                            participantErr
                        )
                    }
                }

                toast.success(`Pembayaran ${formatRupiah(data.amount)} dicatat`, {
                    description:
                        newStatus === 'paid'
                            ? '🎉 Lunas!'
                            : `Sisa ${formatRupiah(newOutstanding)}`,
                })
                router.refresh()
                return { success: true }
            }, 'Memproses pembayaran...')
        },
        [supabase, router, track]
    )

    // ============================================================
    // UPDATE STATUS
    // ============================================================
    const updateStatus = useCallback(
        async (
            id: string,
            status: 'active' | 'paid' | 'overdue' | 'cancelled'
        ) => {
            return track(async () => {
                const { error } = await supabase
                    .from('debts')
                    .update({ status })
                    .eq('id', id)

                if (error) {
                    console.error('[debts] status failed:', error)
                    toast.error('Gagal update status')
                    return { success: false }
                }

                const labels: Record<string, string> = {
                    active: 'Diaktifkan',
                    paid: 'Ditandai lunas',
                    overdue: 'Ditandai telat',
                    cancelled: 'Dibatalkan',
                }
                toast.success(labels[status])
                router.refresh()
                return { success: true }
            }, 'Memproses...')
        },
        [supabase, router, track]
    )

    return {
        createDebt,
        updateDebt,
        deleteDebt,
        recordPayment,
        updateStatus,
    }
}