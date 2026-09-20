'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Account = Database['public']['Tables']['accounts']['Row']
type AccountInsert = Database['public']['Tables']['accounts']['Insert']
type AccountUpdate = Database['public']['Tables']['accounts']['Update']

export function useAccounts() {
  const router = useRouter()
  const supabase = createClient()

  const createAccount = useCallback(
    async (data: Omit<AccountInsert, 'user_id'>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Lu belum login')
        return { success: false }
      }

      const { error } = await supabase
        .from('accounts')
        .insert({ ...data, user_id: user.id })

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
    async (id: string, data: AccountUpdate) => {
      const { error } = await supabase
        .from('accounts')
        .update(data)
        .eq('id', id)

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
      // Soft delete: set is_archived = true
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

  return { createAccount, updateAccount, deleteAccount }
}