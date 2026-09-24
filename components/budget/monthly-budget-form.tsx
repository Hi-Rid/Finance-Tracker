'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { CurrencyInput } from '@/components/ui/currency-input'
import { useMonthlyBudget } from '@/lib/hooks/use-monthly-budget'
import {
    monthlyBudgetSchema,
    type MonthlyBudgetInput,
} from '@/lib/validators/budget'
import { Loader2 } from 'lucide-react'
import type { Database } from '@/types/database'

type Budget = Database['public']['Tables']['budgets']['Row']
type Category = Database['public']['Tables']['categories']['Row']

type MonthlyBudgetFormProps = {
    profileId: string
    month: string
    categories: Category[]
    editingBudget?: Budget | null
    editingCategory?: Category | null
    onSuccess?: () => void
    onCancel?: () => void
}

export function MonthlyBudgetForm({
    profileId,
    month,
    categories,
    editingBudget,
    editingCategory,
    onSuccess,
    onCancel,
}: MonthlyBudgetFormProps) {
    const { upsertBudget } = useMonthlyBudget()
    const isEdit = !!editingBudget

    const form = useForm<MonthlyBudgetInput>({
        resolver: zodResolver(monthlyBudgetSchema) as any,
        defaultValues: {
            category_id: editingBudget?.category_id || '',
            amount: editingBudget?.amount ? Number(editingBudget.amount) : 0,
            note: editingBudget?.note || '',
        },
    })

    const {
        formState: { isSubmitting },
    } = form

    async function onSubmit(data: MonthlyBudgetInput) {
        const result = await upsertBudget(data, profileId, month)
        if (result.success) {
            onSuccess?.()
            form.reset()
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Category — cuma tampil kalau create, kalau edit cuma display */}
                <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Kategori</FormLabel>
                            {isEdit && editingCategory ? (
                                <div className="flex h-10 items-center rounded-lg border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 px-3 text-sm text-slate-900 dark:text-white">
                                    {editingCategory.name}
                                </div>
                            ) : (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih kategori" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
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
                            <FormLabel>Budget per Bulan</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 pointer-events-none">
                                        Rp
                                    </span>
                                    <CurrencyInput
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="0"
                                        className="pl-10 font-semibold h-11"
                                    />
                                </div>
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
                        >
                            Batal
                        </Button>
                    )}
                    <Button type="submit" disabled={isSubmitting} className="flex-1">
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isEdit ? 'Simpan' : 'Tambah'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}