'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
    Loader2,
    Settings2,
    Info,
    Sparkles,
    Check,
    HelpCircle,
} from 'lucide-react'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CurrencyInput } from '@/components/ui/currency-input'
import { useFinancialFreedom } from '@/lib/hooks/use-financial-freedom'
import {
    fiSettingsSchema,
    FI_TYPES,
    FI_TYPE_LABELS,
    FI_TYPE_DESCRIPTIONS,
    FI_TYPE_EMOJI,
    getDefaultMultiplier,
    type FiType,
} from '@/lib/validators/financial-freedom'
import { cn } from '@/lib/utils'
import { formatRupiah } from '@/lib/normalize'
import type { FiSettings, FiServerData } from '@/lib/financial-freedom/types'

type Props = {
    profileId: string
    settings: FiSettings
    serverData: FiServerData
}

export function FiParameters({ profileId, settings, serverData }: Props) {
    const { updateSettings } = useFinancialFreedom()

    const form = useForm({
        resolver: zodResolver(fiSettingsSchema) as any,
        defaultValues: buildDefaults(settings),
    })

    const {
        watch,
        setValue,
        reset,
        formState: { isSubmitting, isDirty },
    } = form

    const fiType = watch('fi_type') as FiType
    const isCustom = fiType === 'custom'

    useEffect(() => {
        if (!isCustom) {
            const expected = getDefaultMultiplier(fiType)
            const current = watch('fi_multiplier')
            if (current !== expected) {
                setValue('fi_multiplier', expected, { shouldDirty: true })
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fiType])

    useEffect(() => {
        reset(buildDefaults(settings))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        settings.fi_type,
        settings.fi_multiplier,
        settings.monthly_expense_override,
        settings.monthly_income_override,
        settings.expected_return_rate,
        settings.inflation_rate,
        settings.current_age,
        settings.target_retire_age,
    ])

    async function onSubmit(data: any) {
        await updateSettings(profileId, data)
    }

    const autoExpense = serverData.avgExpense
    const autoIncome = serverData.income.value
    const incomeSource = serverData.income.source

    const incomeSourceLabel =
        incomeSource === 'budget'
            ? 'dari budget bulan ini'
            : incomeSource === 'transactions'
                ? 'dari avg 3 bulan transaksi'
                : 'belum ada data'

    return (
        <Card className="py-0 gap-0">
            <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="flex items-center gap-3 mb-5 md:mb-6">
                    <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                        <Settings2 className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                        <h2 className="text-lg md:text-xl font-bold tracking-tight">
                            Parameter FI
                        </h2>
                        <p className="text-xs md:text-sm text-muted-foreground">
                            Sesuaikan asumsi & target lu
                        </p>
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 md:space-y-6">
                        {/* FI TYPE */}
                        <FormField
                            control={form.control}
                            name="fi_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-semibold">
                                        Pilih Tipe FI
                                    </FormLabel>
                                    <FormControl>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-2.5">
                                            {FI_TYPES.map((t) => {
                                                const isActive = field.value === t
                                                return (
                                                    <button
                                                        key={t}
                                                        type="button"
                                                        onClick={() => field.onChange(t)}
                                                        className={cn(
                                                            'relative text-left rounded-xl sm:rounded-2xl border-2 p-3 sm:p-4 transition-all cursor-pointer',
                                                            'hover:scale-[1.02] active:scale-[0.98]',
                                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                                                            isActive
                                                                ? 'bg-brand/10 border-brand shadow-md shadow-brand/20'
                                                                : 'bg-card border-slate-200 dark:border-white/10 hover:border-brand/40 hover:bg-brand/[0.03]'
                                                        )}
                                                    >
                                                        <div
                                                            className={cn(
                                                                'absolute top-2.5 right-2.5 sm:top-3 sm:right-3 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all',
                                                                isActive
                                                                    ? 'bg-brand border-brand'
                                                                    : 'border-slate-300 dark:border-white/20'
                                                            )}
                                                        >
                                                            {isActive && (
                                                                <Check
                                                                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white"
                                                                    strokeWidth={3.5}
                                                                />
                                                            )}
                                                        </div>

                                                        <div className="text-xl sm:text-2xl leading-none mb-2 sm:mb-3">
                                                            {FI_TYPE_EMOJI[t]}
                                                        </div>
                                                        <p
                                                            className={cn(
                                                                'text-xs sm:text-sm font-bold leading-tight mb-1',
                                                                isActive && 'text-brand'
                                                            )}
                                                        >
                                                            {FI_TYPE_LABELS[t]}
                                                        </p>
                                                        <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-tight">
                                                            {FI_TYPE_DESCRIPTIONS[t]}
                                                        </p>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* MULTIPLIER */}
                        <FormField
                            control={form.control}
                            name="fi_multiplier"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Multiplier FI</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                inputMode="decimal"
                                                step="0.5"
                                                min="1"
                                                max="100"
                                                disabled={!isCustom}
                                                value={field.value || ''}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target.value === '' ? 0 : Number(e.target.value)
                                                    )
                                                }
                                                className="pr-12"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 pointer-events-none">
                                                ×
                                            </span>
                                        </div>
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        {isCustom
                                            ? 'Atur 1-100× sesuai kebutuhan lu'
                                            : `Auto dari tipe ${FI_TYPE_LABELS[fiType]}`}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* EXPENSE & INCOME */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            <FormField
                                control={form.control}
                                name="monthly_expense_override"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pengeluaran Bulanan</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 pointer-events-none z-10">
                                                    Rp
                                                </span>
                                                <CurrencyInput
                                                    value={field.value ?? 0}
                                                    onChange={(v) => field.onChange(v > 0 ? v : null)}
                                                    placeholder={
                                                        autoExpense > 0
                                                            ? `Auto: ${Math.round(autoExpense).toLocaleString('id-ID')}`
                                                            : 'Isi manual'
                                                    }
                                                    className="pl-9"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            {autoExpense > 0 ? (
                                                <>
                                                    Auto dari rata-rata 3 bulan:{' '}
                                                    <span className="font-semibold text-foreground">
                                                        {formatRupiah(autoExpense)}
                                                    </span>
                                                </>
                                            ) : (
                                                'Belum ada data transaksi, isi manual'
                                            )}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="monthly_income_override"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pendapatan Bulanan</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 pointer-events-none z-10">
                                                    Rp
                                                </span>
                                                <CurrencyInput
                                                    value={field.value ?? 0}
                                                    onChange={(v) => field.onChange(v > 0 ? v : null)}
                                                    placeholder={
                                                        autoIncome > 0
                                                            ? `Auto: ${Math.round(autoIncome).toLocaleString('id-ID')}`
                                                            : 'Isi manual'
                                                    }
                                                    className="pl-9"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            {autoIncome > 0 ? (
                                                <>
                                                    Auto {incomeSourceLabel}:{' '}
                                                    <span className="font-semibold text-foreground">
                                                        {formatRupiah(autoIncome)}
                                                    </span>
                                                </>
                                            ) : (
                                                'Belum ada data, isi manual'
                                            )}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* RETURN & INFLATION */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            <FormField
                                control={form.control}
                                name="expected_return_rate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Asumsi Return Investasi</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    inputMode="decimal"
                                                    step="0.5"
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
                                                    className="pr-10"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 pointer-events-none">
                                                    %
                                                </span>
                                            </div>
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            Return tahunan investasi (default 10%)
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="inflation_rate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Asumsi Inflasi</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    inputMode="decimal"
                                                    step="0.1"
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
                                                    className="pr-10"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 pointer-events-none">
                                                    %
                                                </span>
                                            </div>
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            Kenaikan harga tiap tahun (default 3%)
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* AGE */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            <FormField
                                control={form.control}
                                name="current_age"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Umur Sekarang</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                inputMode="numeric"
                                                min="0"
                                                max="120"
                                                placeholder="-"
                                                value={field.value ?? ''}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target.value === ''
                                                            ? null
                                                            : Number(e.target.value)
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            Buat unlock fitur Coast FI
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="target_retire_age"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Target Umur Berhenti Kerja</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                inputMode="numeric"
                                                min="0"
                                                max="120"
                                                placeholder="-"
                                                value={field.value ?? ''}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target.value === ''
                                                            ? null
                                                            : Number(e.target.value)
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            Opsional, buat hitung Coast FI
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* INFO + SUBMIT */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 md:gap-3 items-stretch">
                            <div className="md:col-span-2 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-3 md:p-5 flex items-center gap-2.5 md:gap-3">
                                <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-brand shrink-0" />
                                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Kosongin <strong>Pengeluaran Bulanan</strong> atau{' '}
                                    <strong>Pendapatan Bulanan</strong> kalau mau pakai angka
                                    auto. Isi manual kalau mau pakai angka lu sendiri.
                                </p>
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting || !isDirty}
                                size="lg"
                                className="h-full min-h-[56px] md:min-h-[72px] w-full text-sm md:text-base font-bold"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                                ) : (
                                    <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                                )}
                                {isDirty ? 'Simpan Parameter' : 'Sudah Tersimpan'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

function buildDefaults(settings: FiSettings) {
    return {
        fi_type: settings.fi_type,
        fi_multiplier: Number(settings.fi_multiplier),
        monthly_expense_override:
            settings.monthly_expense_override !== null
                ? Number(settings.monthly_expense_override)
                : null,
        monthly_income_override:
            settings.monthly_income_override !== null
                ? Number(settings.monthly_income_override)
                : null,
        expected_return_rate: Number(settings.expected_return_rate) * 100,
        inflation_rate: Number(settings.inflation_rate) * 100,
        current_age: settings.current_age,
        target_retire_age: settings.target_retire_age,
    }
}