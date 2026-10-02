'use client'

import { useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Wallet, AlertTriangle } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Amount } from '@/components/ui/amount'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useDebts } from '@/lib/hooks/use-debts'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { paymentSchema, type PaymentInput } from '@/lib/validators/debts'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Debt = Database['public']['Tables']['debts']['Row']
type Account = Database['public']['Tables']['accounts']['Row']

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    debt: Debt
    accounts: Account[]
}

function toDateTimeInputValue(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const h = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${day}T${h}:${min}`
}

export function DebtPaymentModal({
    open,
    onOpenChange,
    debt,
    accounts,
}: Props) {
    const isMobile = useMediaQuery('(max-width: 767px)')
    const { recordPayment } = useDebts()
    const [submitting, setSubmitting] = useState(false)

    const isDebt = debt.type === 'debt'
    const color = isDebt ? '#ef4444' : '#10b981'

    const availableAccounts = useMemo(
        () => accounts.filter((a) => a.type !== 'envelope'),
        [accounts]
    )

    const form = useForm<PaymentInput>({
        resolver: zodResolver(paymentSchema) as any,
        defaultValues: {
            amount: 0,
            account_id: availableAccounts[0]?.id || '',
            date: toDateTimeInputValue(new Date()),
            note: '',
        },
    })

    useEffect(() => {
        if (open) {
            form.reset({
                amount: 0,
                account_id: availableAccounts[0]?.id || '',
                date: toDateTimeInputValue(new Date()),
                note: '',
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, debt.id])

    const amount = Number(form.watch('amount')) || 0
    const selectedAccountId = form.watch('account_id')
    const selectedAccount = availableAccounts.find(
        (a) => a.id === selectedAccountId
    )

    const outstanding = Number(debt.outstanding)
    const overpay = amount > outstanding

    // For debt: bayar dari akun. For receivable: terima ke akun.
    // Validate account balance only for debt (harus cukup)
    const availableBalance = Number(selectedAccount?.current_balance || 0)
    const insufficientBalance =
        isDebt && amount > 0 && amount > availableBalance

    const newOutstanding = Math.max(0, outstanding - amount)
    const isSettling = newOutstanding === 0 && amount > 0

    async function onSubmit(data: PaymentInput) {
        setSubmitting(true)
        const result = await recordPayment(debt.id, data)
        setSubmitting(false)
        if (result.success) {
            onOpenChange(false)
        }
    }

    const title = isDebt ? 'Bayar Utang' : 'Terima Piutang'
    const description = isDebt
        ? `Bayar utang "${debt.name}". Saldo akun bakal berkurang.`
        : `Terima pembayaran piutang "${debt.name}". Saldo akun bakal nambah.`

    const formContent = (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Debt info */}
                <div
                    className="rounded-xl p-4 border flex items-start gap-3"
                    style={{
                        backgroundColor: `${color}08`,
                        borderColor: `${color}40`,
                    }}
                >
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${color}20` }}
                    >
                        <Wallet
                            className="w-4 h-4"
                            style={{ color }}
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5 opacity-70">
                            {debt.name}
                        </p>
                        <p className="text-sm font-bold">
                            Sisa: <Amount value={outstanding} className="inline text-sm font-bold" />
                        </p>
                    </div>
                </div>

                {/* Amount */}
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Jumlah Bayar</FormLabel>
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

                {outstanding > 0 && (
                    <button
                        type="button"
                        onClick={() =>
                            form.setValue('amount', outstanding, {
                                shouldValidate: true,
                            })
                        }
                        className="text-[11px] hover:underline cursor-pointer"
                        style={{ color }}
                    >
                        Bayar semua (Rp {outstanding.toLocaleString('id-ID')})
                    </button>
                )}

                {/* Account */}
                <FormField
                    control={form.control}
                    name="account_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                {isDebt ? 'Bayar dari Akun' : 'Terima ke Akun'}
                            </FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger className="h-11">
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <div className="w-7 h-7 rounded-md bg-brand/10 flex items-center justify-center shrink-0">
                                                <Wallet className="w-3.5 h-3.5 text-brand" />
                                            </div>
                                            <SelectValue placeholder="Pilih akun" />
                                        </div>
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {availableAccounts.map((a) => (
                                        <SelectItem key={a.id} value={a.id}>
                                            <div className="flex items-center justify-between gap-3 w-full">
                                                <span className="font-medium">
                                                    {a.name}
                                                </span>
                                                <Amount
                                                    value={Number(
                                                        a.current_balance
                                                    )}
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

                {/* Preview */}
                {amount > 0 && (
                    <div
                        className={cn(
                            'rounded-xl p-4 border space-y-2',
                            overpay || insufficientBalance
                                ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
                                : 'bg-brand/5 border-brand/20'
                        )}
                    >
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">
                                Saldo {selectedAccount?.name} setelah
                            </span>
                            <Amount
                                value={
                                    isDebt
                                        ? availableBalance - amount
                                        : availableBalance + amount
                                }
                                className={cn(
                                    'text-xs font-medium',
                                    insufficientBalance &&
                                    'text-red-600 dark:text-red-400'
                                )}
                            />
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">
                                Sisa setelah bayar
                            </span>
                            <Amount
                                value={newOutstanding}
                                className={cn(
                                    'text-xs font-bold',
                                    newOutstanding === 0
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-slate-900 dark:text-white'
                                )}
                            />
                        </div>
                        {isSettling && (
                            <div className="pt-2 border-t border-brand/20 dark:border-white/10 flex items-center gap-1.5">
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    🎉 Lunas!
                                </span>
                            </div>
                        )}
                        {overpay && (
                            <div className="pt-2 border-t border-red-200 dark:border-red-500/30 flex items-start gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-red-600 dark:text-red-400">
                                    Melebihi sisa utang
                                </p>
                            </div>
                        )}
                        {insufficientBalance && (
                            <div className="pt-2 border-t border-red-200 dark:border-red-500/30 flex items-start gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-red-600 dark:text-red-400">
                                    Saldo {selectedAccount?.name} cuma Rp{' '}
                                    {availableBalance.toLocaleString('id-ID')}
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
                            <FormLabel>Tanggal</FormLabel>
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
                            <FormLabel>
                                Catatan{' '}
                                <span className="text-muted-foreground font-normal">
                                    (opsional)
                                </span>
                            </FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="..."
                                    rows={2}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                        className="flex-1 h-11"
                    >
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        disabled={
                            submitting ||
                            amount <= 0 ||
                            overpay ||
                            insufficientBalance ||
                            !selectedAccountId
                        }
                        className="flex-1 h-11 font-bold text-white"
                        style={{ backgroundColor: color }}
                    >
                        {submitting && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        Konfirmasi
                    </Button>
                </div>
            </form>
        </Form>
    )

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent
                    side="bottom"
                    className="max-h-[92vh] overflow-y-auto"
                >
                    <SheetHeader>
                        <SheetTitle>{title}</SheetTitle>
                        <SheetDescription>{description}</SheetDescription>
                    </SheetHeader>
                    <div className="px-4 pb-6 pt-2">{formContent}</div>
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[92vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                {formContent}
            </DialogContent>
        </Dialog>
    )
}