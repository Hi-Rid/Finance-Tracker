'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Loader2,
    Sparkles,
    Plus,
    Trash2,
    ArrowLeft,
    ArrowRight,
    Check,
    AlertTriangle,
    CheckCircle2,
    Wallet,
    PiggyBank,
    ShoppingBag,
    X,
    Lock,
    TrendingUp,
    Info,
} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Amount } from '@/components/ui/amount'
import { createClient } from '@/lib/supabase/client'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { formatRupiah } from '@/lib/normalize'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getCurrentMonth } from '@/lib/utils/month'

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    profileId: string
    month: string
    income: number
    onSuccess?: () => void
}

type ExpenseInput = {
    id: string
    name: string
    amount: number
}

type Bucket = 'needs' | 'wants' | 'savings'
type ExpenseType = 'fixed' | 'flexible'

type ExpenseResult = {
    original_name: string
    category_id: string
    category_name: string
    bucket: Bucket
    type: ExpenseType
    original_amount: number
    final_amount: number
    adjusted: boolean
    move_reason: string | null
    adjust_reason: string | null
}

type AIResult = {
    income: number
    baseline: { needs: number; wants: number; savings: number }
    expenses: ExpenseResult[]
    totals: Record<
        Bucket,
        { budget: number; original: number; actual: number }
    >
    over_budget: Record<Bucket, boolean>
    rebalance_notes: string[]
    blocked: boolean
    block_reason: string | null
}

const STEPS = [
    { num: 1, label: 'Income' },
    { num: 2, label: 'Pengeluaran' },
    { num: 3, label: 'Analisis AI' },
    { num: 4, label: 'Review' },
]

const BUCKET_META: Record<
    Bucket,
    { label: string; color: string; icon: any; emoji: string }
> = {
    needs: {
        label: 'Needs',
        color: '#334DAF',
        icon: Wallet,
        emoji: '🏠',
    },
    wants: {
        label: 'Wants',
        color: '#f59e0b',
        icon: ShoppingBag,
        emoji: '🎉',
    },
    savings: {
        label: 'Savings',
        color: '#10b981',
        icon: PiggyBank,
        emoji: '💰',
    },
}

