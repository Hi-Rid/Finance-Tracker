'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
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
import { Amount } from '@/components/ui/amount'
import { useDailyBudget } from '@/lib/hooks/use-daily-budget'
import {
    dailyBudgetItemSchema,
    type DailyBudgetItemInput,
} from '@/lib/validators/budget'
import { getDaysInMonth } from '@/lib/utils/month'
import { cn } from '@/lib/utils'
import { Loader2, Info, AlertTriangle } from 'lucide-react'
import type { Database } from '@/types/database'

type DailyItem = Database['public']['Tables']['daily_budget_items']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Budget = Database['public']['Tables']['budgets']['Row']

type DailyItemFormProps = {
    profileId: string
    categories: Category[]
    monthlyBudgets: Budget[]
    existingDailyItems: DailyItem[]
    month: string
    item?: DailyItem | null
    onSuccess?: () => void
    onCancel?: () => void
}

type BudgetInfo = {
    hasBudget: boolean
    monthlyTotal: number
    daysInMonth: number
    usedBudget: number
    remainingBudget: number
    remainingPerDay: number
    isOver: boolean
    isNegative: boolean
}

const EMPTY_BUDGET_INFO: BudgetInfo = {
    hasBudget: false,
    monthlyTotal: 0,
    daysInMonth: 0,
    usedBudget: 0,
    remainingBudget: 0,
    remainingPerDay: 0,
    isOver: false,
    isNegative: false,
}

export function DailyItemForm({
    profileId,
    categories,
    monthlyBudgets,
    existingDailyItems,
    month,
    item,
    onSuccess,
    onCancel,
}: DailyItemFormProps) {
    const { createItem, updateItem } = useDailyBudget()
    const isEdit = !!item

    const form = useForm<DailyBudgetItemInput>({
        resolver: zodResolver(dailyBudgetItemSchema) as any,
        defaultValues: {
            name: item?.name || '',
            category_id: item?.category_id || null,
            amount: item?.amount ? Number(item.amount) : 0,
            sort_order: item?.sort_order || 0,
            is_active: item?.is_active ?? true,
        },
    })

    const {
        watch,
        formState: { isSubmitting },
    } = form

    const selectedCategoryId = watch('category_id')
    const currentAmount = watch('amount')

    const budgetInfo: BudgetInfo | null = useMemo(() => {
        if (!selectedCategoryId) return null

        const monthlyBudget = monthlyBudgets.find(
            (b) => b.category_id === selectedCategoryId
        )

        if (!monthlyBudget) {
            return { ...EMPTY_BUDGET_INFO, hasBudget: false }
        }

        const daysInMonth = getDaysInMonth(month)
        const monthlyTotal = Number(monthlyBudget.amount)

        const otherDailyItems = existingDailyItems.filter(
            (i) =>
                i.category_id === selectedCategoryId &&
                i.id !== item?.id &&
                i.is_active === true
        )
        const usedBudget = otherDailyItems.reduce(
            (sum, i) => sum + Number(i.amount) * daysInMonth,
            0
        )

        const remainingBudget = monthlyTotal - usedBudget
        const remainingPerDay = remainingBudget / daysInMonth

        return {
            hasBudget: true,
            monthlyTotal,
            daysInMonth,
            usedBudget,
            remainingBudget,
            remainingPerDay,
            isOver: Number(currentAmount) > remainingPerDay,
            isNegative: remainingBudget <= 0,
        }
    }, [
        selectedCategoryId,
        monthlyBudgets,
        existingDailyItems,
        item?.id,
        month,
        currentAmount,
    ])

    async function onSubmit(data: DailyBudgetItemInput) {
        if (isEdit && item) {
            const result = await updateItem(item.id, data)
            if (result.success) {
                onSuccess?.()
                form.reset()
            }
        } else {
            const result = await createItem(data, profileId)
            if (result.success) {
                onSuccess?.()
                form.reset()
            }
        }
    }

    const expenseCategories = categories.filter(
        (c) => c.type === 'expense' && !c.is_archived
    )

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nama Item</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Sarapan, Transport, Jajan..."
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Kategori</FormLabel>
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
                                    {expenseCategories.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription className="text-xs">
                                Pilih kategori biar bisa di-track ke budget bulanan
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Budget per Hari</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 pointer-events-none">
                                        Rp
                                    </span>
                                    <CurrencyInput
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="0"
                                        className={cn(
                                            'pl-10 font-semibold h-11',
                                            budgetInfo?.hasBudget &&
                                            budgetInfo.isOver &&
                                            'border-amber-400 focus-visible:border-amber-400 focus-visible:ring-amber-400/30'
                                        )}
                                    />
                                </div>
                            </FormControl>

                            {budgetInfo && (
                                <div
                                    className={cn(
                                        'mt-2 flex items-start gap-2 text-xs rounded-lg p-2.5 border',
                                        !budgetInfo.hasBudget
                                            ? 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                                            : budgetInfo.isOver
                                                ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300'
                                                : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                                    )}
                                >
                                    {!budgetInfo.hasBudget ? (
                                        <>
                                            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                            <span>
                                                Kategori ini belum punya monthly budget. Set dulu di{' '}
                                                <strong>Budget Bulanan</strong> biar ada batasan.
                                            </span>
                                        </>
                                    ) : budgetInfo.isNegative ? (
                                        <>
                                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                            <span className="flex flex-wrap items-center gap-1">
                                                <span>Budget kategori ini udah habis. Total</span>
                                                <Amount
                                                    value={budgetInfo.usedBudget}
                                                    className="inline text-xs font-bold"
                                                />
                                                <span>dari</span>
                                                <Amount
                                                    value={budgetInfo.monthlyTotal}
                                                    className="inline text-xs font-bold"
                                                />
                                                <span>udah kepake di daily items lain.</span>
                                            </span>
                                        </>
                                    ) : budgetInfo.isOver ? (
                                        <>
                                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                            <span className="flex flex-wrap items-center gap-1">
                                                <span>Melebihi sisa budget. Sisa budget harian kategori ini:</span>
                                                <Amount
                                                    value={Math.round(budgetInfo.remainingPerDay)}
                                                    className="inline text-xs font-bold"
                                                />
                                                <span>(dari</span>
                                                <Amount
                                                    value={budgetInfo.remainingBudget}
                                                    className="inline text-xs font-bold"
                                                />
                                                <span>÷ {budgetInfo.daysInMonth} hari). Tetep bisa disimpan, tapi bakal over budget bulanan.</span>
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                            <span className="flex flex-wrap items-center gap-1">
                                                <span>Sisa budget harian kategori ini:</span>
                                                <Amount
                                                    value={Math.round(budgetInfo.remainingPerDay)}
                                                    className="inline text-xs font-bold"
                                                />
                                                <span>(dari</span>
                                                <Amount
                                                    value={budgetInfo.remainingBudget}
                                                    className="inline text-xs font-bold"
                                                />
                                                <span>÷ {budgetInfo.daysInMonth} hari).</span>
                                            </span>
                                        </>
                                    )}
                                </div>
                            )}

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