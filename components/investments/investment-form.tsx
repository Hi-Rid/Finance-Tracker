'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useMemo } from 'react'
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
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
import { CurrencyInput } from '@/components/ui/currency-input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { TickerSearch } from './ticker-search'
import { useInvestments } from '@/lib/hooks/use-investments'
import {
    createInvestmentSchema,
    type CreateInvestmentInput,
} from '@/lib/validators/investment'
import { formatRupiah } from '@/lib/normalize'
import { getBrokersFor } from '@/lib/investments/brokers'
import { EXCHANGES } from '@/lib/investments/exchanges'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'
import type { SearchSuggestion } from '@/lib/investments/types'

type Account = Database['public']['Tables']['accounts']['Row']

type InvestmentFormProps = {
    profileId: string
    accounts: Account[]
    onSuccess?: () => void
    onCancel?: () => void
}

function toDateTimeInputValue(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const h = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${d}T${h}:${min}`
}

const ASSET_TYPES = [
    { value: 'stock', label: 'Saham' },
    { value: 'crypto', label: 'Crypto' },
    { value: 'mutual_fund', label: 'Reksadana' },
    { value: 'gold', label: 'Emas' },
] as const

function getQuantityLabel(type: string): string {
    if (type === 'stock') return 'Lot'
    if (type === 'gold') return 'Gram'
    return 'Jumlah'
}

function getQuantityMultiplier(type: string): number {
    return type === 'stock' ? 100 : 1
}

export function InvestmentForm({
    profileId,
    accounts,
    onSuccess,
    onCancel,
}: InvestmentFormProps) {
    const { createInvestment } = useInvestments()
    const [submitting, setSubmitting] = useState(false)
    const [selectedTicker, setSelectedTicker] = useState<SearchSuggestion | null>(null)

    const form = useForm<CreateInvestmentInput>({
        resolver: zodResolver(createInvestmentSchema) as any,
        defaultValues: {
            asset_type: 'stock',
            name: '',
            ticker: '',
            exchange: '',
            quantity: 0,
            avg_price: 0,
            purchase_date: toDateTimeInputValue(new Date()),
            account_id: '',
            broker: '',
            note: '',
        },
        mode: 'onTouched',
        reValidateMode: 'onChange',
    })

    const { watch, setValue, formState } = form
    const assetType = watch('asset_type') as 'stock' | 'crypto' | 'mutual_fund' | 'gold'
    const quantity = Number(watch('quantity')) || 0
    const avgPrice = Number(watch('avg_price')) || 0
    const accountId = watch('account_id')
    const tickerValue = watch('ticker')

    const multiplier = getQuantityMultiplier(assetType)
    const estimatedTotal = quantity * avgPrice * multiplier

    const investmentAccounts = accounts.filter(
        (a) => a.type === 'investment' && !a.is_archived
    )

    // ============ Balance check ============
    const selectedAccount = investmentAccounts.find((a) => a.id === accountId)
    const availableBalance = selectedAccount ? Number(selectedAccount.current_balance) : 0
    const insufficientBalance =
        estimatedTotal > 0 && estimatedTotal > availableBalance

    const brokers = useMemo(() => getBrokersFor(assetType), [assetType])
    const isStock = assetType === 'stock'
    const isGold = assetType === 'gold'

    function handleAssetTypeChange(newType: typeof assetType) {
        setValue('asset_type', newType)
        setValue('ticker', '')
        setValue('name', '')
        setValue('exchange', '')
        setValue('broker', '')
        setSelectedTicker(null)
        form.clearErrors(['ticker', 'name', 'exchange'])
    }

    function handleTickerSelect(suggestion: SearchSuggestion | null) {
        setSelectedTicker(suggestion)

        if (suggestion) {
            setValue('ticker', suggestion.ticker, {
                shouldValidate: true,
                shouldDirty: true,
            })
            setValue('name', suggestion.name, {
                shouldValidate: true,
                shouldDirty: true,
            })
            setValue('exchange', suggestion.exchange || '', { shouldDirty: true })
        } else {
            setValue('ticker', '', { shouldValidate: true })
            setValue('name', '', { shouldValidate: true })
            setValue('exchange', '')
        }
    }

    async function onSubmit(data: CreateInvestmentInput) {
        setSubmitting(true)
        try {
            const result = await createInvestment(data, profileId)
            setSubmitting(false)
            if (result.success) {
                form.reset()
                setSelectedTicker(null)
                onSuccess?.()
            }
        } catch (err) {
            console.error('[create investment] threw:', err)
            setSubmitting(false)
        }
    }

    function onError(errors: any) {
        console.error('[create investment] validation failed:', errors)
    }

    if (investmentAccounts.length === 0) {
        return (
            <div className="space-y-4">
                <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-4 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                            Belum ada akun investasi
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                            Bikin akun dengan tipe <strong>Investment</strong> dulu di halaman Akun. Contoh: RDN Stockbit, Bibit, Binance.
                        </p>
                    </div>
                </div>
                {onCancel && (
                    <Button variant="outline" onClick={onCancel} className="w-full">
                        Tutup
                    </Button>
                )}
            </div>
        )
    }

    const tickerRequired = !isGold
    const tickerFilled = !tickerRequired || (tickerValue && tickerValue.length > 0)

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit, onError)}
                className="space-y-6"
            >
                {/* ============ Jenis ============ */}
                <FormField
                    control={form.control}
                    name="asset_type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Jenis Investasi</FormLabel>
                            <FormControl>
                                <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5">
                                    {ASSET_TYPES.map((t) => (
                                        <button
                                            key={t.value}
                                            type="button"
                                            onClick={() => handleAssetTypeChange(t.value)}
                                            className={cn(
                                                'py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                                                field.value === t.value
                                                    ? 'bg-white dark:bg-white/10 shadow-sm text-brand'
                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                            )}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* ============ Identitas ============ */}
                <div className="space-y-4">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {isGold ? 'Detail Emas' : 'Cari Aset'}
                    </p>

                    {isGold ? (
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Emas</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Emas Antam 10gr, Emas UBS 5gr..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        Deskripsi singkat emas yang lu beli
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ) : (
                        <>
                            <FormItem>
                                <FormLabel>
                                    {assetType === 'stock'
                                        ? 'Cari Saham'
                                        : assetType === 'crypto'
                                            ? 'Cari Crypto'
                                            : 'Cari Reksadana'}
                                </FormLabel>
                                <TickerSearch
                                    assetType={assetType}
                                    value={selectedTicker}
                                    onChange={handleTickerSelect}
                                />
                                {tickerRequired && !tickerFilled && formState.isSubmitted && (
                                    <p className="text-xs text-red-500 mt-1">
                                        Pilih aset dari hasil pencarian
                                    </p>
                                )}
                            </FormItem>

                            {selectedTicker && (
                                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-3 flex gap-2 items-start">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                    <div className="text-xs">
                                        <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                                            {selectedTicker.ticker}
                                        </p>
                                        <p className="text-emerald-700 dark:text-emerald-300">
                                            {selectedTicker.name}
                                            {selectedTicker.exchange && ` · ${selectedTicker.exchange}`}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ============ Transaksi ============ */}
                <div className="space-y-4">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Pembelian Pertama
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{getQuantityLabel(assetType)}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            inputMode="decimal"
                                            placeholder="0"
                                            value={field.value || ''}
                                            onChange={(e) => {
                                                const v = e.target.value
                                                field.onChange(v === '' ? 0 : Number(v))
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="avg_price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Harga /{' '}
                                        {assetType === 'stock'
                                            ? 'Lembar'
                                            : assetType === 'gold'
                                                ? 'Gram'
                                                : 'Unit'}
                                    </FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 pointer-events-none z-10">
                                                Rp
                                            </span>
                                            <CurrencyInput
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="0"
                                                className="pl-9"
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="purchase_date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tanggal & Waktu Beli</FormLabel>
                                <FormControl>
                                    <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {estimatedTotal > 0 && (
                        <div
                            className={cn(
                                'rounded-xl p-4 border',
                                insufficientBalance
                                    ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
                                    : 'bg-gradient-to-br from-brand/10 to-brand/5 border-brand/20'
                            )}
                        >
                            <p
                                className={cn(
                                    'text-[10px] font-semibold uppercase tracking-wider mb-1.5',
                                    insufficientBalance
                                        ? 'text-red-700 dark:text-red-300'
                                        : 'text-brand'
                                )}
                            >
                                Total Pembelian
                            </p>
                            <p
                                className={cn(
                                    'text-2xl font-bold tabular-nums',
                                    insufficientBalance
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-brand'
                                )}
                            >
                                {formatRupiah(estimatedTotal)}
                            </p>
                            {assetType === 'stock' && (
                                <p
                                    className={cn(
                                        'text-[10px] mt-1',
                                        insufficientBalance
                                            ? 'text-red-600/80 dark:text-red-400/80'
                                            : 'text-slate-600 dark:text-slate-400'
                                    )}
                                >
                                    {quantity} lot × {formatRupiah(avgPrice)} × 100 lembar
                                </p>
                            )}
                            {assetType === 'gold' && (
                                <p
                                    className={cn(
                                        'text-[10px] mt-1',
                                        insufficientBalance
                                            ? 'text-red-600/80 dark:text-red-400/80'
                                            : 'text-slate-600 dark:text-slate-400'
                                    )}
                                >
                                    {quantity} gram × {formatRupiah(avgPrice)}
                                </p>
                            )}

                            {insufficientBalance && selectedAccount && (
                                <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-500/30 flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                    <div className="text-xs text-red-700 dark:text-red-300">
                                        <p className="font-semibold mb-0.5">Saldo tidak cukup</p>
                                        <p>
                                            Saldo <strong>{selectedAccount.name}</strong>:{' '}
                                            {formatRupiah(availableBalance)} · Kurang{' '}
                                            <strong>
                                                {formatRupiah(estimatedTotal - availableBalance)}
                                            </strong>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ============ Sumber Dana ============ */}
                <div className="space-y-4">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Sumber Dana
                    </p>

                    <FormField
                        control={form.control}
                        name="account_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Akun</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih akun investasi" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {investmentAccounts.map((a) => (
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
                                <FormDescription className="text-xs">
                                    Saldo akun ini berkurang otomatis
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* ============ Detail Opsional ============ */}
                <div className="space-y-4">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Detail (Opsional)
                    </p>

                    <FormField
                        control={form.control}
                        name="broker"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {isStock
                                        ? 'Broker'
                                        : assetType === 'crypto'
                                            ? 'Exchange'
                                            : assetType === 'mutual_fund'
                                                ? 'Platform'
                                                : 'Sumber Emas'}
                                </FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value || undefined}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {brokers.map((b) => (
                                            <SelectItem key={b.value} value={b.value}>
                                                {b.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {isStock && (
                        <FormField
                            control={form.control}
                            name="exchange"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bursa</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value || undefined}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih bursa" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {EXCHANGES.map((e) => (
                                                <SelectItem key={e.value} value={e.value}>
                                                    {e.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <FormField
                        control={form.control}
                        name="note"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Catatan</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="..." rows={2} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* ============ Actions ============ */}
                <div className="flex gap-3 pt-2">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            className="flex-1"
                            disabled={submitting}
                        >
                            Batal
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={submitting || !accountId || insufficientBalance}
                        className="flex-1"
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {insufficientBalance ? 'Saldo Tidak Cukup' : 'Tambah Investasi'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}