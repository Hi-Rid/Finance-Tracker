'use client'

import { useMemo } from 'react'
import {
    Users,
    Layers,
    Pencil,
    Percent,
    Info,
    AlertTriangle,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Amount } from '@/components/ui/amount'
import { computeEventShares } from '@/lib/split-bill/calculator'
import { cn } from '@/lib/utils'
import type {
    EventWizardData,
    SplitMode,
    TaxDistribution,
} from '@/lib/split-bill/types'

type Step3SplitProps = {
    data: EventWizardData
    update: (partial: Partial<EventWizardData>) => void
}

const MODES: Array<{
    value: SplitMode
    label: string
    desc: string
    icon: any
}> = [
        {
            value: 'equal',
            label: 'Bagi Rata',
            desc: 'Subtotal dibagi rata ke semua peserta',
            icon: Users,
        },
        {
            value: 'per_item',
            label: 'Per Item',
            desc: 'Setiap item dihitung ke peserta yang dipilih',
            icon: Layers,
        },
        {
            value: 'custom',
            label: 'Custom Nominal',
            desc: 'Input total bayar per orang manual',
            icon: Pencil,
        },
        {
            value: 'percentage',
            label: 'Persentase',
            desc: 'Bagi proporsi berdasarkan % per orang',
            icon: Percent,
        },
    ]

