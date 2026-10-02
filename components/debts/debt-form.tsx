'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, TrendingDown, TrendingUp } from 'lucide-react'
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
import { useDebts } from '@/lib/hooks/use-debts'
import {
    debtSchema,
    DEBT_TYPES,
    DEBT_TYPE_LABELS_FULL,
    type DebtInput,
} from '@/lib/validators/debts'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Debt = Database['public']['Tables']['debts']['Row']

type Props = {
    profileId: string
    debt?: Debt | null
    onSuccess?: () => void
    onCancel?: () => void
}

function toDateInputValue(d: string | null | undefined): string {
    if (!d) return ''
    return new Date(d).toISOString().split('T')[0]
}

function todayValue(): string {
    return new Date().toISOString().split('T')[0]
}

export function DebtForm({ profileId, debt, onSuccess, onCancel }: Props) {
    const { createDebt, updateDebt } = useDebts()
    const isEdit = !!debt

    const form = useForm<DebtInput>({
        resolver: zodResolver(debtSchema) as any,
        defaultValues: {
            name: debt?.name || '',
            type: (debt?.type as DebtInput['type']) || 'debt',
            principal: debt?.principal ? Number(debt.principal) : 0,
            outstanding: debt?.outstanding ? Number(debt.outstanding) : undefined,
            interest_rate: debt?.interest_rate
                ? Number(debt.interest_rate) * 100
                : 0,
            start_date: toDateInputValue(debt?.start_date) || todayValue(),
            due_date: toDateInputValue(debt?.due_date),
            note: debt?.note || '',
        },
    })

    const {
        watch,
        formState: { isSubmitting },
    } = form

    const watchedType = watch('type')

    async function onSubmit(data: DebtInput) {
        if (isEdit && debt) {
            const result = await updateDebt(debt.id, data)
            if (result.success) {
                onSuccess?.()
                form.reset()
            }
        } else {
            const result = await createDebt(data, profileId)
            if (result.success) {
                onSuccess?.()
                form.reset()
            }
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Type */}
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipe</FormLabel>
                            <FormControl>
                                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/5">
                                    {DEBT_TYPES.map((t) => {
                                        const isActive = field.value === t
                                        const isDebt = t === 'debt'
                                        const Icon = isDebt
                                            ? TrendingDown
                                            : TrendingUp
                                        const color = isDebt
                                            ? '#ef4444'
                                            : '#10b981'
                                        return (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() =>
                                                    field.onChange(t)
                                                }
                                                disabled={isEdit}
                                                className={cn(
                                                    'flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                                                    isActive
                                                        ? 'bg-white dark:bg-white/10 shadow-sm'
                                                        : 'text-slate-500 dark:text-slate-400',
                                                    isEdit && 'cursor-not-allowed opacity-60'
                                                )}
                                                style={
                                                    isActive
                                                        ? { color }
                                                        : undefined
                                                }
                                            >
                                                <Icon className="w-3.5 h-3.5" />
                                                {DEBT_TYPE_LABELS_FULL[t]}
                                            </button>
                                        )
                                    })}
                                </div>
                            </FormControl>
                            {isEdit && (
                                <FormDescription className="text-xs">
                                    Tipe gak bisa diubah setelah dibuat.
                                </FormDescription>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Name */}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                {watchedType === 'debt'
                                    ? 'Nama Utang / Kreditur'
                                    : 'Nama Piutang / Debitur'}
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder={
                                        watchedType === 'debt'
                                            ? 'Paylater iPhone, KPR BCA, Pinjam Ridho...'
                                            : 'Pinjam ke Budi, Utang Andi...'
                                    }
                                    autoFocus={!isEdit}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Principal */}
                <FormField
                    control={form.control}
                    name="principal"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                {isEdit
                                    ? 'Nominal Awal'
                                    : watchedType === 'debt'
                                        ? 'Total Utang'
                                        : 'Total Piutang'}
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
                                        className="pl-9 text-base font-semibold h-11"
                                        disabled={isEdit}
                                    />
                                </div>
                            </FormControl>
                            {isEdit && (
                                <FormDescription className="text-xs">
                                    Nominal awal gak bisa diubah. Pakai catat pembayaran buat update sisa.
                                </FormDescription>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Outstanding (create only) */}
                {!isEdit && (
                    <FormField
                        control={form.control}
                        name="outstanding"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Sisa Sekarang{' '}
                                    <span className="text-muted-foreground font-normal">
                                        (opsional)
                                    </span>
                                </FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 pointer-events-none z-10">
                                            Rp
                                        </span>
                                        <CurrencyInput
                                            value={field.value ?? 0}
                                            onChange={field.onChange}
                                            placeholder="Sama dengan total"
                                            className="pl-9"
                                        />
                                    </div>
                                </FormControl>
                                <FormDescription className="text-xs">
                                    Kosongin kalau belum ada pembayaran
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {/* Interest rate */}
                <FormField
                    control={form.control}
                    name="interest_rate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Bunga per Tahun{' '}
                                <span className="text-muted-foreground font-normal">
                                    (opsional)
                                </span>
                            </FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        inputMode="decimal"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={field.value || ''}
                                        onChange={(e) =>
                                            field.onChange(
                                                e.target.value === ''
                                                    ? 0
                                                    : Number(e.target.value)
                                            )
                                        }
                                        placeholder="0"
                                        className="pr-10"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 pointer-events-none">
                                        %
                                    </span>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Start date */}
                <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tanggal Mulai</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Due date */}
                <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Jatuh Tempo{' '}
                                <span className="text-muted-foreground font-normal">
                                    (opsional)
                                </span>
                            </FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
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
                                    placeholder="Detail tambahan..."
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
                    {onCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            className="flex-1 h-11"
                        >
                            Batal
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 h-11 font-bold"
                    >
                        {isSubmitting && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        {isEdit ? 'Simpan' : 'Simpan'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}