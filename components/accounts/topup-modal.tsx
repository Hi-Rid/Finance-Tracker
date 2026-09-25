'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Loader2, TrendingUp, Plus } from 'lucide-react'
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
import { topupSchema, type TopupInput } from '@/lib/validators/account'
import { formatRupiah } from '@/lib/normalize'
import type { Database } from '@/types/database'

type Account = Database['public']['Tables']['accounts']['Row']
type Category = Database['public']['Tables']['categories']['Row']

type TopupModalProps = {
    account: Account
    profileId: string
    incomeCategories: Category[]
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

export function TopupModal({
    account,
    profileId,
    incomeCategories,
    onSuccess,
    onCancel,
}: TopupModalProps) {
    const { topup } = useAccounts()
    const [submitting, setSubmitting] = useState(false)

    const form = useForm<TopupInput>({
        resolver: zodResolver(topupSchema) as any,
        defaultValues: {
            account_id: account.id,
            amount: 0,
            category_id: null,
            date: toDateTimeInputValue(new Date()),
            note: '',
        },
    })

    const amount = Number(form.watch('amount')) || 0
    const previewBalance = Number(account.current_balance) + amount

    async function onSubmit(data: TopupInput) {
        setSubmitting(true)
        const result = await topup(data, profileId)
        setSubmitting(false)
        if (result.success) {
            form.reset()
            onSuccess?.()
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Account info */}
                <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                            Tambah Saldo
                        </span>
                    </div>
                    <p className="text-base font-bold">{account.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                        Saldo saat ini: {formatRupiah(Number(account.current_balance))}
                    </p>
                </div>

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

                {/* Preview */}
                {amount > 0 && (
                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-4">
                        <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-1.5">
                            Saldo Setelah
                        </p>
                        <p className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                            {formatRupiah(previewBalance)}
                        </p>
                    </div>
                )}

                {/* Category */}
                <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Kategori (opsional)</FormLabel>
                            <Select
                                onValueChange={(v) =>
                                    field.onChange(v === '__none__' ? null : v)
                                }
                                value={field.value || '__none__'}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih kategori" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="__none__">Tanpa kategori</SelectItem>
                                    {incomeCategories.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription className="text-xs">
                                Contoh: Gaji, Side Job, Transfer In
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

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
                            <FormLabel>Catatan</FormLabel>
                            <FormControl>
                                <Input placeholder="Gaji bulan September, dll" {...field} />
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
                        disabled={submitting || amount <= 0}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        Tambah Saldo
                    </Button>
                </div>
            </form>
        </Form>
    )
}