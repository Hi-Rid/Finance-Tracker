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
import { Amount } from '@/components/ui/amount'
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
import { useConfirmDialog } from '@/components/ui/confirm-dialog'
import { useMonthlyBudget } from '@/lib/hooks/use-monthly-budget'
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
    const { confirm, Dialog: ConfirmDialog } = useConfirmDialog()

    const expenseCategories = categories.filter(
        (c) => c.type === 'expense' && !c.is_archived
    )

    const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0)
    const totalSpent = budgets.reduce((sum, b) => {
        if (!b.category_id) return sum
        const spent = categorySpent.find(
            (s) => s.category_id === b.category_id
        )
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
        confirm({
            title: `Hapus "${budget.name}"?`,
            description:
                'Budget ini bakal dihapus dari bulan ini. Bisa dibuat ulang kapan aja.',
            confirmLabel: 'Hapus',
            cancelLabel: 'Batal',
            variant: 'destructive',
            onConfirm: async () => {
                await deleteBudget(budget.id)
            },
        })
    }

    const formContent = (
        <MonthlyBudgetForm
            profileId={profileId}
            month={month}
            categories={expenseCategories}
            editingBudget={editing}
            onSuccess={closeForm}
            onCancel={closeForm}
        />
    )

    return (
        <>
            <Card className="py-0 gap-0">
                <CardContent className="p-4 md:p-5">
                    <div className="flex items-start justify-between gap-3 mb-3 md:mb-4">
                        <div>
                            <h3 className="text-sm md:text-base font-semibold mb-0.5">
                                Budget Bulanan
                            </h3>
                            <p className="text-[11px] md:text-xs text-muted-foreground">
                                Batasan per pengeluaran
                            </p>
                        </div>
                        <Button
                            onClick={openCreate}
                            size="sm"
                            className="h-7 md:h-8 text-[11px] md:text-xs"
                        >
                            <Plus className="w-3 h-3 md:w-3.5 md:h-3.5" />
                            Tambah
                        </Button>
                    </div>

                    {budgets.length > 0 && (
                        <div className="mb-3 md:mb-4 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-brand/5 to-transparent">
                            <div className="flex items-baseline justify-between gap-3 mb-2.5 md:mb-3">
                                <div className="min-w-0">
                                    <p className="text-[9px] md:text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5 md:mb-1">
                                        Terpakai
                                    </p>
                                    <Amount
                                        value={totalSpent}
                                        className="text-base md:text-xl font-bold text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div className="text-right min-w-0">
                                    <p className="text-[9px] md:text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5 md:mb-1">
                                        {totalRemaining >= 0 ? 'Sisa' : 'Over'}
                                    </p>
                                    <Amount
                                        value={Math.abs(totalRemaining)}
                                        sign={
                                            totalRemaining >= 0
                                                ? 'none'
                                                : 'negative'
                                        }
                                        className={cn(
                                            'text-base md:text-xl font-bold',
                                            totalRemaining >= 0
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-red-600 dark:text-red-400'
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="w-full h-1.5 md:h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
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

                            <div className="flex items-center justify-between mt-1.5 md:mt-2">
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 flex-wrap">
                                    <span>dari</span>
                                    <Amount
                                        value={totalBudget}
                                        className="inline text-[10px] font-medium"
                                    />
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
                                    {Math.round(
                                        (totalSpent / totalBudget) * 100
                                    )}
                                    %
                                </p>
                            </div>
                        </div>
                    )}

                    {budgets.length === 0 ? (
                        <EmptyState
                            icon={Target}
                            title="Belum ada budget bulanan"
                            description="Set batasan per pengeluaran (Kost, Makan, Netflix, dll)."
                            action={
                                <Button
                                    onClick={openCreate}
                                    variant="primary"
                                    size="sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    Tambah Budget
                                </Button>
                            }
                        />
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-3">
                            {budgets.map((budget) => {
                                const category = budget.category_id
                                    ? categories.find(
                                        (c) => c.id === budget.category_id
                                    )
                                    : null
                                const Icon = getCategoryIcon(
                                    category?.icon || null
                                )
                                const color = category?.color || '#334DAF'

                                const spent = budget.category_id
                                    ? categorySpent.find(
                                        (s) =>
                                            s.category_id ===
                                            budget.category_id
                                    )?.spent || 0
                                    : 0
                                const amount = Number(budget.amount)
                                const remaining = amount - spent
                                const percent =
                                    amount > 0
                                        ? Math.min(100, (spent / amount) * 100)
                                        : 0
                                const rawPercent =
                                    amount > 0 ? (spent / amount) * 100 : 0

                                return (
                                    <div
                                        key={budget.id}
                                        className="group rounded-xl md:rounded-2xl border border-slate-200 dark:border-white/10 p-2.5 md:p-4 hover:border-brand/30 dark:hover:border-brand/30 transition-all"
                                    >
                                        <div className="flex items-start gap-2 md:gap-3 mb-2 md:mb-3">
                                            <div
                                                className="w-7 h-7 md:w-11 md:h-11 rounded-lg md:rounded-xl flex items-center justify-center shrink-0"
                                                style={{
                                                    backgroundColor: `${color}15`,
                                                }}
                                            >
                                                <Icon
                                                    className="w-3.5 h-3.5 md:w-5 md:h-5"
                                                    style={{ color }}
                                                />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-1 md:gap-2 mb-0.5">
                                                    <p className="text-[11px] md:text-sm font-semibold truncate">
                                                        {budget.name}
                                                    </p>
                                                    <p
                                                        className={cn(
                                                            'text-[10px] md:text-xs font-bold tabular-nums shrink-0',
                                                            rawPercent >= 100
                                                                ? 'text-red-500'
                                                                : rawPercent >= 80
                                                                    ? 'text-orange-500'
                                                                    : rawPercent >= 50
                                                                        ? 'text-amber-500'
                                                                        : 'text-emerald-500'
                                                        )}
                                                    >
                                                        {Math.round(rawPercent)}
                                                        %
                                                    </p>
                                                </div>
                                                {category && (
                                                    <p className="hidden md:block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                                                        {category.name}
                                                    </p>
                                                )}
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        className="opacity-100 shrink-0 -mt-1 -mr-1 h-6 w-6 md:h-8 md:w-8"
                                                    >
                                                        <MoreVertical className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="min-w-[160px]"
                                                >
                                                    <DropdownMenuItem
                                                        onSelect={() =>
                                                            openEdit(budget)
                                                        }
                                                        className="whitespace-nowrap"
                                                    >
                                                        <Pencil className="w-4 h-4 mr-2 shrink-0" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onSelect={() =>
                                                            handleDelete(
                                                                budget
                                                            )
                                                        }
                                                        className="text-red-600 focus:text-red-600 whitespace-nowrap"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2 shrink-0" />
                                                        Hapus
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div className="flex items-baseline gap-1 text-[10px] md:text-[11px] tabular-nums flex-wrap mb-2 md:mb-3">
                                            <Amount
                                                value={spent}
                                                className="font-semibold text-slate-900 dark:text-white"
                                            />
                                            <span className="text-slate-400">
                                                /
                                            </span>
                                            <Amount
                                                value={amount}
                                                className="font-medium text-slate-500 dark:text-slate-400"
                                            />
                                        </div>

                                        {category && (
                                            <>
                                                <div className="w-full h-1.5 md:h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
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
                                                        style={{
                                                            width: `${percent}%`,
                                                        }}
                                                    />
                                                </div>

                                                <p
                                                    className={cn(
                                                        'hidden md:flex items-center gap-1 mt-2 text-[11px] font-medium',
                                                        remaining >= 0
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : 'text-red-600 dark:text-red-400'
                                                    )}
                                                >
                                                    {remaining >= 0
                                                        ? 'Sisa'
                                                        : 'Over'}
                                                    <Amount
                                                        value={Math.abs(
                                                            remaining
                                                        )}
                                                        className="inline"
                                                    />
                                                </p>
                                            </>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {isMobile ? (
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetContent
                        side="bottom"
                        className="max-h-[90vh] overflow-y-auto"
                    >
                        <SheetHeader>
                            <SheetTitle>
                                {editing ? 'Edit Budget' : 'Tambah Budget'}
                            </SheetTitle>
                            <SheetDescription>
                                {editing
                                    ? 'Update detail budget ini.'
                                    : 'Bikin budget baru buat pengeluaran tertentu.'}
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
                                    ? 'Update detail budget ini.'
                                    : 'Bikin budget baru buat pengeluaran tertentu.'}
                            </DialogDescription>
                        </DialogHeader>
                        {formContent}
                    </DialogContent>
                </Dialog>
            )}

            <ConfirmDialog />
        </>
    )
}