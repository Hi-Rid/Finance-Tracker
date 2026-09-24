'use client'

import { useState, useEffect } from 'react'
import { Wallet, TrendingUp, Pencil, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { CurrencyInput } from '@/components/ui/currency-input'
import { Label } from '@/components/ui/label'
import { useBudgetPeriod } from '@/lib/hooks/use-budget-period'
import { formatRupiah } from '@/lib/normalize'
import { formatMonthDisplay } from '@/lib/utils/month'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type BudgetPeriod = Database['public']['Tables']['budget_periods']['Row']
type DailyItem = Database['public']['Tables']['daily_budget_items']['Row']

type MonthSummaryCardProps = {
    profileId: string
    month: string
    period: BudgetPeriod | null
    dailyItems: DailyItem[]
}

export function MonthSummaryCard({
    profileId,
    month,
    period,
    dailyItems,
}: MonthSummaryCardProps) {
    const isMobile = useMediaQuery('(max-width: 767px)')
    const [open, setOpen] = useState(false)
    const [income, setIncome] = useState(period?.income ? Number(period.income) : 0)
    const [saving, setSaving] = useState(false)
    const { upsertPeriod } = useBudgetPeriod()

    useEffect(() => {
        setIncome(period?.income ? Number(period.income) : 0)
    }, [period])

    const activeItems = dailyItems.filter((i) => i.is_active)
    const totalDaily = activeItems.reduce((sum, i) => sum + Number(i.amount), 0)

    async function handleSave() {
        setSaving(true)
        const result = await upsertPeriod({ income }, profileId, month)
        setSaving(false)
        if (result.success) {
            setOpen(false)
        }
    }

    const formContent = (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Income Bulan Ini</Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 pointer-events-none">
                        Rp
                    </span>
                    <CurrencyInput
                        value={income}
                        onChange={setIncome}
                        placeholder="0"
                        className="pl-10 font-semibold h-12 text-lg"
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    Total pendapatan yang lu terima bulan ini
                </p>
            </div>

            <div className="flex gap-3 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="flex-1"
                >
                    Batal
                </Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Simpan
                </Button>
            </div>
        </div>
    )

    return (
        <>
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-3 mb-5">
                        <div>
                            <h3 className="text-base font-semibold mb-1">
                                Income & Alokasi
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {formatMonthDisplay(month)}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOpen(true)}
                        >
                            <Pencil className="w-3.5 h-3.5" />
                            {income > 0 ? 'Edit' : 'Set Income'}
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <StatBox
                            icon={Wallet}
                            label="Income"
                            value={formatRupiah(income)}
                            highlight
                        />
                        <StatBox
                            icon={TrendingUp}
                            label="Budget Harian × 30"
                            value={formatRupiah(totalDaily * 30)}
                        />
                    </div>

                    {income > 0 && totalDaily > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                            <div className="flex items-center justify-between text-xs mb-2">
                                <span className="text-muted-foreground">
                                    Alokasi daily budget
                                </span>
                                <span className="font-semibold tabular-nums">
                                    {Math.round((totalDaily * 30 / income) * 100)}%
                                </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                                <div
                                    className={cn(
                                        'h-full rounded-full transition-all',
                                        totalDaily * 30 > income
                                            ? 'bg-red-500'
                                            : 'bg-brand'
                                    )}
                                    style={{
                                        width: `${Math.min(100, (totalDaily * 30 / income) * 100)}%`,
                                    }}
                                />
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                                Sisa untuk budget bulanan:{' '}
                                <span className="font-semibold text-slate-900 dark:text-white">
                                    {formatRupiah(Math.max(0, income - totalDaily * 30))}
                                </span>
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Form */}
            {isMobile ? (
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle>Set Income</SheetTitle>
                            <SheetDescription>
                                Income bulan ini untuk {formatMonthDisplay(month)}
                            </SheetDescription>
                        </SheetHeader>
                        <div className="px-4 pb-6 pt-2">{formContent}</div>
                    </SheetContent>
                </Sheet>
            ) : (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Set Income</DialogTitle>
                            <DialogDescription>
                                Income bulan ini untuk {formatMonthDisplay(month)}
                            </DialogDescription>
                        </DialogHeader>
                        {formContent}
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}

function StatBox({
    icon: Icon,
    label,
    value,
    highlight = false,
}: {
    icon: any
    label: string
    value: string
    highlight?: boolean
}) {
    return (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-4">
            <div className="flex items-center gap-2 mb-2">
                <div
                    className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                        highlight
                            ? 'bg-brand/10 text-brand'
                            : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                    )}
                >
                    <Icon className="w-3.5 h-3.5" />
                </div>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {label}
                </p>
            </div>
            <p
                className={cn(
                    'text-lg font-bold tabular-nums',
                    highlight ? 'text-brand' : 'text-slate-900 dark:text-white'
                )}
            >
                {value}
            </p>
        </div>
    )
}