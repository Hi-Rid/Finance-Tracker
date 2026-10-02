'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { smartCapitalize, formatRupiah } from '@/lib/normalize'
import type {
    GoalInput,
    ContributionInput,
    WithdrawGoalInput,
} from '@/lib/validators/goals'

export function useGoals() {
    const router = useRouter()
    const supabase = createClient()

    // ============================================================
    // CREATE GOAL — auto-create envelope account
    // ============================================================
    const createGoal = useCallback(
        async (data: GoalInput, profileId: string) => {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) {
                toast.error('Lu belum login')
                return { success: false }
            }

            // 1. Insert goal
            const { data: created, error: goalErr } = await supabase
                .from('goals')
                .insert({
                    user_id: user.id,
                    profile_id: profileId,
                    name: smartCapitalize(data.name),
                    type: data.type,
                    target_amount: data.target_amount,
                    current_amount: 0,
                    currency: 'IDR',
                    target_date: data.target_date || null,
                    note: data.note?.trim() || null,
                    status: 'active',
                })
                .select()
                .single()

            if (goalErr || !created) {
                console.error('[goals] create failed:', goalErr)
                toast.error('Gagal bikin goal')
                return { success: false }
            }

            // 2. Insert envelope account
            const { data: envelope, error: envErr } = await supabase
                .from('accounts')
                .insert({
                    user_id: user.id,
                    profile_id: profileId,
                    name: `Envelope: ${created.name}`,
                    type: 'envelope',
                    currency: 'IDR',
                    initial_balance: 0,
                    current_balance: 0,
                    linked_goal_id: created.id,
                })
                .select()
                .single()

            if (envErr || !envelope) {
                console.error('[goals] envelope create failed:', envErr)
                // Rollback goal
                await supabase.from('goals').delete().eq('id', created.id)
                toast.error('Gagal bikin envelope goal')
                return { success: false }
            }

            // 3. Update goal with envelope_account_id
            await supabase
                .from('goals')
                .update({ envelope_account_id: envelope.id })
                .eq('id', created.id)

            toast.success('Goal ditambahkan', {
                description: 'Setor uang buat mulai nabung.',
            })
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    // ============================================================
    // UPDATE GOAL
    // ============================================================
    const updateGoal = useCallback(
        async (id: string, data: Partial<GoalInput>) => {
            const normalized: any = {
                ...data,
                ...(data.name ? { name: smartCapitalize(data.name) } : {}),
                ...(data.note !== undefined
                    ? { note: data.note?.trim() || null }
                    : {}),
                ...(data.target_date !== undefined
                    ? { target_date: data.target_date || null }
                    : {}),
            }

            const { error } = await supabase
                .from('goals')
                .update(normalized)
                .eq('id', id)

            if (error) {
                console.error('[goals] update failed:', error)
                toast.error('Gagal update goal')
                return { success: false }
            }

            // Sync envelope name kalau goal name berubah
            if (data.name) {
                const { data: goal } = await supabase
                    .from('goals')
                    .select('envelope_account_id')
                    .eq('id', id)
                    .maybeSingle()

                if (goal?.envelope_account_id) {
                    await supabase
                        .from('accounts')
                        .update({
                            name: `Envelope: ${smartCapitalize(data.name)}`,
                        })
                        .eq('id', goal.envelope_account_id)
                }
            }

            toast.success('Goal diupdate')
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    // ============================================================
    // DELETE GOAL — cascade hapus envelope
    // ============================================================
    const deleteGoal = useCallback(
        async (id: string) => {
            // Ambil info dulu
            const { data: goal } = await supabase
                .from('goals')
                .select('id, name, envelope_account_id')
                .eq('id', id)
                .maybeSingle()

            if (!goal) {
                toast.error('Goal gak ditemukan')
                return { success: false }
            }

            // Delete goal (envelope auto-delete via CASCADE)
            const { error } = await supabase.from('goals').delete().eq('id', id)

            if (error) {
                console.error('[goals] delete failed:', error)
                toast.error('Gagal hapus goal')
                return { success: false }
            }

            // Explicitly delete envelope (in case CASCADE gak jalan)
            if (goal.envelope_account_id) {
                await supabase
                    .from('accounts')
                    .delete()
                    .eq('id', goal.envelope_account_id)
            }

            toast.success('Goal dihapus')
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    // ============================================================
    // CONTRIBUTE — transfer dari akun → envelope goal
    // ============================================================
    const contribute = useCallback(
        async (goalId: string, data: ContributionInput) => {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) {
                toast.error('Lu belum login')
                return { success: false }
            }

            // Fetch goal
            const { data: goal } = await supabase
                .from('goals')
                .select(
                    'id, name, profile_id, envelope_account_id, current_amount, target_amount, status'
                )
                .eq('id', goalId)
                .maybeSingle()

            if (!goal) {
                toast.error('Goal gak ditemukan')
                return { success: false }
            }

            if (!goal.envelope_account_id) {
                toast.error('Envelope goal gak ada. Coba refresh.')
                return { success: false }
            }

            if (goal.status !== 'active') {
                toast.error('Goal udah selesai atau dibatalkan')
                return { success: false }
            }

            // Validasi akun sumber
            const { data: sourceAcc } = await supabase
                .from('accounts')
                .select('id, name, current_balance, type')
                .eq('id', data.account_id)
                .maybeSingle()

            if (!sourceAcc) {
                toast.error('Akun sumber gak ditemukan')
                return { success: false }
            }

            if (sourceAcc.type === 'envelope') {
                toast.error('Gak bisa setor dari envelope lain')
                return { success: false }
            }

            if (data.amount > Number(sourceAcc.current_balance)) {
                toast.error(
                    `Saldo ${sourceAcc.name} cuma ${formatRupiah(
                        Number(sourceAcc.current_balance)
                    )}`
                )
                return { success: false }
            }

            // Insert transfer transaction
            const { error: txErr } = await supabase
                .from('transactions')
                .insert({
                    user_id: user.id,
                    profile_id: goal.profile_id,
                    date: new Date(data.date).toISOString(),
                    name: `Setor ${goal.name}`,
                    type: 'transfer',
                    account_id: data.account_id,
                    to_account_id: goal.envelope_account_id,
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
                    internal_ref_type: 'goal_deposit',
                    internal_ref_id: goalId,
                    note: data.note?.trim() || null,
                })

            if (txErr) {
                console.error('[goals] contribute failed:', txErr)
                toast.error('Gagal setor')
                return { success: false }
            }

            // Update goal current_amount + status
            const newAmount = Number(goal.current_amount) + data.amount
            const target = Number(goal.target_amount)
            const newStatus = newAmount >= target ? 'achieved' : 'active'

            await supabase
                .from('goals')
                .update({
                    current_amount: newAmount,
                    status: newStatus,
                })
                .eq('id', goalId)

            toast.success(`Setor ${formatRupiah(data.amount)} berhasil`, {
                description:
                    newStatus === 'achieved'
                        ? '🎉 Target goal tercapai!'
                        : undefined,
            })
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    // ============================================================
    // WITHDRAW — transfer dari envelope → akun
    // ============================================================
    const withdraw = useCallback(
        async (goalId: string, data: WithdrawGoalInput) => {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) {
                toast.error('Lu belum login')
                return { success: false }
            }

            const { data: goal } = await supabase
                .from('goals')
                .select(
                    'id, name, profile_id, envelope_account_id, current_amount, target_amount, status'
                )
                .eq('id', goalId)
                .maybeSingle()

            if (!goal) {
                toast.error('Goal gak ditemukan')
                return { success: false }
            }

            if (!goal.envelope_account_id) {
                toast.error('Envelope goal gak ada')
                return { success: false }
            }

            const currentAmount = Number(goal.current_amount)
            if (data.amount > currentAmount) {
                toast.error(
                    `Cuma bisa tarik ${formatRupiah(currentAmount)}`
                )
                return { success: false }
            }

            // Validasi akun tujuan
            const { data: destAcc } = await supabase
                .from('accounts')
                .select('id, name, type')
                .eq('id', data.account_id)
                .maybeSingle()

            if (!destAcc) {
                toast.error('Akun tujuan gak ditemukan')
                return { success: false }
            }

            if (destAcc.type === 'envelope') {
                toast.error('Gak bisa tarik ke envelope lain')
                return { success: false }
            }

            // Insert transfer transaction (envelope → akun)
            const { error: txErr } = await supabase
                .from('transactions')
                .insert({
                    user_id: user.id,
                    profile_id: goal.profile_id,
                    date: new Date(data.date).toISOString(),
                    name: `Tarik dari ${goal.name}`,
                    type: 'transfer',
                    account_id: goal.envelope_account_id,
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
                    internal_ref_type: 'goal_withdraw',
                    internal_ref_id: goalId,
                    note: data.note?.trim() || null,
                })

            if (txErr) {
                console.error('[goals] withdraw failed:', txErr)
                toast.error('Gagal tarik')
                return { success: false }
            }

            // Update goal
            const newAmount = Math.max(0, currentAmount - data.amount)
            const target = Number(goal.target_amount)
            const newStatus =
                goal.status === 'achieved' && newAmount < target
                    ? 'active'
                    : goal.status

            await supabase
                .from('goals')
                .update({
                    current_amount: newAmount,
                    status: newStatus,
                })
                .eq('id', goalId)

            toast.success(`Tarik ${formatRupiah(data.amount)} berhasil`)
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    // ============================================================
    // UPDATE STATUS
    // ============================================================
    const updateStatus = useCallback(
        async (id: string, status: 'active' | 'achieved' | 'cancelled') => {
            const { error } = await supabase
                .from('goals')
                .update({ status })
                .eq('id', id)

            if (error) {
                console.error('[goals] status update failed:', error)
                toast.error('Gagal update status')
                return { success: false }
            }

            const labelMap = {
                active: 'Goal diaktifkan kembali',
                achieved: 'Goal ditandai selesai',
                cancelled: 'Goal dibatalkan',
            }

            toast.success(labelMap[status])
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    return {
        createGoal,
        updateGoal,
        deleteGoal,
        contribute,
        withdraw,
        updateStatus,
    }
}