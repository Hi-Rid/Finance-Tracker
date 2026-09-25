'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { capitalizeFirst, smartCapitalize } from '@/lib/normalize'
import type { Database } from '@/types/database'
import type { TransactionInput } from '@/lib/validators/transaction'

type Transaction = Database['public']['Tables']['transactions']['Row']

export function useTransactions() {
  const router = useRouter()
  const supabase = createClient()

  const createTransaction = useCallback(
    async (
      data: TransactionInput,
      profileId: string,
      receiptId?: string | null
    ) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Lu belum login')
        return { success: false }
      }

      // Normalize
      const normalized = {
        user_id: user.id,
        profile_id: profileId,
        name: capitalizeFirst(data.name),
        date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
        type: data.type,
        account_id: data.account_id,
        to_account_id: data.type === 'transfer' ? data.to_account_id : null,
        category_id: data.category_id || null,
        daily_item_id: data.daily_item_id || null,
        amount: data.amount,
        amount_idr: data.amount, // asumsi IDR untuk sekarang
        currency: 'IDR',
        exchange_rate: 1,
        merchant: data.merchant ? smartCapitalize(data.merchant) : null,
        note: data.note?.trim() || null,
        ppn_amount: data.ppn_amount,
        pph_amount: data.pph_amount,
        status: data.status,
        exclude_from_budget: data.exclude_from_budget,
        exclude_from_daily_budget: data.exclude_from_daily_budget,
        exclude_from_reports: data.exclude_from_reports,
      }

      const { data: created, error } = await supabase
        .from('transactions')
        .insert(normalized)
        .select()
        .single()

      if (error || !created) {
        console.error('Create transaction error:', error)
        toast.error(error?.message || 'Gagal menyimpan')
        return { success: false, error }
      }

      // Link receipt → transaction
      if (receiptId) {
        const { error: linkError } = await supabase
          .from('receipts')
          .update({ transaction_id: created.id })
          .eq('id', receiptId)

        if (linkError) {
          console.error('Failed to link receipt:', linkError)
        }
      }

      toast.success('Transaksi tersimpan')
      router.refresh()
      return { success: true }
    },
    [supabase, router]
  )

  const updateTransaction = useCallback(
    async (id: string, data: TransactionInput, profileId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Lu belum login')
        return { success: false }
      }

      const normalized = {
        name: capitalizeFirst(data.name),
        date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
        type: data.type,
        account_id: data.account_id,
        to_account_id: data.type === 'transfer' ? data.to_account_id : null,
        category_id: data.category_id || null,
        daily_item_id: data.daily_item_id || null,
        amount: data.amount,
        amount_idr: data.amount,
        merchant: data.merchant ? smartCapitalize(data.merchant) : null,
        note: data.note?.trim() || null,
        ppn_amount: data.ppn_amount,
        pph_amount: data.pph_amount,
        status: data.status,
        exclude_from_budget: data.exclude_from_budget,
        exclude_from_daily_budget: data.exclude_from_daily_budget,
        exclude_from_reports: data.exclude_from_reports,
      }

      const { data: updated, error } = await supabase
        .from('transactions')
        .update(normalized)
        .eq('id', id)
        .select()

      if (error) {
        console.error('Update transaction error:', error)
        toast.error(error.message)
        return { success: false, error }
      }

      if (!updated || updated.length === 0) {
        toast.error('Gagal update: akses ditolak')
        return { success: false }
      }

      toast.success('Transaksi diupdate')
      router.refresh()
      return { success: true }
    },
    [supabase, router]
  )

  const deleteTransaction = useCallback(
    async (id: string) => {
      // Soft delete
      const { data: updated, error } = await supabase
        .from('transactions')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id)
        .select()

      if (error) {
        toast.error(error.message)
        return { success: false, error }
      }

      if (!updated || updated.length === 0) {
        toast.error('Gagal hapus: akses ditolak')
        return { success: false }
      }

      toast.success('Transaksi dihapus', {
        description: 'Bisa di-restore dari Trash dalam 30 hari.',
      })
      router.refresh()
      return { success: true }
    },
    [supabase, router]
  )

  const bulkDeleteTransactions = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return { success: false }

      const { data: updated, error } = await supabase
        .from('transactions')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .in('id', ids)
        .select('id')

      if (error) {
        toast.error(error.message)
        return { success: false, error }
      }

      if (!updated || updated.length === 0) {
        toast.error('Gagal hapus: akses ditolak')
        return { success: false }
      }

      toast.success(`${updated.length} transaksi dihapus`, {
        description: 'Bisa di-restore dari Trash dalam 30 hari.',
      })
      router.refresh()
      return { success: true, count: updated.length }
    },
    [supabase, router]
  )

  return {
    createTransaction,
    updateTransaction,
    deleteTransaction,
    bulkDeleteTransactions,
  }
}