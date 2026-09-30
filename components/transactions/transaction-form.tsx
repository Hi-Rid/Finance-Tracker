'use client'

import { useState, useMemo, useEffect } from 'react'
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
import { Amount } from '@/components/ui/amount'
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
import {
  ChevronDown,
  Loader2,
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Utensils,
  Tag,
  Calendar,
  Store,
  FileText,
  Settings2,
  Check,
} from 'lucide-react'
import { useTransactions } from '@/lib/hooks/use-transactions'
import {
  transactionSchema,
  type TransactionInput,
} from '@/lib/validators/transaction'
import { cn } from '@/lib/utils'
import { CurrencyInput } from '@/components/ui/currency-input'
import { ReceiptScanner } from '@/components/receipts/receipt-scanner'
import type { ParsedReceipt } from '@/lib/ocr/types'
import type { Database } from '@/types/database'

type Account = Database['public']['Tables']['accounts']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Transaction = Database['public']['Tables']['transactions']['Row']
type DailyItem = Database['public']['Tables']['daily_budget_items']['Row']

type TransactionFormProps = {
  profileId: string
  accounts: Account[]
  categories: Category[]
  dailyItems: DailyItem[]
  transaction?: Transaction | null
  onSuccess?: () => void
  onCancel?: () => void
}

