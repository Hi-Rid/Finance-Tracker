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
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import { DailyItemForm } from './daily-item-form'
import { useDailyBudget } from '@/lib/hooks/use-daily-budget'
import { formatRupiah } from '@/lib/normalize'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type DailyItem = Database['public']['Tables']['daily_budget_items']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Budget = Database['public']['Tables']['budgets']['Row']

type DailyItemsListProps = {
    items: DailyItem[]
    categories: Category[]
    monthlyBudgets: Budget[]
    profileId: string
    month: string
}

export function DailyItemsList({
    items,
    categories,
    monthlyBudgets,
    profileId,
    month,
}: DailyItemsListProps) {
    const isMobile = useMediaQuery('(max-width: 767px)')
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<DailyItem | null>(null)
    const { deleteItem, toggleItem } = useDailyBudget()

    const activeItems = items.filter((i) => i.is_active)
    const totalDaily = activeItems.reduce((sum, i) => sum + Number(i.amount), 0)

    function openCreate() {
        setEditing(null)
        setOpen(true)
    }

    function openEdit(item: DailyItem) {
        setEditing(item)
        setOpen(true)
    }

    function closeForm() {
        setOpen(false)
        setEditing(null)
    }

    function handleDelete(item: DailyItem) {
        if (confirm(`Hapus item "${item.name}"?`)) {
            deleteItem(item.id)
        }
    }

    const formContent = (
        <DailyItemForm
            profileId={profileId}
            categories={categories}
            monthlyBudgets={monthlyBudgets}
            existingDailyItems={items}
            month={month}
            item={editing}
            onSuccess={closeForm}
            onCancel={closeForm}
        />
    )
    return (
        <>
            <Card>
                <CardContent className="pt-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-5">
                        <div>
                            <h3 className="text-base font-semibold mb-1">Daily Budget</h3>
                            <p className="text-xs text-muted-foreground">
                                Batasan pengeluaran per hari
                            </p>
                        </div>
                        <Button onClick={openCreate} size="sm">
                            <Plus className="w-4 h-4" />
                            Tambah
                        </Button>
                    </div>

                    {/* Total highlight */}
                    {activeItems.length > 0 && (
                        <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-brand/10 to-brand/5 border border-brand/20">
                            <p className="text-[10px] font-semibold text-brand uppercase tracking-wider mb-1">
                                Total Harian
                            </p>
                            <p className="text-2xl font-bold tabular-nums text-brand">
                                {formatRupiah(totalDaily)}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                {activeItems.length} item aktif
                            </p>
                        </div>
                    )}

                    {/* List */}
                    {items.length === 0 ? (
                        <EmptyState
                            icon={Target}
                            title="Belum ada item"
                            description="Tambah item pengeluaran harian (Sarapan, Transport, dll)."
                            action={
                                <Button onClick={openCreate} variant="primary" size="sm">
                                    <Plus className="w-4 h-4" />
                                    Tambah Item
                                </Button>
                            }
                        />
                    ) : (
                        <div className="space-y-1">
                            {items.map((item) => {
                                const category = categories.find((c) => c.id === item.category_id)

                                return (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            'group flex items-center gap-3 py-2.5 px-2 rounded-xl transition-colors',
                                            'hover:bg-slate-50 dark:hover:bg-white/5',
                                            !item.is_active && 'opacity-50'
                                        )}
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand/40 shrink-0 ml-1" />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium truncate">
                                                    {item.name}
                                                </p>
                                                {category && (
                                                    <Badge variant="default" className="text-[9px] px-1.5 py-0">
                                                        {category.name}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                                                {formatRupiah(Number(item.amount))}
                                            </p>
                                        </div>

                                        <Switch
                                            checked={item.is_active}
                                            onCheckedChange={(v) => toggleItem(item.id, v)}
                                            className="shrink-0"
                                        />

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="opacity-100 shrink-0"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEdit(item)}>
                                                    <Pencil className="w-4 h-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(item)}
                                                    className="text-red-600 focus:text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Hapus
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Form: Mobile Sheet / Desktop Dialog */}
            {isMobile ? (
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetContent
                        side="bottom"
                        className="max-h-[90vh] overflow-y-auto"
                    >
                        <SheetHeader>
                            <SheetTitle>
                                {editing ? 'Edit Item' : 'Tambah Item'}
                            </SheetTitle>
                            <SheetDescription>
                                {editing
                                    ? 'Update detail item harian.'
                                    : 'Bikin item pengeluaran harian baru.'}
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
                                {editing ? 'Edit Item' : 'Tambah Item'}
                            </DialogTitle>
                            <DialogDescription>
                                {editing
                                    ? 'Update detail item harian.'
                                    : 'Bikin item pengeluaran harian baru.'}
                            </DialogDescription>
                        </DialogHeader>
                        {formContent}
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}