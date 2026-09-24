'use client'

import { useState } from 'react'
import {
    Plus,
    Pencil,
    Trash2,
    MoreVertical,
    Target,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/ui/empty-state'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { MonthlyBudgetForm } from './monthly-budget-form'
import { useMonthlyBudget } from '@/lib/hooks/use-monthly-budget'
import { formatRupiah } from '@/lib/normalize'
import { getCategoryIcon } from '@/lib/constants/category-icons'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Budget = Database['public']['Tables']['budgets']['Row']
type Category = Database['public']['Tables']['categories']['Row']

type CategorySpent = {
    category_id: string
    spent: number
}

type MonthlyBudgetListProps = {
    budgets: Budget[]
    categories: Category[]
    categorySpent: CategorySpent[]
    profileId: string
    month: string
}

export function MonthlyBudgetList({
    budgets,
    categories,
    categorySpent,
    profileId,
    month,
}: MonthlyBudgetListProps) {
    const isMobile = useMediaQuery('(max-width: 767px)')
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<Budget | null>(null)
    const { deleteBudget } = useMonthlyBudget()

    const expenseCategories = categories.filter(
        (c) => c.type === 'expense' && !c.is_archived
    )

    const usedCategoryIds = new Set(budgets.map((b) => b.category_id))
    const availableCategories = expenseCategories.filter(
        (c) => !usedCategoryIds.has(c.id)
    )

    const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0)
    const totalSpent = budgets.reduce((sum, b) => {
        const spent = categorySpent.find((s) => s.category_id === b.category_id)
        return sum + (spent?.spent || 0)
    }, 0)
    const totalRemaining = totalBudget - totalSpent
    const totalPercent =
        totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0

    function openCreate() {
        setEditing(null)
        setOpen(true)
    }

    function openEdit(budget: Budget) {
        setEditing(budget)
        setOpen(true)
    }

    function closeForm() {
        setOpen(false)
        setEditing(null)
    }

    function handleDelete(budget: Budget) {
        const cat = categories.find((c) => c.id === budget.category_id)
        if (confirm(`Hapus budget "${cat?.name}"?`)) {
            deleteBudget(budget.id)
        }
    }

    const formContent = (
        <MonthlyBudgetForm
            profileId={profileId}
            month={month}
            categories={availableCategories}
            editingBudget={editing}
            editingCategory={categories.find((c) => c.id === editing?.category_id)}
            onSuccess={closeForm}
            onCancel={closeForm}
        />
    )

    return (
        <>
            <Card>
                <CardContent className="p-5 md:p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                            <h3 className="text-base font-semibold mb-0.5">Budget Bulanan</h3>
                            <p className="text-xs text-muted-foreground">
                                Batasan per kategori
                            </p>
                        </div>
                        <Button
                            onClick={openCreate}
                            size="sm"
                            disabled={availableCategories.length === 0 && !editing}
                        >
                            <Plus className="w-4 h-4" />
                            Tambah
                        </Button>
                    </div>

                    {/* Total Summary — compact */}
                    {budgets.length > 0 && (
                        <div className="mb-5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-brand/5 to-transparent">
                            <div className="flex items-baseline justify-between gap-3 mb-3">
                                <div>
                                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                        Terpakai
                                    </p>
                                    <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-white">
                                        {formatRupiah(totalSpent)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                        {totalRemaining >= 0 ? 'Sisa' : 'Over'}
                                    </p>
                                    <p
                                        className={cn(
                                            'text-xl font-bold tabular-nums',
                                            totalRemaining >= 0
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-red-600 dark:text-red-400'
                                        )}
                                    >
                                        {totalRemaining >= 0
                                            ? formatRupiah(totalRemaining)
                                            : `-${formatRupiah(Math.abs(totalRemaining))}`}
                                    </p>
                                </div>
                            </div>

                            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                                <div
                                    className={cn(
                                        'h-full rounded-full transition-all duration-500',
                                        (totalSpent / totalBudget) * 100 >= 100
                                            ? 'bg-red-500'
                                            : (totalSpent / totalBudget) * 100 >= 80
                                                ? 'bg-orange-500'
                                                : (totalSpent / totalBudget) * 100 >= 50
                                                    ? 'bg-amber-500'
                                                    : 'bg-emerald-500'
                                    )}
                                    style={{ width: `${totalPercent}%` }}
                                />
                            </div>

                            <div className="flex items-center justify-between mt-2">
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                    dari {formatRupiah(totalBudget)}
                                </p>
                                <p
                                    className={cn(
                                        'text-xs font-bold tabular-nums',
                                        (totalSpent / totalBudget) * 100 >= 100
                                            ? 'text-red-500'
                                            : (totalSpent / totalBudget) * 100 >= 80
                                                ? 'text-orange-500'
                                                : (totalSpent / totalBudget) * 100 >= 50
                                                    ? 'text-amber-500'
                                                    : 'text-emerald-500'
                                    )}
                                >
                                    {Math.round((totalSpent / totalBudget) * 100)}%
                                </p>
                            </div>
                        </div>
                    )}

                    {/* List */}
                    {budgets.length === 0 ? (
                        <EmptyState
                            icon={Target}
                            title="Belum ada budget bulanan"
                            description="Set batasan per kategori (Meals, Transport, dll)."
                            action={
                                <Button onClick={openCreate} variant="primary" size="sm">
                                    <Plus className="w-4 h-4" />
                                    Tambah Budget
                                </Button>
                            }
                        />
                    ) : (
                        <div className="space-y-2">
                            {budgets.map((budget) => {
                                const category = categories.find(
                                    (c) => c.id === budget.category_id
                                )
                                const Icon = getCategoryIcon(category?.icon || null)
                                const color = category?.color || '#334DAF'

                                const spent =
                                    categorySpent.find(
                                        (s) => s.category_id === budget.category_id
                                    )?.spent || 0
                                const amount = Number(budget.amount)
                                const remaining = amount - spent
                                const percent =
                                    amount > 0 ? Math.min(100, (spent / amount) * 100) : 0
                                const rawPercent = amount > 0 ? (spent / amount) * 100 : 0

                                return (
                                    <div
                                        key={budget.id}
                                        className="group rounded-2xl border border-slate-200 dark:border-white/10 p-4 hover:border-brand/30 dark:hover:border-brand/30 transition-all"
                                    >
                                        <div className="flex items-start gap-3 mb-3">
                                            {/* Icon */}
                                            <div
                                                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                                                style={{ backgroundColor: `${color}15` }}
                                            >
                                                <Icon className="w-5 h-5" style={{ color }} />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <p className="text-sm font-semibold truncate">
                                                        {category?.name || 'Tanpa nama'}
                                                    </p>
                                                    <p
                                                        className={cn(
                                                            'text-xs font-bold tabular-nums shrink-0',
                                                            rawPercent >= 100
                                                                ? 'text-red-500'
                                                                : rawPercent >= 80
                                                                    ? 'text-orange-500'
                                                                    : rawPercent >= 50
                                                                        ? 'text-amber-500'
                                                                        : 'text-emerald-500'
                                                        )}
                                                    >
                                                        {Math.round(rawPercent)}%
                                                    </p>
                                                </div>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                                                    <span className="font-semibold text-slate-900 dark:text-white">
                                                        {formatRupiah(spent)}
                                                    </span>
                                                    {' / '}
                                                    {formatRupiah(amount)}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        className="opacity-100 shrink-0 -mt-1 -mr-1"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="min-w-[160px]"
                                                >
                                                    <DropdownMenuItem
                                                        onSelect={() => openEdit(budget)}
                                                        className="whitespace-nowrap"
                                                    >
                                                        <Pencil className="w-4 h-4 mr-2 shrink-0" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onSelect={() => handleDelete(budget)}
                                                        className="text-red-600 focus:text-red-600 whitespace-nowrap"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2 shrink-0" />
                                                        Hapus
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="relative w-full h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden mb-2">
                                            <div
                                                className={cn(
                                                    'h-full rounded-full transition-all duration-500',
                                                    rawPercent >= 100
                                                        ? 'bg-red-500'
                                                        : rawPercent >= 80
                                                            ? 'bg-orange-500'
                                                            : rawPercent >= 50
                                                                ? 'bg-amber-500'
                                                                : 'bg-emerald-500'
                                                )}
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>

                                        {/* Sisa */}
                                        <div className="flex items-center justify-between">
                                            <p
                                                className={cn(
                                                    'text-[11px] font-medium tabular-nums',
                                                    remaining >= 0
                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                        : 'text-red-600 dark:text-red-400'
                                                )}
                                            >
                                                {remaining >= 0
                                                    ? `Sisa ${formatRupiah(remaining)}`
                                                    : `Over ${formatRupiah(Math.abs(remaining))}`}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Form */}
            {isMobile ? (
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle>
                                {editing ? 'Edit Budget' : 'Tambah Budget'}
                            </SheetTitle>
                            <SheetDescription>
                                {editing
                                    ? 'Update batasan budget kategori ini.'
                                    : 'Set batasan budget untuk kategori.'}
                            </SheetDescription>
                        </SheetHeader>
                        <div className="px-4 pb-6 pt-2">{formContent}</div>
                    </SheetContent>
                </Sheet>
            ) : (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {editing ? 'Edit Budget' : 'Tambah Budget'}
                            </DialogTitle>
                            <DialogDescription>
                                {editing
                                    ? 'Update batasan budget kategori ini.'
                                    : 'Set batasan budget untuk kategori.'}
                            </DialogDescription>
                        </DialogHeader>
                        {formContent}
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}