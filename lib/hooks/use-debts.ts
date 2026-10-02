'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { smartCapitalize, formatRupiah } from '@/lib/normalize'
import type { DebtInput, PaymentInput } from '@/lib/validators/debts'

export function useDebts() {
    const router = useRouter()
    const supabase = createClient()

    // ============================================================
    // CREATE
    // ============================================================
    const createDebt = useCallback(
        async (data: DebtInput, profileId: string) => {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) {
                toast.error('Lu belum login')
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
                toast.error('Gagal bikin ' + (data.type === 'debt' ? 'utang' : 'piutang'))
                return { success: false }
            }

            toast.success(
                data.type === 'debt' ? 'Utang dicatat' : 'Piutang dicatat'
            )
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    // ============================================================
    // UPDATE
    // ============================================================
    const updateDebt = useCallback(
        async (id: string, data: Partial<DebtInput>) => {
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
        },
        [supabase, router]
    )

    // ============================================================
    // DELETE
    // ============================================================
    const deleteDebt = useCallback(
        async (id: string) => {
            const { error } = await supabase.from('debts').delete().eq('id', id)

            if (error) {
                console.error('[debts] delete failed:', error)
                toast.error('Gagal hapus')
                return { success: false }
            }

            toast.success('Dihapus')
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    // ============================================================
    // RECORD PAYMENT (auto-create transaction + sync ke split bill)
    // ============================================================
    const recordPayment = useCallback(
        async (debtId: string, data: PaymentInput) => {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) {
                toast.error('Lu belum login')
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
                toast.error('Gak ditemukan')
                return { success: false }
            }

            if (debt.status !== 'active' && debt.status !== 'overdue') {
                toast.error('Udah lunas atau dibatalkan')
                return { success: false }
            }

            const outstanding = Number(debt.outstanding)
            if (data.amount > outstanding) {
                toast.error(
                    `Sisa cuma ${formatRupiah(outstanding)}`
                )
                return { success: false }
            }

            const isDebt = debt.type === 'debt'
            const txType = isDebt ? 'expense' : 'income'
            const txName = isDebt
                ? `Bayar ${debt.name}`
                : `Terima dari ${debt.name}`

            // Insert transaction
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

            // Insert debt_payment
            await supabase.from('debt_payments').insert({
                debt_id: debtId,
                date: new Date(data.date).toISOString(),
                amount: data.amount,
                account_id: data.account_id,
                transaction_id: tx.id,
                note: data.note?.trim() || null,
            })

            // Update outstanding + status
            const newOutstanding = Math.max(0, outstanding - data.amount)
            const newStatus = newOutstanding === 0 ? 'paid' : 'active'

            await supabase
                .from('debts')
                .update({
                    outstanding: newOutstanding,
                    status: newStatus,
                })
                .eq('id', debtId)

            // ============================================================
            // SYNC KE SPLIT BILL: kalau debt ini linked ke event_participant
            // & fully paid → tandai participant sebagai paid
            // ============================================================
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
                    // Gak blocking - debt tetap ke-update
                    console.error(
                        '[debts] sync to event_participants failed:',
                        participantErr
                    )
                }
            }

            toast.success(
                `Pembayaran ${formatRupiah(data.amount)} dicatat`,
                {
                    description:
                        newStatus === 'paid'
                            ? '🎉 Lunas!'
                            : `Sisa ${formatRupiah(newOutstanding)}`,
                }
            )
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    // ============================================================
    // UPDATE STATUS
    // ============================================================
    const updateStatus = useCallback(
        async (
            id: string,
            status: 'active' | 'paid' | 'overdue' | 'cancelled'
        ) => {
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
        },
        [supabase, router]
    )

    return {
        createDebt,
        updateDebt,
        deleteDebt,
        recordPayment,
        updateStatus,
    }
}