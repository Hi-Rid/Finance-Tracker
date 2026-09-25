'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAccounts } from '@/lib/hooks/use-accounts'
import { toUppercase } from '@/lib/normalize'
import { Loader2, Lock, Info } from 'lucide-react'
import { createAccountSchema, type CreateAccountInput } from '@/lib/validators/account'
import type { Database } from '@/types/database'

type Account = Database['public']['Tables']['accounts']['Row']

type AccountFormValues = CreateAccountInput

const accountTypes = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank' },
  { value: 'ewallet', label: 'E-Wallet' },
  { value: 'credit', label: 'Credit Card' },
  { value: 'paylater', label: 'Paylater' },
  { value: 'investment', label: 'Investment' },
  { value: 'other', label: 'Other' },
] as const

type AccountFormProps = {
  profileId: string
  account?: Account | null
  hasTransactions?: boolean
  onSuccess?: () => void
  onCancel?: () => void
}

export function AccountForm({
  profileId,
  account,
  hasTransactions = false,
  onSuccess,
  onCancel,
}: AccountFormProps) {
  const { createAccount, updateAccount } = useAccounts()
  const isEdit = !!account

  // Saldo awal read-only kalau edit akun yang udah punya transaksi
  const isBalanceLocked = isEdit && hasTransactions

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(createAccountSchema) as any,
    defaultValues: {
      name: account?.name || '',
      type: (account?.type as AccountFormValues['type']) || 'bank',
      initial_balance: account?.initial_balance ? Number(account.initial_balance) : 0,
      note: account?.note || '',
    },
  })

  const {
    formState: { isSubmitting },
  } = form

  async function onSubmit(data: AccountFormValues) {
    const normalized = {
      ...data,
      name: toUppercase(data.name),
    }

    if (isEdit && account) {
      // Update: JANGAN update balance, cuma nama/tipe/catatan
      const result = await updateAccount(account.id, {
        name: normalized.name,
        type: normalized.type,
        note: normalized.note?.trim() || null,
      })
      if (result.success) {
        onSuccess?.()
        form.reset()
      }
    } else {
      // Create
      const result = await createAccount({
        ...normalized,
        profileId,
      })
      if (result.success) {
        onSuccess?.()
        form.reset()
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Akun</FormLabel>
              <FormControl>
                <Input placeholder="BCA, Jago, GoPay" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipe</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accountTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="initial_balance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isEdit ? 'Saldo Awal' : 'Saldo Saat Ini'}
                {isBalanceLocked && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                    <Lock className="w-3 h-3" />
                    Terkunci
                  </span>
                )}
              </FormLabel>
              <FormControl>
                <CurrencyInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="0"
                  disabled={isBalanceLocked}
                />
              </FormControl>

              {isBalanceLocked && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-2.5 flex gap-2 mt-2">
                  <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    Saldo awal terkunci karena ada transaksi. Pakai tombol{' '}
                    <strong>Tambah Saldo</strong> atau <strong>Koreksi Saldo</strong>{' '}
                    untuk penyesuaian.
                  </p>
                </div>
              )}

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catatan (opsional)</FormLabel>
              <FormControl>
                <Input placeholder="Rekening utama" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Batal
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Simpan' : 'Tambah'}
          </Button>
        </div>
      </form>
    </Form>
  )
}