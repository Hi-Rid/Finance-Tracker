'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { useAccounts } from '@/lib/hooks/use-accounts'
import { toUppercase } from '@/lib/normalize'
import {
  Loader2,
  Lock,
  Info,
  Landmark,
  Smartphone,
  CreditCard,
  TrendingUp,
  MoreHorizontal,
  Banknote,
} from 'lucide-react'
import {
  createAccountSchema,
  type CreateAccountInput,
} from '@/lib/validators/account'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Account = Database['public']['Tables']['accounts']['Row']

type AccountFormValues = CreateAccountInput

const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Cash', icon: Banknote, color: '#64748b' },
  { value: 'bank', label: 'Bank', icon: Landmark, color: '#334DAF' },
  { value: 'ewallet', label: 'E-Wallet', icon: Smartphone, color: '#10b981' },
  { value: 'investment', label: 'Investasi', icon: TrendingUp, color: '#eab308' },
  { value: 'paylater', label: 'Paylater', icon: CreditCard, color: '#ef4444' },
  { value: 'credit', label: 'Kartu Kredit', icon: CreditCard, color: '#f59e0b' },
  { value: 'other', label: 'Lainnya', icon: MoreHorizontal, color: '#64748b' },
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

  const isBalanceLocked = isEdit && hasTransactions

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(createAccountSchema) as any,
    defaultValues: {
      name: account?.name || '',
      type: (account?.type as AccountFormValues['type']) || 'bank',
      initial_balance: account?.initial_balance
        ? Number(account.initial_balance)
        : 0,
      note: account?.note || '',
    },
  })

  const {
    watch,
    formState: { isSubmitting },
  } = form

  const watchedType = watch('type')
  const watchedBalance = watch('initial_balance')

  const activeTypeMeta =
    ACCOUNT_TYPES.find((t) => t.value === watchedType) || ACCOUNT_TYPES[1]

  async function onSubmit(data: AccountFormValues) {
    const normalized = {
      ...data,
      name: toUppercase(data.name),
    }

    if (isEdit && account) {
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* NAMA */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Akun</FormLabel>
              <FormControl>
                <Input
                  placeholder="BCA, Jago, GoPay..."
                  autoComplete="off"
                  autoFocus={!isEdit}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* TIPE */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipe Akun</FormLabel>
              <FormControl>
                <div className="grid grid-cols-4 gap-1.5">
                  {ACCOUNT_TYPES.map((t) => {
                    const Icon = t.icon
                    const isActive = field.value === t.value
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => field.onChange(t.value)}
                        className={cn(
                          'flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-lg border transition-all cursor-pointer',
                          isActive
                            ? 'shadow-sm'
                            : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 hover:border-brand/30'
                        )}
                        style={
                          isActive
                            ? {
                              borderColor: t.color,
                              backgroundColor: `${t.color}10`,
                            }
                            : undefined
                        }
                      >
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: isActive
                              ? `${t.color}20`
                              : 'rgba(100,116,139,0.1)',
                          }}
                        >
                          <Icon
                            className="w-3.5 h-3.5"
                            style={{ color: isActive ? t.color : '#94a3b8' }}
                            strokeWidth={2.4}
                          />
                        </div>
                        <span
                          className={cn(
                            'text-[10px] font-semibold text-center leading-tight',
                            isActive
                              ? 'text-slate-900 dark:text-white'
                              : 'text-slate-500 dark:text-slate-400'
                          )}
                        >
                          {t.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* SALDO */}
        <FormField
          control={form.control}
          name="initial_balance"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between gap-2">
                <FormLabel>
                  {isEdit ? 'Saldo Awal' : 'Saldo Saat Ini'}
                </FormLabel>
                {isBalanceLocked && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                    <Lock className="w-3 h-3" />
                    Terkunci
                  </span>
                )}
              </div>
              <FormControl>
                <div
                  className={cn(
                    'relative rounded-xl border-2 px-4 py-3 transition-all',
                    'bg-gradient-to-br from-slate-50 to-white dark:from-white/[0.03] dark:to-white/[0.01]',
                    isBalanceLocked
                      ? 'border-slate-200 dark:border-white/10 opacity-60'
                      : 'border-slate-200 dark:border-white/10 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20'
                  )}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold shrink-0 text-slate-500 dark:text-slate-400">
                      Rp
                    </span>
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="0"
                      disabled={isBalanceLocked}
                      className={cn(
                        'border-0 bg-transparent p-0 h-auto text-2xl font-bold shadow-none',
                        'focus-visible:ring-0 focus-visible:border-0',
                        'placeholder:text-slate-300 dark:placeholder:text-white/20'
                      )}
                    />
                  </div>
                </div>
              </FormControl>

              {isBalanceLocked && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-2.5 flex gap-2">
                  <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    Saldo awal terkunci karena udah ada transaksi. Pakai tombol{' '}
                    <strong>Tambah Saldo</strong> atau{' '}
                    <strong>Koreksi Saldo</strong> untuk penyesuaian.
                  </p>
                </div>
              )}

              {!isEdit && !isBalanceLocked && (
                <FormDescription>
                  Isi saldo yang ada di akun ini sekarang
                </FormDescription>
              )}

              <FormMessage />
            </FormItem>
          )}
        />

        {/* CATATAN */}
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Catatan{' '}
                <span className="text-muted-foreground font-normal">
                  (opsional)
                </span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Rekening utama, tabungan..."
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ACTIONS */}
        <div className="flex gap-2 pt-1">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 h-11"
            >
              Batal
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 h-11 font-bold"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Simpan' : 'Tambah Akun'}
          </Button>
        </div>
      </form>
    </Form>
  )
}