function toLocalDateTimeInputValue(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d}T${h}:${min}`
}

const TYPE_OPTIONS = [
  {
    value: 'expense',
    label: 'Keluar',
    icon: TrendingDown,
    color: '#ef4444',
  },
  {
    value: 'income',
    label: 'Masuk',
    icon: TrendingUp,
    color: '#10b981',
  },
  {
    value: 'transfer',
    label: 'Transfer',
    icon: ArrowLeftRight,
    color: '#334DAF',
  },
] as const

export function TransactionForm({
  profileId,
  accounts,
  categories,
  dailyItems,
  transaction,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const { createTransaction, updateTransaction } = useTransactions()
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [scannedReceipt, setScannedReceipt] = useState<ParsedReceipt | null>(null)
  const [scannedReceiptId, setScannedReceiptId] = useState<string | null>(null)
  const isEdit = !!transaction

  const availableAccounts = useMemo(
    () => accounts.filter((a) => a.type !== 'envelope'),
    [accounts]
  )

  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: {
      name: transaction?.name || '',
      date: transaction?.date
        ? toLocalDateTimeInputValue(new Date(transaction.date))
        : toLocalDateTimeInputValue(new Date()),
      type: (transaction?.type as TransactionInput['type']) || 'expense',
      account_id: transaction?.account_id || availableAccounts[0]?.id || '',
      to_account_id: transaction?.to_account_id || null,
      category_id: transaction?.category_id || null,
      daily_item_id: transaction?.daily_item_id || null,
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
    setValue,
    formState: { isSubmitting },
  } = form

  const watchedType = watch('type')
  const watchedAccountId = watch('account_id')
  const watchedAmount = watch('amount')
  const watchedCategoryId = watch('category_id')
  const watchedDailyItemId = watch('daily_item_id')

  const filteredCategories = useMemo(() => {
    if (watchedType === 'transfer') return []
    const catType = watchedType === 'income' ? 'income' : 'expense'
    return categories.filter((c) => c.type === catType && !c.is_archived)
  }, [categories, watchedType])

  const filteredDailyItems = useMemo(() => {
    if (!watchedCategoryId) return []
    return dailyItems.filter(
      (i) => i.category_id === watchedCategoryId && i.is_active
    )
  }, [dailyItems, watchedCategoryId])

  useEffect(() => {
    if (
      watchedDailyItemId &&
      !filteredDailyItems.some((i) => i.id === watchedDailyItemId)
    ) {
      setValue('daily_item_id', null)
    }
  }, [watchedCategoryId, filteredDailyItems, watchedDailyItemId, setValue])

  const selectedAccount = availableAccounts.find((a) => a.id === watchedAccountId)
  const previewBalance = useMemo(() => {
    if (!selectedAccount) return 0
    const current = Number(selectedAccount.current_balance)
    const amount = Number(watchedAmount) || 0
    if (watchedType === 'expense') return current - amount
    if (watchedType === 'income' || watchedType === 'refund')
      return current + amount
    if (watchedType === 'transfer') return current - amount
    return current
  }, [selectedAccount, watchedAmount, watchedType])

  function handleScanned(
    parsed: ParsedReceipt,
    receiptId: string | null,
    suggestedCategoryId: string | null
  ) {
    setScannedReceipt(parsed)
    setScannedReceiptId(receiptId)

    if (parsed.merchant) {
      form.setValue('name', parsed.merchant, { shouldValidate: true })
      form.setValue('merchant', parsed.merchant)
    }
    if (parsed.totalAmount > 0) {
      form.setValue('amount', parsed.totalAmount, { shouldValidate: true })
    }
    if (parsed.taxAmount > 0) {
      form.setValue('ppn_amount', parsed.taxAmount)
    }
    if (parsed.datetime) {
      form.setValue('date', parsed.datetime.slice(0, 16))
    } else if (parsed.date) {
      const time = parsed.time || toLocalDateTimeInputValue(new Date()).slice(11)
      form.setValue('date', `${parsed.date}T${time}`)
    }
    if (suggestedCategoryId) {
      form.setValue('category_id', suggestedCategoryId)
    }
  }

  async function onSubmit(data: TransactionInput) {
    if (isEdit && transaction) {
      const result = await updateTransaction(transaction.id, data, profileId)
      if (result.success) {
        onSuccess?.()
        form.reset()
      }
    } else {
      const result = await createTransaction(data, profileId, scannedReceiptId)
      if (result.success) {
        onSuccess?.()
        form.reset()
        setScannedReceipt(null)
        setScannedReceiptId(null)
      }
    }
  }

  const activeTypeMeta =
    TYPE_OPTIONS.find((t) => t.value === watchedType) || TYPE_OPTIONS[0]

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* TYPE SELECTOR */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex p-1 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-white/5 gap-1">
                  {TYPE_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    const isActive = field.value === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => field.onChange(opt.value)}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md sm:rounded-lg text-xs font-semibold transition-all cursor-pointer',
                          isActive
                            ? 'bg-white dark:bg-white/10 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        )}
                        style={isActive ? { color: opt.color } : undefined}
                      >
                        <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
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

        {/* AMOUNT HERO */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <div
                className={cn(
                  'relative rounded-xl sm:rounded-2xl border-2 px-4 py-3 sm:py-4 transition-all',
                  'bg-gradient-to-br from-slate-50 to-white dark:from-white/[0.03] dark:to-white/[0.01]',
                  'border-slate-200 dark:border-white/10',
                  'focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20'
                )}
              >
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                  Jumlah
                </p>
                <FormControl>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={cn(
                        'text-sm font-bold shrink-0',
                        watchedType === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : watchedType === 'transfer'
                            ? 'text-brand'
                            : 'text-red-600 dark:text-red-400'
                      )}
                    >
                      Rp
                    </span>
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="0"
                      className={cn(
                        'border-0 bg-transparent p-0 h-auto text-2xl sm:text-3xl font-bold shadow-none',
                        'focus-visible:ring-0 focus-visible:border-0',
                        'placeholder:text-slate-300 dark:placeholder:text-white/20'
                      )}
                      autoFocus={!isEdit}
                    />
                  </div>
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* RECEIPT SCAN */}
        {!isEdit && watchedType !== 'transfer' && (
          <ReceiptScanner onScanned={handleScanned} />
        )}

        {/* NAMA */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi</FormLabel>
              <FormControl>
                <Input
                  placeholder="Contoh: Kopi janji jiwa"
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* AKUN */}
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
                  <SelectTrigger className="h-11">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${activeTypeMeta.color}15` }}
                      >
                        <Wallet
                          className="w-3.5 h-3.5"
                          style={{ color: activeTypeMeta.color }}
                        />
                      </div>
                      <SelectValue placeholder="Pilih akun" />
                    </div>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <div className="flex items-center justify-between gap-3 w-full">
                        <span className="font-medium">{a.name}</span>
                        <Amount
                          value={Number(a.current_balance)}
                          className="text-xs text-slate-500"
                        />
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Balance preview */}
        {selectedAccount && watchedAmount > 0 && (
          <div
            className={cn(
              'rounded-lg px-3 py-2 flex items-center justify-between gap-2 text-xs',
              previewBalance < 0
                ? 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30'
                : 'bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10'
            )}
          >
            <span className="text-muted-foreground truncate">
              Saldo {selectedAccount.name} setelah:
            </span>
            <Amount
              value={previewBalance}
              className={cn(
                'font-bold tabular-nums shrink-0',
                previewBalance < 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-slate-900 dark:text-white'
              )}
            />
          </div>
        )}

        {/* TO ACCOUNT */}
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
                    <SelectTrigger className="h-11">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-7 h-7 rounded-md bg-brand/10 flex items-center justify-center shrink-0">
                          <ArrowLeftRight className="w-3.5 h-3.5 text-brand" />
                        </div>
                        <SelectValue placeholder="Pilih akun tujuan" />
                      </div>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableAccounts
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

        {/* KATEGORI */}
        {watchedType !== 'transfer' && (
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategori</FormLabel>
                <Select
                  onValueChange={(v) =>
                    field.onChange(v === '__none__' ? null : v)
                  }
                  value={field.value || '__none__'}
                >
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-7 h-7 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
                          <Tag className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <SelectValue placeholder="Pilih kategori" />
                      </div>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">Tanpa kategori</SelectItem>
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

        {/* DAILY ITEM */}
        {watchedType !== 'transfer' &&
          watchedType !== 'income' &&
          filteredDailyItems.length > 0 && (
            <FormField
              control={form.control}
              name="daily_item_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily Item</FormLabel>
                  <Select
                    onValueChange={(v) =>
                      field.onChange(v === '__none__' ? null : v)
                    }
                    value={field.value || '__none__'}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-7 h-7 rounded-md bg-sky-500/10 flex items-center justify-center shrink-0">
                            <Utensils className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                          </div>
                          <SelectValue placeholder="Pilih daily item" />
                        </div>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">
                        <span className="text-slate-500">Unassigned</span>
                      </SelectItem>
                      {filteredDailyItems.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          <div className="flex items-center justify-between gap-3 w-full">
                            <span>{d.name}</span>
                            <Amount
                              value={Number(d.amount)}
                              className="text-xs text-slate-500"
                            />
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

        {/* DETAIL LAINNYA */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className={cn(
                'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg transition-colors cursor-pointer',
                'bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10',
                'hover:bg-slate-100 dark:hover:bg-white/5',
                advancedOpen && 'rounded-b-none border-b-0'
              )}
            >
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Detail Lainnya
                </span>
              </div>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-slate-400 transition-transform',
                  advancedOpen && 'rotate-180'
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="border border-t-0 border-slate-200 dark:border-white/10 rounded-b-lg px-3 py-4 space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    Tanggal & Waktu
                  </FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="merchant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-muted-foreground" />
                    Merchant
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Janji Jiwa" {...field} />
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
                  <FormLabel className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    Catatan
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Catatan tambahan..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="ppn_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PPN</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="0"
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
                      <CurrencyInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

            {/* EXCLUDE (section header tetap uppercase) */}
            <div className="space-y-2 pt-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Exclude dari
              </p>

              <FormField
                control={form.control}
                name="exclude_from_budget"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ExcludeCheckbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        title="Budget Bulanan"
                        description="Gak ngitung di budget bulanan"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="exclude_from_daily_budget"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ExcludeCheckbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        title="Daily Budget"
                        description="Non-harian, gak masuk daily breakdown"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="exclude_from_reports"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ExcludeCheckbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        title="Reports & Statistik"
                        description="Gak muncul di laporan"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ACTIONS */}
        <div className="flex gap-2 pt-2">
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
            {isEdit ? 'Simpan' : 'Simpan Transaksi'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

// ============================================================
// EXCLUDE CHECKBOX
// ============================================================

function ExcludeCheckbox({
  checked,
  onCheckedChange,
  title,
  description,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  title: string
  description: string
}) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all text-left cursor-pointer',
        checked
          ? 'bg-brand/5 border-brand/40 shadow-sm'
          : 'bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/10 hover:border-brand/30'
      )}
    >
      <div
        className={cn(
          'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all',
          checked
            ? 'bg-brand border-brand'
            : 'border-slate-300 dark:border-white/20'
        )}
      >
        {checked && (
          <Check className="w-3 h-3 text-white" strokeWidth={3.5} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-xs font-semibold leading-tight',
            checked && 'text-brand'
          )}
        >
          {title}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
          {description}
        </p>
      </div>
    </button>
  )
}