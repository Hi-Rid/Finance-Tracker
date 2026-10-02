'use client'

import { useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
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
import { useGoals } from '@/lib/hooks/use-goals'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import {
    contributionSchema,
    withdrawGoalSchema,
    type ContributionInput,
    GOAL_TYPE_EMOJI,
    type GoalType,
} from '@/lib/validators/goals'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Goal = Database['public']['Tables']['goals']['Row']
type Account = Database['public']['Tables']['accounts']['Row']

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: 'deposit' | 'withdraw'
    goal: Goal | null
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

export function GoalContributeModal({
    open,
    onOpenChange,
    mode,
    goal,
    accounts,
}: Props) {
    const isMobile = useMediaQuery('(max-width: 767px)')
    const { contribute, withdraw } = useGoals()
    const [submitting, setSubmitting] = useState(false)

    const isDeposit = mode === 'deposit'

    // Filter accounts — exclude envelope
    const availableAccounts = useMemo(
        () => accounts.filter((a) => a.type !== 'envelope'),
        [accounts]
    )

    const form = useForm<ContributionInput>({
        resolver: zodResolver(
            (isDeposit ? contributionSchema : withdrawGoalSchema) as any
        ),
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
    }, [open, goal?.id, mode])

    const amount = Number(form.watch('amount')) || 0
    const selectedAccountId = form.watch('account_id')
    const selectedAccount = availableAccounts.find(
        (a) => a.id === selectedAccountId
    )

    const current = Number(goal?.current_amount || 0)
    const target = Number(goal?.target_amount || 0)

    // Validasi saldo
    const availableBalance = isDeposit
        ? Number(selectedAccount?.current_balance || 0)
        : current

    const insufficient = amount > 0 && amount > availableBalance

    const previewAmount = isDeposit
        ? current + amount
        : Math.max(0, current - amount)
    const previewPercent = target > 0 ? (previewAmount / target) * 100 : 0

    async function onSubmit(data: ContributionInput) {
        if (!goal) return
        setSubmitting(true)
        const result = isDeposit
            ? await contribute(goal.id, data)
            : await withdraw(goal.id, data)
        setSubmitting(false)
        if (result.success) {
            onOpenChange(false)
        }
    }

    const type = (goal?.type as GoalType) || 'custom'
    const emoji = GOAL_TYPE_EMOJI[type] || '⭐'

    const title = isDeposit ? 'Setor Uang' : 'Tarik Uang'
    const description = isDeposit
        ? `Pindah uang dari akun ke envelope goal "${goal?.name}".`
        : `Pindah uang dari envelope goal "${goal?.name}" ke akun.`

    const formContent = (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Info goal */}
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
                            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg',
                            isDeposit ? 'bg-emerald-500/15' : 'bg-amber-500/15'
                        )}
                    >
                        {emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5 opacity-70">
                            {isDeposit ? 'Nabung untuk' : 'Tarik dari'}
                        </p>
                        <p className="text-sm font-bold truncate">
                            {goal?.name || '—'}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
                            <span>Tersimpan:</span>
                            <Amount
                                value={current}
                                className="inline text-[11px] font-medium"
                            />
                            <span>·</span>
                            <span>Target:</span>
                            <Amount
                                value={target}
                                className="inline text-[11px] font-medium"
                            />
                        </p>
                    </div>
                </div>

                {/* Amount */}
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

                {!isDeposit && current > 0 && (
                    <button
                        type="button"
                        onClick={() =>
                            form.setValue('amount', current, {
                                shouldValidate: true,
                            })
                        }
                        className="text-[11px] text-brand hover:underline cursor-pointer"
                    >
                        Tarik semua (Rp {current.toLocaleString('id-ID')})
                    </button>
                )}

                {/* ACCOUNT SELECTOR */}
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
                            insufficient
                                ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
                                : 'bg-brand/5 border-brand/20'
                        )}
                    >
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">
                                {isDeposit
                                    ? `Saldo ${selectedAccount?.name || ''} setelah`
                                    : `Saldo ${selectedAccount?.name || ''} setelah`}
                            </span>
                            <Amount
                                value={
                                    isDeposit
                                        ? availableBalance - amount
                                        : availableBalance + amount
                                }
                                className={cn(
                                    'text-xs font-medium',
                                    insufficient &&
                                    'text-red-600 dark:text-red-400'
                                )}
                            />
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">
                                Envelope setelah
                            </span>
                            <Amount
                                value={previewAmount}
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
                                    ? `Saldo ${selectedAccount?.name || 'akun'} cuma Rp ${availableBalance.toLocaleString('id-ID')}`
                                    : `Envelope cuma Rp ${availableBalance.toLocaleString('id-ID')}`}
                            </p>
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
                            insufficient ||
                            !selectedAccountId
                        }
                        className={cn(
                            'flex-1 h-11 font-bold',
                            isDeposit &&
                            'bg-emerald-500 hover:bg-emerald-600 text-white'
                        )}
                    >
                        {submitting && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        {isDeposit ? (
                            <>
                                <TrendingUp className="w-4 h-4" />
                                Setor
                            </>
                        ) : (
                            <>
                                <TrendingDown className="w-4 h-4" />
                                Tarik
                            </>
                        )}
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