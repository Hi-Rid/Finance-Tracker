'use client'

import { useState, useMemo } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown, Loader2, Wallet, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react'
import { useTransactions } from '@/lib/hooks/use-transactions'
import { transactionSchema, type TransactionInput } from '@/lib/validators/transaction'
import { formatRupiah } from '@/lib/normalize'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Account = Database['public']['Tables']['accounts']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Transaction = Database['public']['Tables']['transactions']['Row']

type TransactionFormProps = {
  profileId: string
  accounts: Account[]
  categories: Category[]
  transaction?: Transaction | null
  onSuccess?: () => void
  onCancel?: () => void
}

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Pengeluaran', icon: TrendingDown, color: 'text-red-500' },
  { value: 'income', label: 'Pemasukan', icon: TrendingUp, color: 'text-emerald-500' },
  { value: 'transfer', label: 'Transfer', icon: ArrowLeftRight, color: 'text-brand' },
] as const

export function TransactionForm({
  profileId,
  accounts,
  categories,
  transaction,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const { createTransaction, updateTransaction } = useTransactions()
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const isEdit = !!transaction

  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: {
      name: transaction?.name || '',
      date: transaction?.date
        ? new Date(transaction.date).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      type: (transaction?.type as TransactionInput['type']) || 'expense',
      account_id: transaction?.account_id || accounts[0]?.id || '',
      to_account_id: transaction?.to_account_id || null,
      category_id: transaction?.category_id || null,
      amount: transaction?.amount ? Number(transaction.amount) : 0,
      merchant: transaction?.merchant || '',
      note: transaction?.note || '',
      ppn_amount: transaction?.ppn_amount ? Number(transaction.ppn_amount) : 0,
      pph_amount: transaction?.pph_amount ? Number(transaction.pph_amount) : 0,
      status: (transaction?.status as 'cleared' | 'pending') || 'cleared',
      exclude_from_budget: transaction?.exclude_from_budget || false,
      exclude_from_daily_budget: transaction?.exclude_from_daily_budget || false,
      exclude_from_reports: transaction?.exclude_from_reports || false,
    },
  })

  const {
    watch,
    formState: { isSubmitting },
  } = form

  const watchedType = watch('type')
  const watchedAccountId = watch('account_id')
  const watchedAmount = watch('amount')

  // Filter kategori by type
  const filteredCategories = useMemo(() => {
    if (watchedType === 'transfer') return []
    const catType = watchedType === 'income' ? 'income' : 'expense'
    return categories.filter((c) => c.type === catType && !c.is_archived)
  }, [categories, watchedType])

  // Real-time preview
  const selectedAccount = accounts.find((a) => a.id === watchedAccountId)
  const previewBalance = useMemo(() => {
    if (!selectedAccount) return 0
    const current = Number(selectedAccount.current_balance)
    const amount = Number(watchedAmount) || 0
    if (watchedType === 'expense') return current - amount
    if (watchedType === 'income' || watchedType === 'refund') return current + amount
    if (watchedType === 'transfer') return current - amount
    return current
  }, [selectedAccount, watchedAmount, watchedType])

  async function onSubmit(data: TransactionInput) {
    if (isEdit && transaction) {
      const result = await updateTransaction(transaction.id, data, profileId)
      if (result.success) {
        onSuccess?.()
        form.reset()
      }
    } else {
      const result = await createTransaction(data, profileId)
      if (result.success) {
        onSuccess?.()
        form.reset()
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Type selector — segmented control */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/50 dark:border-white/5">
                  {TYPE_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    const isActive = field.value === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => field.onChange(opt.value)}
                        className={cn(
                          'flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer',
                          isActive
                          ? 'bg-white dark:bg-white/15 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/5 ' + opt.color
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Amount — big prominent */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jumlah</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                    Rp
                  </span>
                  <Input
                    type="number"
                    placeholder="0"
                    className="pl-10 text-lg font-semibold h-12 tabular-nums"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value === 0 ? '' : field.value}
                    onChange={(e) =>
                      field.onChange(e.target.value === '' ? 0 : Number(e.target.value))
                    }
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Nama */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Transaksi</FormLabel>
              <FormControl>
                <Input placeholder="Beli kopi janji jiwa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Account */}
        <FormField
          control={form.control}
          name="account_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {watchedType === 'transfer' ? 'Dari Akun' : 'Akun'}
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih akun" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <div className="flex items-center justify-between gap-3 w-full">
                        <span>{a.name}</span>
                        <span className="text-xs text-slate-500 tabular-nums">
                          {formatRupiah(Number(a.current_balance))}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* To Account (khusus transfer) */}
        {watchedType === 'transfer' && (
          <FormField
            control={form.control}
            name="to_account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ke Akun</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih akun tujuan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts
                      .filter((a) => a.id !== watchedAccountId)
                      .map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Category (kecuali transfer) */}
        {watchedType !== 'transfer' && (
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategori</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Real-time preview */}
        {selectedAccount && watchedAmount > 0 && (
          <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <Wallet className="w-3.5 h-3.5" />
              <span>Saldo {selectedAccount.name} setelah transaksi</span>
            </div>
            <p
              className={cn(
                'text-lg font-bold tabular-nums',
                previewBalance < 0
                  ? 'text-red-500'
                  : 'text-slate-900 dark:text-white'
              )}
            >
              {formatRupiah(previewBalance)}
            </p>
            {previewBalance < 0 && (
              <p className="text-xs text-red-500 mt-0.5">
                ⚠️ Saldo bakal minus
              </p>
            )}
          </div>
        )}

        {/* Advanced (collapsible) */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center justify-between w-full py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <span>Detail Lainnya</span>
              <ChevronDown
                className={cn(
                  'w-4 h-4 transition-transform',
                  advancedOpen && 'rotate-180'
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-3">
            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal & Waktu</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Merchant */}
            <FormField
              control={form.control}
              name="merchant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Merchant (opsional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Janji Jiwa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Note */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan (opsional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Catatan tambahan..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* PPN & PPh */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="ppn_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PPN</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === '' ? 0 : Number(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pph_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PPh</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === '' ? 0 : Number(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cleared">Cleared</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Exclude toggles */}
            <div className="space-y-3 pt-2">
              <FormField
                control={form.control}
                name="exclude_from_budget"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] p-3 space-y-0">
                    <div className="space-y-0.5 flex-1">
                      <FormLabel className="text-sm text-slate-900 dark:text-white">
                        Exclude dari Budget
                      </FormLabel>
                      <FormDescription className="text-xs text-slate-500 dark:text-slate-400">
                        Gak ngitung di budget bulanan
                      </FormDescription>
                    </div>
                    <FormControl className="w-auto m-0">
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="exclude_from_daily_budget"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] p-3 space-y-0">
                  <div className="space-y-0.5 flex-1">
                    <FormLabel className="text-sm text-slate-900 dark:text-white">
                      Exclude dari Daily Budget
                    </FormLabel>
                    <FormDescription className="text-xs text-slate-500 dark:text-slate-400">
                      Cocok buat pengeluaran non-harian (konser, dll)
                    </FormDescription>
                  </div>
                  <FormControl className="w-auto m-0">
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="exclude_from_reports"
                render={({ field }) => (
                 <FormItem className="flex flex-row items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] p-3 space-y-0">
                  <div className="space-y-0.5 flex-1">
                    <FormLabel className="text-sm text-slate-900 dark:text-white">
                      Exclude dari Report
                    </FormLabel>
                    <FormDescription className="text-xs text-slate-500 dark:text-slate-400">
                      Gak muncul di Laporan
                    </FormDescription>
                  </div>
                  <FormControl className="w-auto m-0">
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
                )}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Actions */}
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