function newId() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function AIBudgetWizard({
    open,
    onOpenChange,
    profileId,
    month,
    income,
    onSuccess,
}: Props) {
    const isMobile = useMediaQuery('(max-width: 767px)')
    const router = useRouter()
    const supabase = createClient()

    const [step, setStep] = useState(1)
    const [expenses, setExpenses] = useState<ExpenseInput[]>([
        { id: newId(), name: '', amount: 0 },
    ])
    const [analyzing, setAnalyzing] = useState(false)
    const [applying, setApplying] = useState(false)
    const [result, setResult] = useState<AIResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [errorDetail, setErrorDetail] = useState<string | null>(null)

    function handleOpenChange(nextOpen: boolean) {
        if (!nextOpen) {
            onOpenChange(false)
            setTimeout(() => {
                setStep(1)
                setExpenses([{ id: newId(), name: '', amount: 0 }])
                setResult(null)
                setError(null)
                setErrorDetail(null)
            }, 300)
        } else {
            onOpenChange(true)
        }
    }

    function addExpense() {
        setExpenses((prev) => [
            ...prev,
            { id: newId(), name: '', amount: 0 },
        ])
    }

    function updateExpense(id: string, patch: Partial<ExpenseInput>) {
        setExpenses((prev) =>
            prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
        )
    }

    function removeExpense(id: string) {
        setExpenses((prev) => prev.filter((e) => e.id !== id))
    }

    const validExpenses = expenses.filter((e) => e.name.trim().length > 0)
    const totalExpenses = validExpenses.reduce((s, e) => s + e.amount, 0)
    const flexibleCount = validExpenses.filter((e) => e.amount === 0).length

    async function runAnalysis() {
        setAnalyzing(true)
        setError(null)
        setErrorDetail(null)
        setStep(3)

        try {
            const res = await fetch('/api/budget/ai-allocate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    income,
                    expenses: validExpenses.map((e) => ({
                        name: e.name.trim(),
                        amount: e.amount,
                    })),
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Gagal analisis AI')
                setErrorDetail(data.detail || null)
                setAnalyzing(false)
                return
            }

            setResult(data)
            setAnalyzing(false)
        } catch (err: any) {
            setError(err?.message || 'Network error')
            setErrorDetail(String(err))
            setAnalyzing(false)
        }
    }

    async function applyBudget() {
        if (!result || result.blocked) return

        const currentMonth = getCurrentMonth()
        if (month < currentMonth) {
            toast.error('Gak bisa apply ke bulan yang udah lewat', {
                description:
                    'Pindah ke bulan ini atau bulan berikutnya dulu di month picker.',
            })
            return
        }

        setApplying(true)

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) {
                toast.error('Lu belum login')
                setApplying(false)
                return
            }

            const { error: periodErr } = await supabase
                .from('budget_periods')
                .upsert(
                    {
                        user_id: user.id,
                        profile_id: profileId,
                        month,
                        income: result.income,
                    },
                    { onConflict: 'profile_id,month' }
                )

            if (periodErr) {
                console.error('[apply] period failed:', periodErr)
            }

            const nameAgg = new Map<
                string,
                {
                    amount: number
                    category_id: string | null
                    buckets: Set<Bucket>
                }
            >()

            for (const e of result.expenses) {
                const key = e.original_name.trim()
                const existing = nameAgg.get(key)
                if (existing) {
                    existing.amount += e.final_amount
                    existing.buckets.add(e.bucket)
                } else {
                    nameAgg.set(key, {
                        amount: e.final_amount,
                        category_id: e.category_id || null,
                        buckets: new Set([e.bucket]),
                    })
                }
            }

            const budgetEntries = Array.from(nameAgg.entries()).map(
                ([name, { amount, category_id, buckets }]) => ({
                    user_id: user.id,
                    profile_id: profileId,
                    name,
                    category_id,
                    month,
                    amount,
                    currency: 'IDR',
                    note: `AI 50/30/20 (${Array.from(buckets).join(', ')})`,
                })
            )

            if (budgetEntries.length > 0) {
                const { error: budgetErr } = await supabase
                    .from('budgets')
                    .upsert(budgetEntries, {
                        onConflict: 'profile_id,name,month',
                    })

                if (budgetErr) {
                    console.error('[apply] budget failed:', budgetErr)
                    toast.error('Gagal simpan budget')
                    setApplying(false)
                    return
                }
            }

            toast.success('Budget 50/30/20 berhasil diterapkan!', {
                description: `${budgetEntries.length} kategori di-budget untuk bulan ini.`,
            })

            router.refresh()
            onSuccess?.()
            handleOpenChange(false)
        } catch (err: any) {
            console.error('[apply] failed:', err)
            toast.error('Terjadi kesalahan saat apply')
        } finally {
            setApplying(false)
        }
    }

    function next() {
        if (step === 2) {
            runAnalysis()
        } else {
            setStep((s) => Math.min(s + 1, 4))
        }
    }

    function prev() {
        setStep((s) => Math.max(s - 1, 1))
    }

    // ============ HEADER ============
    const headerSection = (
        <div className="px-4 md:px-6 pt-4 md:pt-5 pb-3 md:pb-3.5 border-b border-slate-200 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-2 md:gap-2.5 mb-3 md:mb-3.5">
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 md:w-4.5 md:h-4.5 text-brand" />
                </div>
                <div className="min-w-0">
                    <h2 className="text-sm md:text-base font-bold tracking-tight truncate">
                        AI Auto-Budgeting 50/30/20
                    </h2>
                    <p className="text-[10px] md:text-xs text-muted-foreground">
                        Step {step} dari 4 · {STEPS[step - 1].label}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-1.5">
                {STEPS.map((s, i) => {
                    const isActive = step === s.num
                    const isDone = step > s.num
                    return (
                        <div
                            key={s.num}
                            className="flex items-center gap-1.5 flex-1"
                        >
                            <div
                                className={cn(
                                    'w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold shrink-0 transition-colors',
                                    isActive
                                        ? 'bg-brand text-white shadow-sm shadow-brand/30'
                                        : isDone
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500'
                                )}
                            >
                                {isDone ? (
                                    <Check className="w-3 h-3" />
                                ) : (
                                    s.num
                                )}
                            </div>
                            <span
                                className={cn(
                                    'text-[10px] md:text-xs font-semibold hidden md:inline truncate',
                                    isActive
                                        ? 'text-brand'
                                        : isDone
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-slate-400 dark:text-slate-500'
                                )}
                            >
                                {s.label}
                            </span>
                            {i < STEPS.length - 1 && (
                                <div
                                    className={cn(
                                        'flex-1 h-0.5 rounded-full transition-colors',
                                        isDone
                                            ? 'bg-emerald-500/40'
                                            : 'bg-slate-200 dark:bg-white/10'
                                    )}
                                />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )

    // ============ FOOTER ============
    const footerSection = (
        <div className="px-4 md:px-6 py-3 md:py-3.5 border-t border-slate-200 dark:border-white/10 shrink-0 flex gap-2">
            {step > 1 && step !== 3 && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={prev}
                    disabled={applying}
                    className="flex-1 h-9 md:h-10 text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </Button>
            )}
            {step === 3 && !analyzing && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        setStep(2)
                        setResult(null)
                        setError(null)
                        setErrorDetail(null)
                    }}
                    className="flex-1 h-9 md:h-10 text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </Button>
            )}

            {step === 1 && (
                <Button
                    type="button"
                    onClick={next}
                    disabled={income <= 0}
                    className="flex-1 h-9 md:h-10 text-sm"
                >
                    Lanjut
                    <ArrowRight className="w-4 h-4" />
                </Button>
            )}

            {step === 2 && (
                <Button
                    type="button"
                    onClick={next}
                    disabled={validExpenses.length === 0}
                    className="flex-1 h-9 md:h-10 text-sm"
                >
                    <Sparkles className="w-4 h-4" />
                    Analisis dengan AI
                </Button>
            )}

            {step === 3 && !analyzing && result && (
                <Button
                    type="button"
                    onClick={() => setStep(4)}
                    className="flex-1 h-9 md:h-10 text-sm"
                >
                    Lihat Hasil
                    <ArrowRight className="w-4 h-4" />
                </Button>
            )}

            {step === 4 && (
                <Button
                    type="button"
                    onClick={applyBudget}
                    disabled={
                        applying ||
                        result?.blocked ||
                        month < getCurrentMonth()
                    }
                    className={cn(
                        'flex-1 h-9 md:h-10 text-sm',
                        month < getCurrentMonth()
                            ? 'bg-slate-300 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                            : result && !result.blocked
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                : 'bg-red-500 hover:bg-red-600 text-white'
                    )}
                >
                    {applying ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : result?.blocked ? (
                        <AlertTriangle className="w-4 h-4" />
                    ) : (
                        <CheckCircle2 className="w-4 h-4" />
                    )}
                    {applying
                        ? 'Menyimpan...'
                        : result?.blocked
                            ? 'Gak Bisa Apply - Over Budget'
                            : 'Terapkan ke Budget'}
                </Button>
            )}
        </div>
    )

    // ============ BODY ============
    const renderBody = () => {
        if (step === 1) {
            return (
                <div className="px-4 md:px-6 py-4 md:py-4">
                    <Step1Income income={income} month={month} />
                </div>
            )
        }

        if (step === 2) {
            return (
                <Step2Expenses
                    expenses={expenses}
                    totalExpenses={totalExpenses}
                    flexibleCount={flexibleCount}
                    income={income}
                    onAdd={addExpense}
                    onUpdate={updateExpense}
                    onRemove={removeExpense}
                />
            )
        }

        if (step === 3) {
            return (
                <div className="px-4 md:px-6 py-4 md:py-5">
                    <Step3Loading
                        analyzing={analyzing}
                        result={result}
                        error={error}
                        errorDetail={errorDetail}
                        onRetry={runAnalysis}
                    />
                </div>
            )
        }

        if (step === 4 && result) {
            return (
                <div className="px-4 md:px-6 py-3.5 md:py-4">
                    <Step4Review result={result} month={month} />
                </div>
            )
        }

        return null
    }

    const content = (
        <div className="flex flex-col min-h-0 max-h-[92vh]">
            {headerSection}
            <div className="min-h-0 overflow-y-auto">{renderBody()}</div>
            {footerSection}
        </div>
    )

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={handleOpenChange}>
                <SheetContent
                    side="bottom"
                    className="p-0 flex flex-col gap-0 overflow-hidden max-h-[92vh]"
                >
                    <SheetHeader className="sr-only">
                        <SheetTitle>AI Auto-Budgeting</SheetTitle>
                    </SheetHeader>
                    {content}
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="sm:max-w-2xl p-0 gap-0 flex flex-col overflow-hidden max-h-[92vh]"
                showCloseButton={false}
            >
                <DialogHeader className="sr-only">
                    <DialogTitle>AI Auto-Budgeting</DialogTitle>
                </DialogHeader>
                {content}
            </DialogContent>
        </Dialog>
    )
}

