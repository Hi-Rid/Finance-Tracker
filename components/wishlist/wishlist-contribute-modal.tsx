'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, PiggyBank, Undo2 } from 'lucide-react'
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
import { useWishlists } from '@/lib/hooks/use-wishlists'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import {
    contributeSchema,
    withdrawSchema,
    type ContributeInput,
} from '@/lib/validators/wishlist'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Account = Database['public']['Tables']['accounts']['Row']
type Wishlist = Database['public']['Tables']['wishlists']['Row']

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: 'deposit' | 'withdraw'
    wishlist: Wishlist | null
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

export function WishlistContributeModal({
    open,
    onOpenChange,
    mode,
    wishlist,
    accounts,
}: Props) {
    const isMobile = useMediaQuery('(max-width: 767px)')
    const { contribute, withdraw } = useWishlists()
    const [submitting, setSubmitting] = useState(false)

    const isDeposit = mode === 'deposit'

    const form = useForm<ContributeInput>({
        resolver: zodResolver(
            (isDeposit ? contributeSchema : withdrawSchema) as any
        ),
        defaultValues: {
            amount: 0,
            account_id: accounts[0]?.id || '',
            date: toDateTimeInputValue(new Date()),
            note: '',
        },
    })

    useEffect(() => {
        if (open) {
            form.reset({
                amount: 0,
                account_id: accounts[0]?.id || '',
                date: toDateTimeInputValue(new Date()),
                note: '',
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, wishlist?.id])

    const amount = Number(form.watch('amount')) || 0
    const selectedAccountId = form.watch('account_id')
    const selectedAccount = accounts.find((a) => a.id === selectedAccountId)

    const currentSaved = Number(wishlist?.saved_amount || 0)
    const targetPrice = Number(wishlist?.target_price || 0)

    const availableBalance = isDeposit
        ? Number(selectedAccount?.current_balance || 0)
        : currentSaved

    const insufficient = amount > 0 && amount > availableBalance

    const previewSaved = isDeposit
        ? currentSaved + amount
        : Math.max(0, currentSaved - amount)
    const previewPercent =
        targetPrice > 0 ? (previewSaved / targetPrice) * 100 : 0

    async function onSubmit(data: ContributeInput) {
        if (!wishlist) return
        setSubmitting(true)
        const result = isDeposit
            ? await contribute(wishlist.id, data)
            : await withdraw(wishlist.id, data)
        setSubmitting(false)
        if (result.success) {
            onOpenChange(false)
        }
    }

    const title = isDeposit ? 'Setor Tabungan' : 'Tarik Tabungan'
    const description = isDeposit
        ? `Setor uang ke envelope "${wishlist?.name}".`
        : `Tarik uang dari envelope "${wishlist?.name}".`

    const formContent = (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div
                    className={cn(
                        'rounded-xl p-4 border flex items-start gap-3',
                        isDeposit
                            ? 'bg-emerald-50/60 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-amber-50/60 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/30'
                    )}
                >
                    <div
                        className={cn(
                            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                            isDeposit
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        )}
                    >
                        {isDeposit ? (
                            <PiggyBank className="w-4 h-4" />
                        ) : (
                            <Undo2 className="w-4 h-4" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5 opacity-70">
                            {isDeposit ? 'Nabung untuk' : 'Tarik dari'}
                        </p>
                        <p className="text-sm font-bold truncate">
                            {wishlist?.name || '—'}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            <span>Tersimpan:</span>
                            <Amount
                                value={currentSaved}
                                className="inline text-[11px] font-medium"
                            />
                            <span>·</span>
                            <span>Target:</span>
                            <Amount
                                value={targetPrice}
                                className="inline text-[11px] font-medium"
                            />
                        </p>
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Jumlah {isDeposit ? 'Setor' : 'Tarik'}
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
                                        className="pl-9 text-lg font-semibold h-12"
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {!isDeposit && currentSaved > 0 && (
                    <button
                        type="button"
                        onClick={() =>
                            form.setValue('amount', currentSaved, {
                                shouldValidate: true,
                            })
                        }
                        className="text-[11px] text-brand hover:underline cursor-pointer"
                    >
                        Tarik semua (Rp {currentSaved.toLocaleString('id-ID')})
                    </button>
                )}

                <FormField
                    control={form.control}
                    name="account_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                {isDeposit ? 'Dari Akun' : 'Ke Akun'}
                            </FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                            >
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

                {amount > 0 && (
                    <div
                        className={cn(
                            'rounded-xl p-4 border space-y-2',
                            insufficient
                                ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
                                : 'bg-brand/5 border-brand/20'
                        )}
                    >
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                                {isDeposit
                                    ? 'Saldo akun setelah'
                                    : 'Envelope setelah'}
                            </span>
                            <Amount
                                value={availableBalance - amount}
                                className={cn(
                                    'text-xs font-medium',
                                    insufficient &&
                                    'text-red-600 dark:text-red-400'
                                )}
                            />
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                                Tersimpan setelah
                            </span>
                            <Amount
                                value={previewSaved}
                                className="text-xs font-bold text-brand"
                            />
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-brand/20 dark:border-white/10">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                Progress Baru
                            </span>
                            <span
                                className={cn(
                                    'text-sm font-bold tabular-nums',
                                    previewPercent >= 100
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-brand'
                                )}
                            >
                                {Math.round(previewPercent)}%
                            </span>
                        </div>
                        {insufficient && (
                            <p className="text-[11px] text-red-600 dark:text-red-400 pt-1">
                                {isDeposit
                                    ? `Saldo akun cuma Rp ${availableBalance.toLocaleString('id-ID')}`
                                    : `Envelope cuma Rp ${availableBalance.toLocaleString('id-ID')}`}
                            </p>
                        )}
                    </div>
                )}

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

                <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Catatan (opsional)</FormLabel>
                            <FormControl>
                                <Textarea placeholder="..." rows={2} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex gap-3 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                        className="flex-1"
                    >
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        disabled={submitting || amount <= 0 || insufficient}
                        className={cn(
                            'flex-1',
                            isDeposit &&
                            'bg-emerald-500 hover:bg-emerald-600 text-white'
                        )}
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isDeposit ? 'Setor' : 'Tarik'}
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