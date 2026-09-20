'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
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
import { Loader2 } from 'lucide-react'
import type { Database } from '@/types/database'

type Account = Database['public']['Tables']['accounts']['Row']

const accountSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  type: z.enum(['cash', 'bank', 'ewallet', 'credit', 'paylater', 'investment', 'other']),
  initial_balance: z.coerce.number(),
  note: z.string().optional(),
})

type AccountFormValues = z.infer<typeof accountSchema>

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
  onSuccess?: () => void
  onCancel?: () => void
}

export function AccountForm({
  profileId,
  account,
  onSuccess,
  onCancel,
}: AccountFormProps) {
  const { createAccount, updateAccount } = useAccounts()
  const isEdit = !!account

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: account?.name || '',
      type: (account?.type as AccountFormValues['type']) || 'bank',
      initial_balance: account?.initial_balance || 0,
      note: account?.note || '',
    },
  })

  const {
    formState: { isSubmitting },
  } = form

  async function onSubmit(data: AccountFormValues) {
    // Normalize nama akun → UPPERCASE
    const normalized = {
      ...data,
      name: toUppercase(data.name),
      profile_id: profileId,
      currency: 'IDR',
      current_balance: isEdit ? account!.current_balance : data.initial_balance,
    }

    if (isEdit && account) {
      const result = await updateAccount(account.id, normalized)
      if (result.success) {
        onSuccess?.()
        form.reset()
      }
    } else {
      const result = await createAccount(normalized)
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
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0"
                  {...field}
                  onChange={(e) =>
                    field.onChange(e.target.value === '' ? 0 : Number(e.target.value))
                  }
                />
              </FormControl>
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
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Simpan' : 'Tambah'}
          </Button>
        </div>
      </form>
    </Form>
  )
}