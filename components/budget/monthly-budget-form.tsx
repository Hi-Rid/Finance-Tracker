'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
    onSuccess?: () => void
    onCancel?: () => void
}

export function MonthlyBudgetForm({
    profileId,
    month,
    categories,
    editingBudget,
    onSuccess,
    onCancel,
}: MonthlyBudgetFormProps) {
    const { upsertBudget } = useMonthlyBudget()
    const isEdit = !!editingBudget

    const form = useForm<MonthlyBudgetInput>({
        resolver: zodResolver(monthlyBudgetSchema) as any,
        defaultValues: {
            name: editingBudget?.name || '',
            category_id: editingBudget?.category_id || null,
            amount: editingBudget?.amount ? Number(editingBudget.amount) : 0,
            note: editingBudget?.note || '',
        },
    })

    const {
        formState: { isSubmitting },
    } = form

    async function onSubmit(data: MonthlyBudgetInput) {
        const result = await upsertBudget(
            data,
            profileId,
            month,
            isEdit ? editingBudget?.id : undefined
        )
        if (result.success) {
            onSuccess?.()
            form.reset()
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Nama Budget */}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nama Budget</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Contoh: Kost, Makan, Netflix"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription className="text-xs">
                                Nama ini yang muncul di daftar budget
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Kategori */}
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
                                    <SelectItem value="__none__">
                                        Tanpa kategori
                                    </SelectItem>
                                    {categories.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription className="text-xs">
                                Biar tracking pengeluaran ke kategori ini
                                kehitung otomatis
                            </FormDescription>
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
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1"
                    >
                        {isSubmitting && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        {isEdit ? 'Simpan' : 'Tambah'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}