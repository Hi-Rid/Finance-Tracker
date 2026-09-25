'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { toUppercase, formatRupiah } from '@/lib/normalize'
import type { Database } from '@/types/database'
import type {
  CreateAccountInput,
  TopupInput,
  TransferInput,
  AdjustmentInput,
} from '@/lib/validators/account'

type AccountUpdate = Database['public']['Tables']['accounts']['Update']

export function useAccounts() {
  const router = useRouter()
  const supabase = createClient()

  const createAccount = useCallback(
    async (data: CreateAccountInput & { profileId: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Lu belum login')
        return { success: false }
      }

      const { error } = await supabase.from('accounts').insert({
        user_id: user.id,
        profile_id: data.profileId,
        name: toUppercase(data.name),
        type: data.type,
        currency: 'IDR',
        initial_balance: data.initial_balance,
        current_balance: data.initial_balance,
        note: data.note?.trim() || null,
      })

      if (error) {
        toast.error(error.message)
        return { success: false, error }
      }

      toast.success('Akun berhasil dibuat')
      router.refresh()
      return { success: true }
    },
    [supabase, router]
  )

  const updateAccount = useCallback(
    async (id: string, data: Partial<AccountUpdate>) => {
      const { error } = await supabase.from('accounts').update(data).eq('id', id)
      if (error) {
        toast.error(error.message)
        return { success: false, error }
      }
      toast.success('Akun berhasil diupdate')
      router.refresh()
      return { success: true }
    },
    [supabase, router]
  )

  const deleteAccount = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('accounts')
        .update({ is_archived: true })
        .eq('id', id)
      if (error) {
        toast.error(error.message)
        return { success: false, error }
      }
      toast.success('Akun diarsipkan')
      router.refresh()
      return { success: true }
    },
    [supabase, router]
  )

  // ============================================================
  // TOP-UP
  // ============================================================
  const topup = useCallback(
    async (data: TopupInput, profileId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Lu belum login')
        return { success: false }
      }

      let categoryId = data.category_id || null
      if (categoryId) {
        const { data: cat } = await supabase
          .from('categories')
          .select('type')
          .eq('id', categoryId)
          .single()
        if (cat && cat.type !== 'income') {
          toast.error('Kategori harus tipe income')
          return { success: false }
        }
      }

      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        profile_id: profileId,
        date: new Date(data.date).toISOString(),
        name: data.note?.trim() || 'Tambah Saldo',
        type: 'income',
        account_id: data.account_id,
        category_id: categoryId,
        amount: data.amount,
        amount_idr: data.amount,
        currency: 'IDR',
        exchange_rate: 1,
        status: 'cleared',
        exclude_from_budget: false,
        exclude_from_daily_budget: true,
        exclude_from_reports: false,
        note: data.note?.trim() || null,
      })

      if (error) {
        console.error('[topup] failed:', error)
        toast.error('Gagal tambah saldo')
        return { success: false, error }
      }

      toast.success(`Saldo ditambah ${formatRupiah(data.amount)}`)
      router.refresh()
      return { success: true }
    },
    [supabase, router]
  )

  // ============================================================
  // TRANSFER
  // ============================================================
  const transfer = useCallback(
    async (data: TransferInput, profileId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Lu belum login')
        return { success: false }
      }

      // Cek saldo akun sumber (harus cover amount + fee)
      const { data: sourceAcc } = await supabase
        .from('accounts')
        .select('name, current_balance')
        .eq('id', data.from_account_id)
        .single()

      const totalDeduct = data.amount + data.fee

      if (sourceAcc && totalDeduct > Number(sourceAcc.current_balance)) {
        toast.error(
          `Saldo ${sourceAcc.name} tidak cukup. Butuh ${formatRupiah(totalDeduct)}, tersedia ${formatRupiah(Number(sourceAcc.current_balance))}`
        )
        return { success: false }
      }

      // Fetch account names
      const [srcRes, dstRes] = await Promise.all([
        supabase.from('accounts').select('name').eq('id', data.from_account_id).single(),
        supabase.from('accounts').select('name').eq('id', data.to_account_id).single(),
      ])

      const sourceName = srcRes.data?.name || ''
      const destName = dstRes.data?.name || ''
      const txDate = new Date(data.date).toISOString()

      // ============ 1. Insert transfer transaction ============
      const { error: transferErr } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          profile_id: profileId,
          date: txDate,
          name: `Transfer ${sourceName} → ${destName}`,
          type: 'transfer',
          account_id: data.from_account_id,
          to_account_id: data.to_account_id,
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

      if (transferErr) {
        console.error('[transfer] failed:', transferErr)
        toast.error('Gagal transfer')
        return { success: false, error: transferErr }
      }

      // ============ 2. Insert fee as expense (kalau ada) ============
      if (data.fee > 0) {
        const { data: feeCat } = await supabase
          .from('categories')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', 'Biaya Transfer')
          .maybeSingle()

        const { error: feeErr } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            profile_id: profileId,
            date: txDate,
            name: `Biaya Transfer ${sourceName} → ${destName}`,
            type: 'expense',
            account_id: data.from_account_id,
            category_id: feeCat?.id || null,
            amount: data.fee,
            amount_idr: data.fee,
            currency: 'IDR',
            exchange_rate: 1,
            status: 'cleared',
            exclude_from_budget: true,
            exclude_from_daily_budget: true,
            exclude_from_reports: false,
            note: 'Biaya admin transfer',
          })

        if (feeErr) {
          console.error('[transfer] fee insert failed:', feeErr)
          // Transfer berhasil, fee gagal — kasih warning tapi jangan rollback
          toast.warning('Transfer berhasil, tapi biaya transfer gagal dicatat')
        }
      }

      toast.success(
        `Transfer ${formatRupiah(data.amount)}${data.fee > 0 ? ` (fee ${formatRupiah(data.fee)})` : ''}`
      )
      router.refresh()
      return { success: true }
    },
    [supabase, router]
  )

  // ============================================================
  // ADJUST BALANCE
  // ============================================================
  const adjustBalance = useCallback(
    async (data: AdjustmentInput, profileId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Lu belum login')
        return { success: false }
      }

      const delta = data.actual_balance - data.current_balance

      if (Math.abs(delta) < 0.01) {
        toast.info('Saldo sudah sesuai, tidak ada penyesuaian')
        return { success: false }
      }

      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', 'Penyesuaian Saldo')
        .maybeSingle()

      const isPositive = delta > 0
      // Trigger apply_transaction_effect:
      //   type='adjustment' → +amount
      //   type='expense'    → -amount
      const txType = isPositive ? 'adjustment' : 'expense'

      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        profile_id: profileId,
        date: new Date(data.date).toISOString(),
        name: `Penyesuaian Saldo: ${data.note}`,
        type: txType,
        account_id: data.account_id,
        category_id: cat?.id || null,
        amount: Math.abs(delta),
        amount_idr: Math.abs(delta),
        currency: 'IDR',
        exchange_rate: 1,
        status: 'cleared',
        exclude_from_budget: true,
        exclude_from_daily_budget: true,
        exclude_from_reports: true,
        note: `Selisih ${isPositive ? '+' : '-'}${formatRupiah(Math.abs(delta))} — ${data.note}`,
      })

      if (error) {
        console.error('[adjust] failed:', error)
        toast.error('Gagal koreksi saldo')
        return { success: false, error }
      }

      toast.success(
        `Saldo disesuaikan ${isPositive ? '+' : '-'}${formatRupiah(Math.abs(delta))}`
      )
      router.refresh()
      return { success: true }
    },
    [supabase, router]
  )

  return {
    createAccount,
    updateAccount,
    deleteAccount,
    topup,
    transfer,
    adjustBalance,
  }
}