'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Loader2, ArrowRight, AlertTriangle } from 'lucide-react'
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
import { useAccounts } from '@/lib/hooks/use-accounts'
import { transferSchema, type TransferInput } from '@/lib/validators/account'
import { formatRupiah } from '@/lib/normalize'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Account = Database['public']['Tables']['accounts']['Row']

type TransferModalProps = {
    sourceAccount: Account
    allAccounts: Account[]
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

export function TransferModal({
    sourceAccount,
    allAccounts,
    profileId,
    onSuccess,
    onCancel,
}: TransferModalProps) {
    const { transfer } = useAccounts()
    const [submitting, setSubmitting] = useState(false)

    const availableAccounts = allAccounts.filter(
        (a) => a.id !== sourceAccount.id && !a.is_archived
    )

    const form = useForm<TransferInput>({
        resolver: zodResolver(transferSchema) as any,
        defaultValues: {
            from_account_id: sourceAccount.id,
            to_account_id: availableAccounts[0]?.id || '',
            amount: 0,
            fee: 0,
            date: toDateTimeInputValue(new Date()),
            note: '',
        },
    })

    const amount = Number(form.watch('amount')) || 0
    const fee = Number(form.watch('fee')) || 0
    const toAccountId = form.watch('to_account_id')
    const destAccount = allAccounts.find((a) => a.id === toAccountId)
    const sourceBalance = Number(sourceAccount.current_balance)
    const totalDeduct = amount + fee
    const insufficientBalance = totalDeduct > 0 && totalDeduct > sourceBalance

    async function onSubmit(data: TransferInput) {
        setSubmitting(true)
        const result = await transfer(data, profileId)
        setSubmitting(false)
        if (result.success) {
            form.reset()
            onSuccess?.()
        }
    }

    if (availableAccounts.length === 0) {
        return (
            <div className="space-y-4">
                <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-4 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                            Gak ada akun lain
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                            Bikin akun lain dulu untuk bisa transfer.
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

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Flow visualization */}
                <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                                Dari
                            </p>
                            <p className="text-sm font-bold truncate">{sourceAccount.name}</p>
                            <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                                {formatRupiah(sourceBalance)}
                            </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-brand shrink-0" />
                        <div className="flex-1 min-w-0 text-right">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                                Ke
                            </p>
                            <p className="text-sm font-bold truncate">
                                {destAccount?.name || '—'}
                            </p>
                            <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                                {destAccount
                                    ? formatRupiah(Number(destAccount.current_balance))
                                    : '—'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Destination */}
                <FormField
                    control={form.control}
                    name="to_account_id"
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
                                    {availableAccounts.map((a) => (
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

                {/* Amount */}
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Jumlah</FormLabel>
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
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Fee */}
                <FormField
                    control={form.control}
                    name="fee"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Biaya Transfer (opsional)</FormLabel>
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
                {amount > 0 && (
                    <div
                        className={cn(
                            'rounded-xl p-4 space-y-2 border',
                            insufficientBalance
                                ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
                                : 'bg-brand/5 border-brand/20'
                        )}
                    >
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Jumlah</span>
                            <span className="font-medium tabular-nums">
                                {formatRupiah(amount)}
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
                                    insufficientBalance
                                        ? 'text-red-700 dark:text-red-300'
                                        : 'text-brand'
                                )}
                            >
                                Total Keluar
                            </span>
                            <span
                                className={cn(
                                    'text-base font-bold tabular-nums',
                                    insufficientBalance
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-brand'
                                )}
                            >
                                {formatRupiah(totalDeduct)}
                            </span>
                        </div>
                        {insufficientBalance && (
                            <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-500/30 flex items-start gap-2">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-red-600 dark:text-red-400">
                                    Saldo {sourceAccount.name} cuma {formatRupiah(sourceBalance)} —
                                    kurang {formatRupiah(totalDeduct - sourceBalance)}
                                </p>
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

                {/* Note */}
                <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Catatan (opsional)</FormLabel>
                            <FormControl>
                                <Input placeholder="..." {...field} />
                            </FormControl>
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
                        disabled={submitting || amount <= 0 || insufficientBalance}
                        className="flex-1"
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {insufficientBalance ? 'Saldo Tidak Cukup' : 'Transfer'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}