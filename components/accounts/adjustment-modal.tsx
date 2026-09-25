'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Loader2, Calculator, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
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
import { useAccounts } from '@/lib/hooks/use-accounts'
import {
    adjustmentSchema,
    type AdjustmentInput,
} from '@/lib/validators/account'
import { formatRupiah } from '@/lib/normalize'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Account = Database['public']['Tables']['accounts']['Row']

type AdjustmentModalProps = {
    account: Account
    profileId: string
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

export function AdjustmentModal({
    account,
    profileId,
    onSuccess,
    onCancel,
}: AdjustmentModalProps) {
    const { adjustBalance } = useAccounts()
    const [submitting, setSubmitting] = useState(false)

    const currentBalance = Number(account.current_balance)

    const form = useForm<AdjustmentInput>({
        resolver: zodResolver(adjustmentSchema) as any,
        defaultValues: {
            account_id: account.id,
            current_balance: currentBalance,
            actual_balance: currentBalance,
            date: toDateTimeInputValue(new Date()),
            note: '',
        },
    })

    const actualBalance = Number(form.watch('actual_balance')) || 0
    const delta = actualBalance - currentBalance
    const isPositive = delta > 0
    const hasChange = Math.abs(delta) >= 0.01

    async function onSubmit(data: AdjustmentInput) {
        setSubmitting(true)
        const result = await adjustBalance(data, profileId)
        setSubmitting(false)
        if (result.success) {
            form.reset()
            onSuccess?.()
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Warning */}
                <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-3 flex gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                        Koreksi saldo akan tercatat sebagai transaksi penyesuaian. Gunakan
                        kalau saldo di app <strong>beneran beda</strong> dengan realita.
                    </p>
                </div>

                {/* Account */}
                <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Calculator className="w-4 h-4 text-slate-500" />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Koreksi Saldo
                        </span>
                    </div>
                    <p className="text-base font-bold">{account.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                        Saldo tercatat: {formatRupiah(currentBalance)}
                    </p>
                </div>

                {/* Actual balance */}
                <FormField
                    control={form.control}
                    name="actual_balance"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Saldo Aktual (yang benar)</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 pointer-events-none z-10">
                                        Rp
                                    </span>
                                    <CurrencyInput
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="0"
                                        className="pl-9 text-lg font-semibold h-12"
                                    />
                                </div>
                            </FormControl>
                            <FormDescription className="text-xs">
                                Isi sesuai saldo real di bank/app
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Delta preview */}
                {hasChange && (
                    <div
                        className={cn(
                            'rounded-xl p-4 border space-y-2',
                            isPositive
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                                : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
                        )}
                    >
                        <div className="flex items-center gap-2">
                            {isPositive ? (
                                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                            )}
                            <span
                                className={cn(
                                    'text-[10px] font-semibold uppercase tracking-wider',
                                    isPositive
                                        ? 'text-emerald-700 dark:text-emerald-300'
                                        : 'text-red-700 dark:text-red-300'
                                )}
                            >
                                Penyesuaian
                            </span>
                        </div>
                        <p
                            className={cn(
                                'text-2xl font-bold tabular-nums',
                                isPositive
                                    ? 'text-emerald-700 dark:text-emerald-300'
                                    : 'text-red-600 dark:text-red-400'
                            )}
                        >
                            {isPositive ? '+' : '−'}
                            {formatRupiah(Math.abs(delta))}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                            Saldo akan jadi {formatRupiah(actualBalance)}
                        </p>
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

                {/* Note (required) */}
                <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Alasan Koreksi
                                <span className="text-red-500 ml-1">*</span>
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Salah input, statement beda, dll"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription className="text-xs">
                                Wajib — muncul di riwayat transaksi
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
                        disabled={submitting || !hasChange}
                        className="flex-1"
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        Koreksi Saldo
                    </Button>
                </div>
            </form>
        </Form>
    )
}