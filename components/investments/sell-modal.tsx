'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Loader2, AlertTriangle, TrendingDown } from 'lucide-react'
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
import { sellSchema, type SellInput } from '@/lib/validators/investment'
import { formatRupiah } from '@/lib/normalize'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'
import type { InvestmentPosition } from '@/lib/investments/types'

type Account = Database['public']['Tables']['accounts']['Row']

type SellModalProps = {
    position: InvestmentPosition
    accounts: Account[]
    onSuccess?: () => void
    onCancel?: () => void
}

function toDateTimeInputValue(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
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

export function SellModal({
    position,
    accounts,
    onSuccess,
    onCancel,
}: SellModalProps) {
    const { sell } = useInvestments()
    const [submitting, setSubmitting] = useState(false)

    const investmentAccounts = accounts.filter(
        (a) => a.type === 'investment' && !a.is_archived
    )

    const form = useForm<SellInput>({
        resolver: zodResolver(sellSchema) as any,
        defaultValues: {
            asset_id: position.asset.id,
            quantity: 0,
            price: position.latest_price || position.avg_price || 0,
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
    const multiplier = position.asset.type === 'stock' ? 100 : 1
    const gross = quantity * price * multiplier
    const net = gross - fee
    const isOverSell = quantity > position.lot_held
    const willArchive = quantity > 0 && quantity === position.lot_held

    const estimatedPl =
        quantity > 0 ? (price - position.avg_price) * quantity * multiplier : 0
    const isProfit = estimatedPl > 0

    async function onSubmit(data: SellInput) {
        setSubmitting(true)
        const result = await sell(data)
        setSubmitting(false)
        if (result.success) {
            form.reset()
            onSuccess?.()
        }
    }

    const ticker = position.detail?.ticker || position.asset.name
    const qtyLabel = getQuantityLabel(position.asset.type)

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Holding info */}
                <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Kepemilikan
                        </span>
                    </div>
                    <p className="text-base font-bold">
                        {ticker} · {position.lot_held} {qtyLabel.toLowerCase()}
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
                                    {qtyLabel} Dijual
                                    <span className="text-muted-foreground font-normal ml-1">
                                        (max {position.lot_held})
                                    </span>
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        inputMode="decimal"
                                        placeholder="0"
                                        value={field.value || ''}
                                        onChange={(e) =>
                                            field.onChange(e.target.value === '' ? 0 : Number(e.target.value))
                                        }
                                    />
                                </FormControl>
                                {isOverSell && (
                                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        Melebihi kepemilikan
                                    </p>
                                )}
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
                            <FormLabel>Biaya Jual (opsional)</FormLabel>
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
                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-4 space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-emerald-700 dark:text-emerald-300">Bruto</span>
                            <span className="font-medium tabular-nums text-emerald-900 dark:text-emerald-100">
                                {formatRupiah(gross)}
                            </span>
                        </div>
                        {fee > 0 && (
                            <div className="flex justify-between text-xs">
                                <span className="text-emerald-700 dark:text-emerald-300">Biaya</span>
                                <span className="font-medium tabular-nums text-emerald-900 dark:text-emerald-100">
                                    −{formatRupiah(fee)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-emerald-200 dark:border-emerald-500/30">
                            <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-100">
                                Diterima Bersih
                            </span>
                            <span className="text-base font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                                {formatRupiah(net)}
                            </span>
                        </div>
                        {quantity > 0 && (
                            <div className="flex justify-between pt-2 border-t border-emerald-200/60 dark:border-emerald-500/20">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                    Estimasi P/L
                                </span>
                                <span
                                    className={cn(
                                        'text-xs font-semibold tabular-nums',
                                        isProfit
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-red-600 dark:text-red-400'
                                    )}
                                >
                                    {isProfit ? '+' : '−'}
                                    {formatRupiah(Math.abs(estimatedPl))}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Warning: sell all */}
                {willArchive && !isOverSell && (
                    <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-3 flex gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                            Jual semua akan mengarsipkan posisi ini. History tetap tersimpan.
                        </p>
                    </div>
                )}

                {/* Date */}
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tanggal & Waktu Jual</FormLabel>
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
                            <FormLabel>Akun Tujuan</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {investmentAccounts.map((a) => (
                                        <SelectItem key={a.id} value={a.id}>
                                            {a.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription className="text-xs">
                                Saldo akun ini bertambah otomatis
                            </FormDescription>
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
                        disabled={submitting || isOverSell || quantity <= 0}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        Jual
                    </Button>
                </div>
            </form>
        </Form>
    )
}