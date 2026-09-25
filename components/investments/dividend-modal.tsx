'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Loader2, Gift } from 'lucide-react'
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
import { dividendSchema, type DividendInput } from '@/lib/validators/investment'
import { Loader2 as Loader } from 'lucide-react'
import type { Database } from '@/types/database'
import type { InvestmentPosition } from '@/lib/investments/types'

type Account = Database['public']['Tables']['accounts']['Row']

type DividendModalProps = {
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

export function DividendModal({
    position,
    accounts,
    onSuccess,
    onCancel,
}: DividendModalProps) {
    const { dividend } = useInvestments()
    const [submitting, setSubmitting] = useState(false)

    const investmentAccounts = accounts.filter(
        (a) => a.type === 'investment' && !a.is_archived
    )

    const form = useForm<DividendInput>({
        resolver: zodResolver(dividendSchema) as any,
        defaultValues: {
            asset_id: position.asset.id,
            amount: 0,
            date: toDateTimeInputValue(new Date()),
            account_id: investmentAccounts[0]?.id || '',
            note: '',
        },
    })

    async function onSubmit(data: DividendInput) {
        setSubmitting(true)
        const result = await dividend(data)
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
                <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Gift className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                            Dividend
                        </span>
                    </div>
                    <p className="text-base font-bold">{ticker}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {position.asset.name} · {position.lot_held} lot
                    </p>
                </div>

                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Jumlah Dividend</FormLabel>
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

                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tanggal & Waktu Terima</FormLabel>
                            <FormControl>
                                <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

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
                                <Input placeholder="..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

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
                        disabled={submitting}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                        {submitting && <Loader className="w-4 h-4 animate-spin" />}
                        Catat Dividend
                    </Button>
                </div>
            </form>
        </Form>
    )
}