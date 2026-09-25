'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Loader2, TrendingUp, AlertTriangle } from 'lucide-react'
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
import { CurrencyInput } from '@/components/ui/currency-input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useInvestments } from '@/lib/hooks/use-investments'
import { buyMoreSchema, type BuyMoreInput } from '@/lib/validators/investment'
import { formatRupiah } from '@/lib/normalize'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'
import type { InvestmentPosition } from '@/lib/investments/types'

type Account = Database['public']['Tables']['accounts']['Row']

type BuyMoreModalProps = {
    position: InvestmentPosition
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

function getQuantityLabel(type: string): string {
    if (type === 'stock') return 'Lot'
    if (type === 'gold') return 'Gram'
    return 'Jumlah'
}

function getPriceLabel(type: string): string {
    if (type === 'stock') return 'Harga / Lembar'
    if (type === 'gold') return 'Harga / Gram'
    return 'Harga / Unit'
}

export function BuyMoreModal({
    position,
    accounts,
    onSuccess,
    onCancel,
}: BuyMoreModalProps) {
    const { buyMore } = useInvestments()
    const [submitting, setSubmitting] = useState(false)

    const investmentAccounts = accounts.filter(
        (a) => a.type === 'investment' && !a.is_archived
    )

    const form = useForm<BuyMoreInput>({
        resolver: zodResolver(buyMoreSchema) as any,
        defaultValues: {
            asset_id: position.asset.id,
            quantity: 0,
            price: position.latest_price || 0,
            fee: 0,
            date: toDateTimeInputValue(new Date()),
            account_id: investmentAccounts[0]?.id || '',
            note: '',
        },
    })

    const { watch } = form
    const quantity = Number(watch('quantity')) || 0
    const price = Number(watch('price')) || 0
    const fee = Number(watch('fee')) || 0
    const accountId = watch('account_id')
    const multiplier = position.asset.type === 'stock' ? 100 : 1
    const gross = quantity * price * multiplier
    const total = gross + fee

    const newTotal = position.lot_held + quantity
    const newAvg =
        newTotal > 0
            ? (position.lot_held * position.avg_price + quantity * price) / newTotal
            : 0

    // ============ Balance check ============
    const selectedAccount = investmentAccounts.find((a) => a.id === accountId)
    const availableBalance = selectedAccount
        ? Number(selectedAccount.current_balance)
        : 0
    const insufficientBalance = total > 0 && total > availableBalance

    async function onSubmit(data: BuyMoreInput) {
        setSubmitting(true)
        const result = await buyMore(data)
        setSubmitting(false)
        if (result.success) {
            form.reset()
            onSuccess?.()
        }
    }

    const ticker = position.detail?.ticker || position.asset.name

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Holding info */}
                <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-brand" />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Kepemilikan Saat Ini
                        </span>
                    </div>
                    <p className="text-base font-bold">
                        {ticker} · {position.lot_held}{' '}
                        {getQuantityLabel(position.asset.type).toLowerCase()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                        Avg {formatRupiah(position.avg_price)}
                    </p>
                </div>

                {/* Quantity + Price */}
                <div className="grid grid-cols-2 gap-3">
                    <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Tambah {getQuantityLabel(position.asset.type)}
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        inputMode="decimal"
                                        placeholder="0"
                                        value={field.value || ''}
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
                        name="price"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{getPriceLabel(position.asset.type)}</FormLabel>
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

                {/* Fee */}
                <FormField
                    control={form.control}
                    name="fee"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Biaya Beli (opsional)</FormLabel>
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

                {/* Preview */}
                {gross > 0 && (
                    <div
                        className={cn(
                            'rounded-xl p-4 space-y-2 border',
                            insufficientBalance
                                ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
                                : 'bg-brand/5 border-brand/20'
                        )}
                    >
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Total Beli</span>
                            <span className="font-medium tabular-nums">
                                {formatRupiah(gross)}
                            </span>
                        </div>
                        {fee > 0 && (
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Biaya</span>
                                <span className="font-medium tabular-nums">
                                    +{formatRupiah(fee)}
                                </span>
                            </div>
                        )}
                        <div
                            className={cn(
                                'flex justify-between pt-2 border-t',
                                insufficientBalance
                                    ? 'border-red-200 dark:border-red-500/30'
                                    : 'border-brand/20'
                            )}
                        >
                            <span
                                className={cn(
                                    'text-xs font-semibold',
                                    insufficientBalance ? 'text-red-700 dark:text-red-300' : 'text-brand'
                                )}
                            >
                                Total Bayar
                            </span>
                            <span
                                className={cn(
                                    'text-base font-bold tabular-nums',
                                    insufficientBalance
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-brand'
                                )}
                            >
                                {formatRupiah(total)}
                            </span>
                        </div>
                        {newAvg > 0 && (
                            <div
                                className={cn(
                                    'flex justify-between pt-2 border-t',
                                    insufficientBalance
                                        ? 'border-red-200/60 dark:border-red-500/20'
                                        : 'border-brand/10'
                                )}
                            >
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                    Avg Baru
                                </span>
                                <span className="text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                                    {formatRupiah(newAvg)}
                                </span>
                            </div>
                        )}

                        {insufficientBalance && selectedAccount && (
                            <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-500/30 flex items-start gap-2">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                <div className="text-xs text-red-700 dark:text-red-300">
                                    <p className="font-semibold mb-0.5">Saldo tidak cukup</p>
                                    <p>
                                        Saldo <strong>{selectedAccount.name}</strong>:{' '}
                                        {formatRupiah(availableBalance)} · Kurang{' '}
                                        <strong>{formatRupiah(total - availableBalance)}</strong>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

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

                {/* Account */}
                <FormField
                    control={form.control}
                    name="account_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Akun Sumber</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue />
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
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Actions */}
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
                        disabled={submitting || quantity <= 0 || insufficientBalance}
                        className="flex-1"
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {insufficientBalance ? 'Saldo Tidak Cukup' : 'Beli'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}