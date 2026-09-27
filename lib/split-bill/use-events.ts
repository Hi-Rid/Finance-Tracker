'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { computeEventShares } from './calculator'
import type { EventWizardData } from './types'

export function useEvents() {
    const router = useRouter()
    const supabase = createClient()

    const createEvent = useCallback(
        async (data: EventWizardData, profileId: string) => {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) {
                toast.error('Lu belum login')
                return { success: false }
            }

            if (!data.account_id) {
                toast.error('Pilih akun dulu')
                return { success: false }
            }

            const result = computeEventShares(data)

            if (result.participants.length < 2) {
                toast.error('Minimal 2 peserta')
                return { success: false }
            }

            const { data: cat } = await supabase
                .from('categories')
                .select('id')
                .eq('user_id', user.id)
                .eq('name', 'Split Bill')
                .maybeSingle()

            // ============ 1. Insert event ============
            const payerParticipant = data.participants.find(
                (p) => p.temp_id === data.payer_participant_id
            )

            const { data: event, error: evtErr } = await supabase
                .from('events')
                .insert({
                    user_id: user.id,
                    profile_id: profileId,
                    name: data.name,
                    date: new Date(data.date).toISOString(),
                    payer_is_user: result.payer_is_user,
                    payer_id: null,
                    ppn_rate: data.ppn_rate,
                    service_rate: data.service_rate,
                    discount_amount: data.discount_amount,
                    subtotal: result.subtotal,
                    ppn_amount: result.ppn_amount,
                    service_amount: result.service_amount,
                    grand_total: result.grand_total,
                    user_share: result.user_share,
                    account_id: data.account_id,
                    currency: data.currency,
                    group_id: data.group_id,
                    note: data.note?.trim() || null,
                })
                .select()
                .single()

            if (evtErr || !event) {
                toast.error('Gagal bikin event')
                console.error(evtErr)
                return { success: false }
            }

            // ============ 2. Items ============
            const itemInserts = data.items.map((it, idx) => ({
                event_id: event.id,
                name: it.name.trim() || `Item ${idx + 1}`,
                quantity: it.quantity,
                unit_price: it.unit_price,
                subtotal: it.quantity * it.unit_price,
                sort_order: idx,
            }))

            const { data: insertedItems } = await supabase
                .from('event_items')
                .insert(itemInserts)
                .select()

            // ============ 3. Participants ============
            const participantInserts = result.participants.map((p) => ({
                event_id: event.id,
                contact_id: null,
                is_user: p.is_user,
                display_name: p.display_name || 'Tanpa nama',
                subtotal: p.subtotal,
                ppn_share: p.ppn_share,
                service_share: p.service_share,
                discount_share: p.discount_share,
                total_share: p.total_share,
                paid: p.is_payer,
                paid_at: p.is_payer ? new Date().toISOString() : null,
            }))

            const { data: insertedParticipants } = await supabase
                .from('event_participants')
                .insert(participantInserts)
                .select()

            if (!insertedParticipants) {
                toast.error('Gagal simpan peserta')
                return { success: false }
            }

            const tempToReal: Record<string, string> = {}
            result.participants.forEach((p, i) => {
                tempToReal[p.temp_id] = insertedParticipants[i].id
            })

            // Update event with real payer_participant_id
            const realPayerId = tempToReal[data.payer_participant_id]
            if (realPayerId) {
                await supabase
                    .from('events')
                    .update({ payer_participant_id: realPayerId })
                    .eq('id', event.id)
            }

            // ============ 4. Item shares ============
            if (insertedItems && insertedItems.length > 0) {
                const itemShareInserts: Array<{
                    item_id: string
                    participant_id: string
                    share_amount: number
                }> = []

                data.items.forEach((it, idx) => {
                    const itemId = insertedItems[idx].id
                    const assignees =
                        it.assigned_to.length > 0
                            ? it.assigned_to
                            : data.participants.map((p) => p.temp_id)
                    const itemSubtotal = it.quantity * it.unit_price
                    const sharePerPerson = itemSubtotal / assignees.length

                    assignees.forEach((tempPid) => {
                        const realPid = tempToReal[tempPid]
                        if (realPid) {
                            itemShareInserts.push({
                                item_id: itemId,
                                participant_id: realPid,
                                share_amount: sharePerPerson,
                            })
                        }
                    })
                })

                if (itemShareInserts.length > 0) {
                    await supabase.from('event_item_shares').insert(itemShareInserts)
                }
            }

            // ============ 5. Receipts ============
            if (data.receipt_ids.length > 0) {
                const links = data.receipt_ids.map((rid, idx) => ({
                    event_id: event.id,
                    receipt_id: rid,
                    sort_order: idx,
                }))
                await supabase.from('event_receipts').insert(links)
            }

            // ============ 6. CONDITIONAL: Expense + Receivables/Payable ============
            if (result.payer_is_user) {
                // ---- User yang bayar ----
                // Expense full grand_total dari akun user
                const { data: tx, error: txErr } = await supabase
                    .from('transactions')
                    .insert({
                        user_id: user.id,
                        profile_id: profileId,
                        date: new Date(data.date).toISOString(),
                        name: `Split Bill: ${data.name}`,
                        type: 'expense',
                        account_id: data.account_id,
                        category_id: cat?.id || null,
                        amount: result.grand_total,
                        amount_idr: result.grand_total,
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

                if (tx) {
                    await supabase
                        .from('events')
                        .update({ transaction_id: tx.id })
                        .eq('id', event.id)

                    const userParticipant = insertedParticipants.find((p) => p.is_user)
                    if (userParticipant) {
                        await supabase
                            .from('event_participants')
                            .update({ settled_transaction_id: tx.id })
                            .eq('id', userParticipant.id)
                    }
                }

                // Receivables untuk peserta non-user, non-payer
                const debtInserts = result.participants
                    .filter((p) => !p.is_user)
                    .map((p) => ({
                        user_id: user.id,
                        profile_id: profileId,
                        contact_id: null,
                        event_participant_id: tempToReal[p.temp_id] || null,
                        type: 'receivable',
                        name: `${data.name} — ${p.display_name}`,
                        principal: p.total_share,
                        outstanding: p.total_share,
                        interest_rate: 0,
                        currency: 'IDR',
                        start_date: new Date(data.date).toISOString().split('T')[0],
                        status: 'active',
                        note: `Split bill ${data.name}`,
                    }))

                if (debtInserts.length > 0) {
                    await supabase.from('debts').insert(debtInserts)
                }

                toast.success('Split bill tersimpan — lu talangin dulu')
            } else {
                // ---- Peserta lain yang bayar ----
                // User gak keluar uang → gak ada expense transaction.
                // User punya utang ke payer sebesar user_share.
                const userParticipant = insertedParticipants.find((p) => p.is_user)
                const debtInsert = {
                    user_id: user.id,
                    profile_id: profileId,
                    contact_id: null,
                    event_participant_id: userParticipant?.id || null,
                    type: 'debt',
                    name: `${data.name} — utang ke ${result.payer_name}`,
                    principal: result.user_share,
                    outstanding: result.user_share,
                    interest_rate: 0,
                    currency: 'IDR',
                    start_date: new Date(data.date).toISOString().split('T')[0],
                    status: 'active',
                    note: `Split bill ${data.name} (dibayar ${result.payer_name})`,
                }

                await supabase.from('debts').insert(debtInsert)

                toast.success(`Split bill tersimpan — utang lu ke ${result.payer_name}`)
            }

            router.push('/split-bill')
            router.refresh()
            return { success: true, eventId: event.id }
        },
        [supabase, router]
    )

    const deleteEvent = useCallback(
        async (eventId: string) => {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) return { success: false }

            const { data: event } = await supabase
                .from('events')
                .select('transaction_id')
                .eq('id', eventId)
                .single()

            // Hapus transactions (auto-revert balance via trigger)
            if (event?.transaction_id) {
                await supabase
                    .from('transactions')
                    .delete()
                    .eq('id', event.transaction_id)
            }

            // Hapus debts terkait
            await supabase
                .from('debts')
                .delete()
                .eq('user_id', user.id)
                .like('name', `%${'Split bill'}%`)
                .eq('note', `Split bill ${''}`) // placeholder, skip complex matching

            // Hapus event (cascade hapus items, participants, event_receipts)
            const { error } = await supabase.from('events').delete().eq('id', eventId)

            if (error) {
                toast.error('Gagal hapus event')
                return { success: false }
            }

            toast.success('Event dihapus')
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    const settleParticipant = useCallback(
        async (
            eventId: string,
            participantId: string,
            accountId: string,
            date: string
        ) => {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) return { success: false }

            // Fetch event + participant
            const [eventRes, participantRes] = await Promise.all([
                supabase.from('events').select('*').eq('id', eventId).single(),
                supabase
                    .from('event_participants')
                    .select('*')
                    .eq('id', participantId)
                    .single(),
            ])

            const event = eventRes.data
            const participant = participantRes.data

            if (!event || !participant) {
                toast.error('Data gak ditemukan')
                return { success: false }
            }

            const isUserPayer = event.payer_is_user
            const settlingUser = participant.is_user

            // Determine type
            // - User payer + settle others → income (receivable paid)
            // - User NOT payer + settle self → expense (bayar utang ke payer)
            const isIncome = isUserPayer && !settlingUser
            const isExpense = !isUserPayer && settlingUser

            if (!isIncome && !isExpense) {
                toast.error('Gak bisa settle participant ini')
                return { success: false }
            }

            const catName = isIncome ? 'Settle Bill' : 'Split Bill'
            const { data: cat } = await supabase
                .from('categories')
                .select('id')
                .eq('user_id', user.id)
                .eq('name', catName)
                .maybeSingle()

            const txName = isIncome
                ? `Settle: ${participant.display_name} — ${event.name}`
                : `Bayar Split Bill: ${event.name}`

            const { data: tx, error: txErr } = await supabase
                .from('transactions')
                .insert({
                    user_id: user.id,
                    profile_id: event.profile_id,
                    date: new Date(date).toISOString(),
                    name: txName,
                    type: isIncome ? 'income' : 'expense',
                    account_id: accountId,
                    category_id: cat?.id || null,
                    amount: Number(participant.total_share),
                    amount_idr: Number(participant.total_share),
                    currency: 'IDR',
                    exchange_rate: 1,
                    status: 'cleared',
                    exclude_from_budget: true,
                    exclude_from_daily_budget: true,
                    exclude_from_reports: true,
                    note: isIncome
                        ? `Pengembalian dari ${participant.display_name}`
                        : `Bayar share ke ${event.name}`,
                })
                .select()
                .single()

            if (txErr || !tx) {
                toast.error('Gagal catat transaksi')
                return { success: false }
            }

            // Update participant paid
            await supabase
                .from('event_participants')
                .update({
                    paid: true,
                    paid_at: new Date().toISOString(),
                    settled_transaction_id: tx.id,
                })
                .eq('id', participantId)

            // Update debt by event_participant_id (reliable match)
            const debtType = isIncome ? 'receivable' : 'debt'
            const { data: debt } = await supabase
                .from('debts')
                .select('*')
                .eq('event_participant_id', participantId)
                .eq('type', debtType)
                .maybeSingle()

            if (debt) {
                const newOutstanding = Math.max(
                    0,
                    Number(debt.outstanding) - Number(participant.total_share)
                )
                await supabase
                    .from('debts')
                    .update({
                        outstanding: newOutstanding,
                        status: newOutstanding === 0 ? 'paid' : 'active',
                    })
                    .eq('id', debt.id)
            }

            toast.success(isIncome ? 'Lunas!' : 'Udah dibayar!')
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    return { createEvent, deleteEvent, settleParticipant }
}