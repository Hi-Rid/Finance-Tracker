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
import { Switch } from '@/components/ui/switch'
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
} from 'lucide-react'
import { useTransactions } from '@/lib/hooks/use-transactions'
import {
  transactionSchema,
  type TransactionInput,
} from '@/lib/validators/transaction'
import { formatRupiah } from '@/lib/normalize'
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
  { value: 'expense', label: 'Pengeluaran', icon: TrendingDown, color: 'text-red-500' },
  { value: 'income', label: 'Pemasukan', icon: TrendingUp, color: 'text-emerald-500' },
  { value: 'transfer', label: 'Transfer', icon: ArrowLeftRight, color: 'text-brand' },
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

  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: {
      name: transaction?.name || '',
      date: transaction?.date
        ? toLocalDateTimeInputValue(new Date(transaction.date))
        : toLocalDateTimeInputValue(new Date()),
      type: (transaction?.type as TransactionInput['type']) || 'expense',
      account_id: transaction?.account_id || accounts[0]?.id || '',
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

  // Filter categories by type
  const filteredCategories = useMemo(() => {
    if (watchedType === 'transfer') return []
    const catType = watchedType === 'income' ? 'income' : 'expense'
    return categories.filter((c) => c.type === catType && !c.is_archived)
  }, [categories, watchedType])

  // Filter daily items by kategori
  const filteredDailyItems = useMemo(() => {
    if (!watchedCategoryId) return []
    return dailyItems.filter(
      (i) => i.category_id === watchedCategoryId && i.is_active
    )
  }, [dailyItems, watchedCategoryId])

  // Kalau kategori ganti, reset daily item
  useEffect(() => {
    if (
      watchedDailyItemId &&
      !filteredDailyItems.some((i) => i.id === watchedDailyItemId)
    ) {
      setValue('daily_item_id', null)
    }
  }, [watchedCategoryId, filteredDailyItems, watchedDailyItemId, setValue])

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

  function handleScanned(
    parsed: ParsedReceipt,
    receiptId: string | null,
    suggestedCategoryId: string | null
  ) {
    setScannedReceipt(parsed)
    setScannedReceiptId(receiptId)

    if (parsed.merchant) {
      form.setValue('name', parsed.merchant, { shouldValidate: true })
    }
    if (parsed.totalAmount > 0) {
      form.setValue('amount', parsed.totalAmount, { shouldValidate: true })
    }
    if (parsed.taxAmount > 0) {
      form.setValue('ppn_amount', parsed.taxAmount)
    }
    if (parsed.merchant) {
      form.setValue('merchant', parsed.merchant)
    }

    // Set tanggal: prioritas datetime lengkap → date + jam sekarang → date aja
    if (parsed.datetime) {
      // parsed.datetime = "2026-09-22T12:08:00+07:00"
      // Ambil langsung string local WIB dari string-nya (slice sebelum "+07:00")
      form.setValue('date', parsed.datetime.slice(0, 16))
    } else if (parsed.date) {
      const time = parsed.time || toLocalDateTimeInputValue(new Date()).slice(11)
      form.setValue('date', `${parsed.date}T${time}`)
    }

    // Auto-set kategori kalau ketemu
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* ============ 1. TYPE SELECTOR ============ */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/5">
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
                            ? 'bg-white dark:bg-white/10 shadow-sm ' + opt.color
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

        {/* ============ 2. OCR SCAN ============ */}
        {!isEdit && watchedType !== 'transfer' && (
          <ReceiptScanner onScanned={handleScanned} />
        )}

        {/* ============ 3. NAMA TRANSAKSI ============ */}
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

        {/* ============ 4. NOMINAL ============ */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jumlah</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 pointer-events-none">
                    Rp
                  </span>
                  <CurrencyInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="0"
                    className="pl-10 text-lg font-semibold h-12"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ============ 5. AKUN ============ */}
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

        {/* ============ 6. TO AKUN (transfer only) ============ */}
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

        {/* ============ 7. KATEGORI ============ */}
        {watchedType !== 'transfer' && (
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategori</FormLabel>
                <Select
                  onValueChange={(v) => {
                    field.onChange(v === '__none__' ? null : v)
                  }}
                  value={field.value || '__none__'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
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

        {/* ============ 8. DAILY ITEM ============ */}
        {watchedType !== 'transfer' &&
          watchedType !== 'income' &&
          filteredDailyItems.length > 0 && (
            <FormField
              control={form.control}
              name="daily_item_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5" />
                    Daily Item (opsional)
                  </FormLabel>
                  <Select
                    onValueChange={(v) =>
                      field.onChange(v === '__none__' ? null : v)
                    }
                    value={field.value || '__none__'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih daily item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">
                        <span className="text-slate-500">
                          Unassigned (gak masuk breakdown)
                        </span>
                      </SelectItem>
                      {filteredDailyItems.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          <div className="flex items-center justify-between gap-3 w-full">
                            <span>{d.name}</span>
                            <span className="text-xs text-slate-500 tabular-nums">
                              {formatRupiah(Number(d.amount))}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    Pilih biar ke-track di daily budget breakdown
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

        {/* ============ 9. DETAIL LAINNYA (Advanced) ============ */}
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

            <div className="space-y-3 pt-2">
              <FormField
                control={form.control}
                name="exclude_from_budget"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] p-3 space-y-0">
                    <div className="space-y-0.5 flex-1">
                      <FormLabel className="text-sm">
                        Exclude dari Budget
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Gak ngitung di budget bulanan
                      </FormDescription>
                    </div>
                    <FormControl className="w-auto m-0">
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
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
                      <FormLabel className="text-sm">
                        Exclude dari Daily Budget
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Cocok buat pengeluaran non-harian
                      </FormDescription>
                    </div>
                    <FormControl className="w-auto m-0">
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
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
                      <FormLabel className="text-sm">
                        Exclude dari Reports
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Gak muncul di laporan
                      </FormDescription>
                    </div>
                    <FormControl className="w-auto m-0">
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ============ ACTIONS ============ */}
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