export function Step3Split({ data, update }: Step3SplitProps) {
    const result = useMemo(() => computeEventShares(data), [data])

    function setMode(mode: SplitMode) {
        update({
            split: {
                ...data.split,
                mode,
                custom_amounts:
                    mode === 'custom'
                        ? data.split.custom_amounts || {}
                        : undefined,
                percentages:
                    mode === 'percentage'
                        ? data.split.percentages || {}
                        : undefined,
            },
        })
    }

    function setTaxDist(tax_distribution: TaxDistribution) {
        update({
            split: { ...data.split, tax_distribution },
        })
    }

    function setCustomAmount(tempId: string, value: number) {
        update({
            split: {
                ...data.split,
                custom_amounts: {
                    ...(data.split.custom_amounts || {}),
                    [tempId]: value,
                },
            },
        })
    }

    function setPercentage(tempId: string, value: number) {
        update({
            split: {
                ...data.split,
                percentages: {
                    ...(data.split.percentages || {}),
                    [tempId]: value,
                },
            },
        })
    }

    const mode = data.split.mode

    // Validation
    const customSum = Object.values(data.split.custom_amounts || {}).reduce(
        (a, b) => a + b,
        0
    )
    const percentSum = Object.values(data.split.percentages || {}).reduce(
        (a, b) => a + b,
        0
    )

    const customValid = Math.abs(customSum - result.grand_total) < 1
    const percentValid = Math.abs(percentSum - 100) < 0.01

    return (
        <div className="space-y-5">
            {/* ============ Mode ============ */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Mode Split
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {MODES.map((m) => {
                        const Icon = m.icon
                        const isActive = mode === m.value
                        return (
                            <button
                                key={m.value}
                                type="button"
                                onClick={() => setMode(m.value)}
                                className={cn(
                                    'text-left p-3.5 rounded-xl border transition-all cursor-pointer',
                                    isActive
                                        ? 'bg-brand/5 border-brand/40 shadow-sm'
                                        : 'bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/10 hover:border-brand/30'
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={cn(
                                            'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                                            isActive
                                                ? 'bg-brand text-white'
                                                : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                                        )}
                                    >
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p
                                            className={cn(
                                                'text-sm font-semibold mb-0.5',
                                                isActive && 'text-brand'
                                            )}
                                        >
                                            {m.label}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground leading-snug">
                                            {m.desc}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ============ Tax Distribution ============ */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Distribusi PPN & Service
                </p>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setTaxDist('proportional')}
                        className={cn(
                            'p-3 rounded-xl border text-left transition-all cursor-pointer',
                            data.split.tax_distribution === 'proportional'
                                ? 'bg-brand/5 border-brand/40'
                                : 'bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/10'
                        )}
                    >
                        <p className="text-xs font-semibold mb-0.5">Proporsional</p>
                        <p className="text-[10px] text-muted-foreground leading-snug">
                            Pajak dibagi sesuai porsi subtotal masing-masing
                        </p>
                    </button>
                    <button
                        type="button"
                        onClick={() => setTaxDist('equal')}
                        className={cn(
                            'p-3 rounded-xl border text-left transition-all cursor-pointer',
                            data.split.tax_distribution === 'equal'
                                ? 'bg-brand/5 border-brand/40'
                                : 'bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/10'
                        )}
                    >
                        <p className="text-xs font-semibold mb-0.5">Bagi Rata</p>
                        <p className="text-[10px] text-muted-foreground leading-snug">
                            Pajak dibagi rata ke semua peserta
                        </p>
                    </button>
                </div>
            </div>

            {/* ============ Custom / Percentage Editor ============ */}
            {mode === 'custom' && (
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                Nominal Per Orang
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Total harus sama dengan grand total
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-muted-foreground">Total</p>
                            <Amount
                                value={customSum}
                                className={cn(
                                    'text-sm font-bold',
                                    customValid ? 'text-emerald-600' : 'text-red-500'
                                )}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        {result.participants.map((p) => (
                            <div
                                key={p.temp_id}
                                className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02]"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {p.display_name}
                                        {p.is_user && (
                                            <span className="ml-1.5 text-[10px] font-semibold text-brand">
                                                LU
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div className="w-32 shrink-0">
                                    <CurrencyInput
                                        value={data.split.custom_amounts?.[p.temp_id] || 0}
                                        onChange={(v) => setCustomAmount(p.temp_id, v)}
                                        placeholder="0"
                                        className="h-9 text-sm"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {!customValid && (
                        <div className="mt-3 flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>
                                Selisih{' '}
                                <Amount
                                    value={Math.abs(result.grand_total - customSum)}
                                    className="inline text-xs font-bold"
                                />{' '}
                                dari grand total
                            </span>
                        </div>
                    )}
                </div>
            )}

            {mode === 'percentage' && (
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                Persentase Per Orang
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Total harus 100%
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-muted-foreground">Total</p>
                            <p
                                className={cn(
                                    'text-sm font-bold tabular-nums',
                                    percentValid ? 'text-emerald-600' : 'text-red-500'
                                )}
                            >
                                {percentSum.toFixed(1)}%
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {result.participants.map((p) => (
                            <div
                                key={p.temp_id}
                                className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02]"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {p.display_name}
                                        {p.is_user && (
                                            <span className="ml-1.5 text-[10px] font-semibold text-brand">
                                                LU
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div className="w-24 shrink-0 relative">
                                    <Input
                                        type="number"
                                        inputMode="decimal"
                                        value={data.split.percentages?.[p.temp_id] || ''}
                                        onChange={(e) =>
                                            setPercentage(
                                                p.temp_id,
                                                e.target.value === '' ? 0 : Number(e.target.value)
                                            )
                                        }
                                        placeholder="0"
                                        className="h-9 text-sm pr-7"
                                    />
                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                                        %
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {!percentValid && (
                        <div className="mt-3 flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>Total persentase harus 100%</span>
                        </div>
                    )}
                </div>
            )}

            {/* ============ Preview ============ */}
            <div className="rounded-2xl border border-brand/20 bg-brand/5 p-5">
                <p className="text-[10px] font-semibold text-brand uppercase tracking-wider mb-3">
                    Preview Split
                </p>

                <div className="space-y-2 mb-4">
                    {result.participants.map((p) => (
                        <div
                            key={p.temp_id}
                            className="flex items-center justify-between gap-3 text-sm"
                        >
                            <span className="font-medium truncate">
                                {p.display_name}
                                {p.is_user && (
                                    <span className="ml-1.5 text-[10px] font-semibold text-brand">
                                        LU
                                    </span>
                                )}
                            </span>
                            <Amount
                                value={p.total_share}
                                className="font-bold text-slate-900 dark:text-white shrink-0"
                            />
                        </div>
                    ))}
                </div>

                <div className="pt-3 border-t border-brand/20 space-y-1 text-xs">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <Amount
                            value={result.subtotal}
                            className="text-xs font-medium"
                        />
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">PPN</span>
                        <Amount
                            value={result.ppn_amount}
                            className="text-xs font-medium"
                        />
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Service</span>
                        <Amount
                            value={result.service_amount}
                            className="text-xs font-medium"
                        />
                    </div>
                    {result.discount_amount > 0 && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Diskon</span>
                            <span className="flex items-center gap-0.5 text-xs font-medium">
                                −
                                <Amount
                                    value={result.discount_amount}
                                    className="text-xs font-medium"
                                />
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-brand/20">
                        <span className="font-semibold text-brand">Grand Total</span>
                        <Amount
                            value={result.grand_total}
                            className="text-sm font-bold text-brand"
                        />
                    </div>
                </div>
            </div>

            {/* Info */}
            {mode === 'per_item' && (
                <div className="rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-3 flex gap-2">
                    <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Mode per-item pakai assignment yang di-set di Step 2. Balik ke
                        Step 2 kalau mau ubah assignment.
                    </p>
                </div>
            )}
        </div>
    )
}