// ============================================================
// STEP 1
// ============================================================

function Step1Income({
    income,
    month,
}: {
    income: number
    month: string
}) {
    const [y, m] = month.split('-')
    const monthLabel = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(
        'id-ID',
        { month: 'long', year: 'numeric' }
    )

    const buckets = [
        { label: 'Needs', percent: 50, value: income * 0.5, color: '#334DAF' },
        { label: 'Wants', percent: 30, value: income * 0.3, color: '#f59e0b' },
        {
            label: 'Savings',
            percent: 20,
            value: income * 0.2,
            color: '#10b981',
        },
    ]

    return (
        <div className="space-y-3 md:space-y-3.5">
            <div>
                <p className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Income {monthLabel}
                </p>
                <Amount
                    value={income}
                    className="text-2xl md:text-4xl font-bold text-brand block"
                />
                <p className="text-[11px] md:text-sm text-muted-foreground mt-1.5 md:mt-2 leading-relaxed">
                    Income diambil dari budget bulan ini. Kalau mau ubah, edit
                    dulu di halaman Budget.
                </p>
            </div>

            <div className="pt-3 md:pt-3.5 border-t border-slate-200 dark:border-white/10">
                <p className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 md:mb-2.5">
                    Alokasi 50/30/20
                </p>
                <div className="space-y-1.5 md:space-y-2">
                    {buckets.map((b) => (
                        <div
                            key={b.label}
                            className="flex items-center gap-2.5 md:gap-3 p-2.5 md:p-3 rounded-lg md:rounded-xl border border-slate-200 dark:border-white/10"
                        >
                            <div
                                className="w-1 h-8 md:h-9 rounded-full shrink-0"
                                style={{ backgroundColor: b.color }}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-0.5 md:mb-1">
                                    <p className="text-xs md:text-sm font-bold">
                                        {b.label}
                                    </p>
                                    <span
                                        className="text-[10px] md:text-xs font-bold tabular-nums px-1.5 md:px-2 py-0.5 rounded"
                                        style={{
                                            color: b.color,
                                            backgroundColor: `${b.color}15`,
                                        }}
                                    >
                                        {b.percent}%
                                    </span>
                                </div>
                                <Amount
                                    value={b.value}
                                    className="text-[11px] md:text-sm text-muted-foreground font-medium"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ============================================================
// STEP 2
// ============================================================

function Step2Expenses({
    expenses,
    totalExpenses,
    flexibleCount,
    income,
    onAdd,
    onUpdate,
    onRemove,
}: {
    expenses: ExpenseInput[]
    totalExpenses: number
    flexibleCount: number
    income: number
    onAdd: () => void
    onUpdate: (id: string, patch: Partial<ExpenseInput>) => void
    onRemove: (id: string) => void
}) {
    const totalPercent = income > 0 ? (totalExpenses / income) * 100 : 0
    const overIncome = totalExpenses > income

    return (
        <div className="flex flex-col">
            <div className="px-4 md:px-6 pt-3 md:pt-3.5 pb-2.5 md:pb-3 border-b border-slate-100 dark:border-white/5">
                <p className="text-sm font-semibold mb-1">
                    Semua Pengeluaran Bulanan
                </p>
                <p className="text-[11px] md:text-xs text-muted-foreground leading-relaxed mb-2 md:mb-2.5">
                    Tulis <strong className="text-foreground">semua</strong>{' '}
                    pengeluaran lu. AI bakal pisahin mana Needs / Wants /
                    Savings.
                </p>
                <div className="rounded-lg bg-brand/[0.06] border border-brand/20 px-2.5 md:px-3 py-2 md:py-2.5 flex items-center gap-2 md:gap-2.5">
                    <Info className="w-4 h-4 md:w-5 md:h-5 text-brand shrink-0" />
                    <div className="text-[10px] md:text-[11px] leading-relaxed space-y-0.5 md:space-y-1 min-w-0">
                        <p className="text-slate-700 dark:text-slate-300">
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                ✓ Nominalnya PASTI
                            </span>{' '}
                            →{' '}
                            <span className="font-semibold text-slate-900 dark:text-white">
                                isi nominalnya
                            </span>
                        </p>
                        <p className="text-slate-700 dark:text-slate-300">
                            <span className="font-semibold text-amber-700 dark:text-amber-400">
                                ✗ Nominalnya GAK PASTI
                            </span>{' '}
                            →{' '}
                            <span className="font-semibold text-slate-900 dark:text-white">
                                kosongin aja
                            </span>
                            , AI yang tentuin
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-4 md:px-6 py-3 md:py-3.5 max-h-[360px] md:max-h-[420px] overflow-y-auto">
                <div className="space-y-1.5 md:space-y-2">
                    {expenses.map((e, idx) => (
                        <div
                            key={e.id}
                            className="rounded-lg md:rounded-xl border border-slate-200 dark:border-white/10 p-2 md:p-2.5 space-y-1.5 md:space-y-2"
                        >
                            <div className="flex items-center gap-1.5 md:gap-2">
                                <span className="text-[10px] font-bold text-slate-400 tabular-nums w-4 shrink-0 text-center">
                                    {idx + 1}
                                </span>
                                <Input
                                    placeholder="Nama pengeluaran"
                                    value={e.name}
                                    onChange={(ev) =>
                                        onUpdate(e.id, {
                                            name: ev.target.value,
                                        })
                                    }
                                    className="flex-1 h-8 md:h-9 text-xs md:text-sm"
                                />
                                {expenses.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() => onRemove(e.id)}
                                        className="text-slate-400 hover:text-red-500 shrink-0 h-8 w-8"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    </Button>
                                )}
                            </div>
                            <div className="relative pl-6">
                                <span className="absolute left-8 md:left-9 top-1/2 -translate-y-1/2 text-[10px] md:text-xs font-medium text-slate-400 pointer-events-none z-10">
                                    Rp
                                </span>
                                <CurrencyInput
                                    value={e.amount}
                                    onChange={(v) =>
                                        onUpdate(e.id, { amount: v })
                                    }
                                    placeholder="Kosongin kalau belum pasti"
                                    className="pl-9 h-8 md:h-9 text-xs md:text-sm"
                                />
                            </div>
                        </div>
                    ))}

                    <Button
                        type="button"
                        variant="outline"
                        onClick={onAdd}
                        className="w-full border-dashed h-8 md:h-9 text-xs md:text-sm"
                        size="sm"
                    >
                        <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        Tambah Pengeluaran
                    </Button>
                </div>
            </div>

            {totalExpenses > 0 && (
                <div className="px-4 md:px-6 py-2.5 md:py-3 border-t border-slate-100 dark:border-white/5">
                    <div
                        className={cn(
                            'rounded-lg md:rounded-xl p-2.5 md:p-3 border',
                            overIncome
                                ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
                                : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10'
                        )}
                    >
                        <div className="flex items-center justify-between gap-2 mb-0.5 md:mb-1">
                            <span
                                className={cn(
                                    'text-[10px] md:text-xs font-semibold uppercase tracking-wider',
                                    overIncome
                                        ? 'text-red-700 dark:text-red-400'
                                        : 'text-muted-foreground'
                                )}
                            >
                                Total Nominal Pasti
                            </span>
                            <span
                                className={cn(
                                    'text-[10px] md:text-xs font-bold tabular-nums',
                                    overIncome
                                        ? 'text-red-700 dark:text-red-400'
                                        : 'text-muted-foreground'
                                )}
                            >
                                {Math.round(totalPercent)}%
                            </span>
                        </div>
                        <Amount
                            value={totalExpenses}
                            className={cn(
                                'text-sm md:text-lg font-bold',
                                overIncome &&
                                'text-red-600 dark:text-red-400'
                            )}
                        />
                        {flexibleCount > 0 && (
                            <p className="text-[10px] md:text-xs text-muted-foreground mt-1 leading-relaxed">
                                + {flexibleCount} pengeluaran tanpa nominal -
                                AI bakal tentuin
                            </p>
                        )}
                        {overIncome && (
                            <div className="mt-1.5 md:mt-2 pt-1.5 md:pt-2 border-t border-red-200 dark:border-red-500/30 flex items-start gap-1.5 md:gap-2">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                                <p className="text-[10px] md:text-xs text-red-700 dark:text-red-400 leading-relaxed">
                                    Total nominal pasti lebih besar dari
                                    income. Coba kurangi dulu atau AI bakal
                                    block apply-nya.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

// ============================================================
// STEP 3
// ============================================================

function Step3Loading({
    analyzing,
    result,
    error,
    errorDetail,
    onRetry,
}: {
    analyzing: boolean
    result: AIResult | null
    error: string | null
    errorDetail: string | null
    onRetry: () => void
}) {
    if (analyzing) {
        return (
            <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-brand/10 flex items-center justify-center mb-3 md:mb-4">
                    <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-brand animate-pulse" />
                </div>
                <p className="text-sm font-semibold mb-1">
                    AI lagi mikir...
                </p>
                <p className="text-xs text-muted-foreground max-w-xs">
                    Menganalisis pengeluaran dan menyusun budget 50/30/20
                </p>
                <Loader2 className="w-5 h-5 text-brand animate-spin mt-4" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-6 md:py-8 text-center">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-3 md:mb-4">
                    <X className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
                </div>
                <p className="text-sm font-semibold mb-1">Analisis Gagal</p>
                <p className="text-xs md:text-sm text-muted-foreground max-w-sm mb-3">
                    {error}
                </p>
                {errorDetail && (
                    <div className="w-full max-w-md rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-2.5 mb-4 text-left">
                        <p className="text-[9px] md:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            Detail
                        </p>
                        <p className="text-[10px] md:text-[11px] font-mono text-slate-600 dark:text-slate-400 break-all leading-relaxed">
                            {errorDetail}
                        </p>
                    </div>
                )}
                <Button onClick={onRetry} variant="outline" size="sm" className="h-9">
                    Coba Lagi
                </Button>
            </div>
        )
    }

    if (result) {
        if (result.blocked) {
            return (
                <div className="flex flex-col items-center justify-center py-6 md:py-10 text-center">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-3 md:mb-4">
                        <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
                    </div>
                    <p className="text-sm md:text-base font-semibold mb-1">
                        Gak Bisa Apply
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground max-w-sm">
                        {result.block_reason ||
                            'Pengeluaran lu gak bisa masuk budget 50/30/20. Kurangi dulu pengeluaran atau ubah income.'}
                    </p>
                </div>
            )
        }

        return (
            <div className="flex flex-col items-center justify-center py-8 md:py-10 text-center">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3 md:mb-4">
                    <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-sm md:text-base font-semibold mb-1">
                    Analisis Selesai!
                </p>
                <p className="text-xs md:text-sm text-muted-foreground max-w-xs">
                    {result.expenses.length} pengeluaran udah diklasifikasi.
                    Klik &quot;Lihat Hasil&quot; buat review.
                </p>
            </div>
        )
    }

    return null
}

// ============================================================
// STEP 4
// ============================================================

function Step4Review({
    result,
    month,
}: {
    result: AIResult
    month: string
}) {
    const buckets: Bucket[] = ['needs', 'wants', 'savings']
    const hasRebalance = result.rebalance_notes.length > 0

    return (
        <div className="space-y-3 md:space-y-3.5">
            <div>
                <p className="text-sm md:text-base font-semibold mb-1">
                    Review Budget
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                    {result.blocked
                        ? 'Ada masalah yang perlu diperbaiki.'
                        : 'Klik "Terapkan" buat simpan ke budget bulan ini.'}
                </p>
            </div>

            {month < getCurrentMonth() && (
                <div className="rounded-lg md:rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-2.5 md:p-3 flex items-start gap-2 md:gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs md:text-sm font-bold text-amber-800 dark:text-amber-300 mb-0.5">
                            Bulan udah lewat
                        </p>
                        <p className="text-[11px] md:text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                            Lu lagi di bulan yang udah lewat. Gak bisa apply ke sini.
                            Pindah ke bulan ini atau bulan berikutnya dulu.
                        </p>
                    </div>
                </div>
            )}

            {result.blocked && (
                <div className="rounded-lg md:rounded-xl bg-red-50 dark:bg-red-500/10 border-2 border-red-300 dark:border-red-500/40 p-2.5 md:p-3.5">
                    <div className="flex items-start gap-2 md:gap-2.5">
                        <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs md:text-sm font-bold text-red-700 dark:text-red-300 mb-0.5 md:mb-1">
                                Gak bisa apply
                            </p>
                            <p className="text-[11px] md:text-xs text-red-700/80 dark:text-red-400/80 leading-relaxed">
                                {result.block_reason ||
                                    'Pengeluaran lu gak bisa disesuaikan ke 50/30/20. Kurangi pengeluaran variabel atau ubah income.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {hasRebalance && (
                <div className="rounded-lg md:rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 p-2.5 md:p-3 space-y-1 md:space-y-1.5">
                    <div className="flex items-center gap-2 mb-0.5 md:mb-1">
                        <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-[9px] md:text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                            Penyesuaian AI
                        </span>
                    </div>
                    {result.rebalance_notes.map((n, i) => (
                        <p
                            key={i}
                            className="text-[10px] md:text-xs text-blue-800 dark:text-blue-300 leading-relaxed pl-5 md:pl-6"
                        >
                            {n}
                        </p>
                    ))}
                </div>
            )}

            <div className="space-y-2 md:space-y-3">
                {buckets.map((b) => {
                    const meta = BUCKET_META[b]
                    const total = result.totals[b]
                    const items = result.expenses.filter(
                        (e) => e.bucket === b
                    )
                    const isOver = result.over_budget[b]

                    if (items.length === 0) return null

                    const totalFixed = items
                        .filter((e) => e.type === 'fixed')
                        .reduce((s, e) => s + e.final_amount, 0)
                    const filledItems = items.filter(
                        (e) =>
                            e.original_amount === 0 && e.final_amount > 0
                    )
                    const totalFilled = filledItems.reduce(
                        (s, e) => s + e.final_amount,
                        0
                    )

                    return (
                        <div
                            key={b}
                            className={cn(
                                'rounded-xl border overflow-hidden',
                                isOver
                                    ? 'border-red-300 dark:border-red-500/40'
                                    : 'border-slate-200 dark:border-white/10'
                            )}
                        >
                            <div
                                className="p-2.5 md:p-3 flex items-center justify-between gap-2"
                                style={{
                                    backgroundColor: `${meta.color}18`,
                                }}
                            >
                                <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                                    <span className="text-sm md:text-lg shrink-0">
                                        {meta.emoji}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-xs md:text-sm font-bold truncate">
                                            {meta.label}
                                        </p>
                                        <p className="text-[10px] md:text-xs text-muted-foreground tabular-nums">
                                            Budget:{' '}
                                            {formatRupiah(total.budget)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <Amount
                                        value={total.actual}
                                        className={cn(
                                            'text-xs md:text-base font-bold block',
                                            isOver &&
                                            'text-red-600 dark:text-red-400'
                                        )}
                                    />
                                    <p
                                        className={cn(
                                            'text-[10px] md:text-xs tabular-nums font-bold',
                                            isOver
                                                ? 'text-red-600 dark:text-red-400'
                                                : 'text-muted-foreground'
                                        )}
                                    >
                                        {Math.round(
                                            (total.actual / total.budget) *
                                            100
                                        )}
                                        %
                                    </p>
                                </div>
                            </div>

                            {isOver && (
                                <div className="px-2.5 md:px-3 py-1.5 md:py-2 bg-red-50 dark:bg-red-500/10 border-b border-red-200 dark:border-red-500/30 flex items-start gap-1.5 md:gap-2">
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                                    <p className="text-[10px] md:text-xs text-red-700 dark:text-red-300 leading-relaxed">
                                        Over{' '}
                                        <strong>
                                            {formatRupiah(
                                                total.actual - total.budget
                                            )}
                                        </strong>{' '}
                                        dari budget.
                                    </p>
                                </div>
                            )}

                            <div className="px-2.5 md:px-3 pt-2.5 md:pt-3">
                                <div className="w-full h-1 md:h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                                    <div
                                        className="h-full transition-all duration-500"
                                        style={{
                                            width: `${Math.min((total.actual / total.budget) * 100, 100)}%`,
                                            backgroundColor: isOver
                                                ? '#ef4444'
                                                : meta.color,
                                        }}
                                    />
                                </div>

                                <div className="flex flex-wrap items-center gap-x-2 md:gap-x-2.5 gap-y-1 md:gap-y-1.5 mt-2 md:mt-2.5 text-[10px] md:text-xs">
                                    {totalFixed > 0 && (
                                        <span className="text-muted-foreground">
                                            Fixed:{' '}
                                            <span className="font-semibold tabular-nums text-slate-600 dark:text-slate-400">
                                                {formatRupiah(totalFixed)}
                                            </span>
                                        </span>
                                    )}
                                    {filledItems.length > 0 && (
                                        <>
                                            {totalFixed > 0 && (
                                                <span className="text-muted-foreground/40">
                                                    ·
                                                </span>
                                            )}
                                            <span className="text-muted-foreground">
                                                AI alokasi{' '}
                                                <span className="font-semibold tabular-nums text-brand">
                                                    {formatRupiah(
                                                        totalFilled
                                                    )}
                                                </span>{' '}
                                                ke {filledItems.length}{' '}
                                                pengeluaran
                                            </span>
                                        </>
                                    )}
                                    <span className="inline-flex items-center gap-1 px-1.5 md:px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold text-[9px] md:text-[10px]">
                                        ✓ Terpakai 100%
                                    </span>
                                </div>
                            </div>

                            <div className="p-2.5 md:p-3 pt-2.5 md:pt-3 space-y-1 md:space-y-1.5">
                                {items.map((e, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            'rounded-md md:rounded-lg py-1.5 md:py-2 px-2 md:px-2.5 border',
                                            e.adjusted
                                                ? 'bg-amber-50/60 dark:bg-amber-500/5 border-amber-200/60 dark:border-amber-500/20'
                                                : 'bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/5'
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1 md:gap-1.5 min-w-0 flex-1">
                                                <span
                                                    className={cn(
                                                        'text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-1 md:px-1.5 py-0.5 rounded shrink-0 inline-flex items-center gap-0.5',
                                                        e.type === 'fixed'
                                                            ? 'bg-slate-200/80 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                                                            : 'bg-brand/10 text-brand'
                                                    )}
                                                >
                                                    {e.type === 'fixed' ? (
                                                        <>
                                                            <Lock className="w-2 h-2 md:w-2.5 md:h-2.5" />
                                                            Fixed
                                                        </>
                                                    ) : (
                                                        'Flexible'
                                                    )}
                                                </span>
                                                <span className="text-[11px] md:text-xs font-medium truncate">
                                                    {e.original_name}
                                                </span>
                                                {e.move_reason && (
                                                    <span className="text-[9px] md:text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase shrink-0">
                                                        → {e.bucket}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0">
                                                {e.adjusted ? (
                                                    <>
                                                        <Amount
                                                            value={
                                                                e.final_amount
                                                            }
                                                            className="text-[11px] md:text-xs font-bold text-amber-700 dark:text-amber-400 block leading-tight"
                                                        />
                                                        {e.original_amount >
                                                            0 && (
                                                                <span className="text-[9px] md:text-[10px] text-muted-foreground line-through tabular-nums">
                                                                    {formatRupiah(
                                                                        e.original_amount
                                                                    )}
                                                                </span>
                                                            )}
                                                    </>
                                                ) : (
                                                    <Amount
                                                        value={
                                                            e.original_amount
                                                        }
                                                        className="text-[11px] md:text-xs font-semibold tabular-nums"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        {e.move_reason && (
                                            <p className="text-[10px] md:text-[11px] text-purple-700 dark:text-purple-300 mt-1 md:mt-1.5 italic leading-relaxed flex items-start gap-1 md:gap-1.5">
                                                <TrendingUp className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0 mt-0.5" />
                                                {e.move_reason}
                                            </p>
                                        )}
                                        {e.adjust_reason && (
                                            <p className="text-[10px] md:text-[11px] text-amber-700 dark:text-amber-300 mt-1 md:mt-1.5 italic leading-relaxed flex items-start gap-1 md:gap-1.5">
                                                <Info className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0 mt-0.5" />
                                                {e.adjust_reason}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}