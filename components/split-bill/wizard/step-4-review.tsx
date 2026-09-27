'use client'

import { useState } from 'react'
import { Loader2, Receipt, Users, Building2, Wallet, ArrowRightLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Amount } from '@/components/ui/amount'
import { computeEventShares } from '@/lib/split-bill/calculator'
import { useEvents } from '@/lib/split-bill/use-events'
import { formatDateShortWIB } from '@/lib/utils/datetime'
import { cn } from '@/lib/utils'
import type { EventWizardData } from '@/lib/split-bill/types'
import type { Database } from '@/types/database'

type Account = Database['public']['Tables']['accounts']['Row']

type Step4ReviewProps = {
    data: EventWizardData
    accounts: Account[]
    profileId: string
}

export function Step4Review({ data, accounts, profileId }: Step4ReviewProps) {
    const { createEvent } = useEvents()
    const [submitting, setSubmitting] = useState(false)
    const result = computeEventShares(data)
    const selectedAccount = accounts.find((a) => a.id === data.account_id)

    async function handleSave() {
        setSubmitting(true)
        const res = await createEvent(data, profileId)
        setSubmitting(false)
        // If success, useEvents sudah redirect
    }

    return (
        <div className="space-y-4">
            {/* Summary Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-card overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                            <Receipt className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-base font-bold truncate">{data.name}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {formatDateShortWIB(data.date)} · {data.participants.length}{' '}
                                peserta
                            </p>
                        </div>
                    </div>
                </div>

                {/* Items summary */}
                <div className="px-5 py-3 border-b border-slate-100 dark:border-white/5">
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        {data.items.length} Item
                    </p>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {data.items.map((it) => (
                            <div
                                key={it.temp_id}
                                className="flex items-center justify-between text-xs gap-3"
                            >
                                <span className="text-slate-700 dark:text-slate-300 truncate flex-1">
                                    {it.quantity}× {it.name || 'Item'}
                                </span>
                                <Amount
                                    value={it.quantity * it.unit_price}
                                    className="text-xs font-medium shrink-0"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Total breakdown */}
                <div className="px-5 py-4 space-y-1.5">
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Subtotal</span>
                        <Amount value={result.subtotal} className="text-xs" />
                    </div>
                    {result.ppn_amount > 0 && (
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">PPN</span>
                            <Amount value={result.ppn_amount} className="text-xs" />
                        </div>
                    )}
                    {result.service_amount > 0 && (
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Service</span>
                            <Amount value={result.service_amount} className="text-xs" />
                        </div>
                    )}
                    {result.discount_amount > 0 && (
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Diskon</span>
                            <span className="flex items-center gap-0.5">
                                −
                                <Amount
                                    value={result.discount_amount}
                                    className="text-xs"
                                />
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-white/5">
                        <span className="text-sm font-bold">Grand Total</span>
                        <Amount
                            value={result.grand_total}
                            className="text-base font-bold text-brand"
                        />
                    </div>
                </div>
            </div>

            {/* Account info — hanya kalau user yang bayar */}
            {result.payer_is_user ? (
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Sumber Dana
                        </p>
                    </div>
                    {selectedAccount ? (
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center">
                                    <Wallet className="w-4 h-4 text-brand" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">{selectedAccount.name}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                        Saldo saat ini:{' '}
                                        <Amount
                                            value={Number(selectedAccount.current_balance)}
                                            className="inline text-[11px] font-medium"
                                        />
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-red-500">Belum pilih akun</p>
                    )}
                </div>
            ) : (
                <div className="rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/5 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                            Sumber Dana
                        </p>
                    </div>
                    <p className="text-sm font-semibold mb-1">
                        {result.payer_name} (talangin dulu)
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                        Saldo lu gak akan berkurang. Lu bakal punya <strong>utang</strong>{' '}
                        ke {result.payer_name} sebesar share lu.
                    </p>
                </div>
            )}

            {/* Per-participant breakdown */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-slate-400" />
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Pembagian per Orang
                    </p>
                </div>

                <div className="space-y-3">
                    {result.participants.map((p) => (
                        <div
                            key={p.temp_id}
                            className={cn(
                                'rounded-xl border p-3',
                                p.is_user
                                    ? 'bg-brand/5 border-brand/20'
                                    : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10'
                            )}
                        >
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <div>
                                    <p className="text-sm font-semibold">
                                        {p.display_name}
                                        {p.is_user && (
                                            <span className="ml-2 text-[10px] font-bold text-brand">
                                                LU
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <Amount
                                    value={p.total_share}
                                    className={cn(
                                        'text-base font-bold',
                                        p.is_user ? 'text-brand' : 'text-slate-900 dark:text-white'
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                                <div>
                                    <p className="uppercase tracking-wider">Subtotal</p>
                                    <Amount
                                        value={p.subtotal}
                                        className="text-[11px] font-medium text-slate-600 dark:text-slate-300"
                                    />
                                </div>
                                <div>
                                    <p className="uppercase tracking-wider">PPN+Svc</p>
                                    <Amount
                                        value={p.ppn_share + p.service_share}
                                        className="text-[11px] font-medium text-slate-600 dark:text-slate-300"
                                    />
                                </div>
                                <div>
                                    <p className="uppercase tracking-wider">Diskon</p>
                                    <span className="flex items-center gap-0.5">
                                        {p.discount_share > 0 && '−'}
                                        <Amount
                                            value={p.discount_share}
                                            className="text-[11px] font-medium text-slate-600 dark:text-slate-300"
                                        />
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Receivables (kalau user yang bayar) */}
            {result.payer_is_user && result.receivables.length > 0 && (
                <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/5 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <ArrowRightLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                            Piutang Lu
                        </p>
                    </div>

                    <div className="space-y-2">
                        {result.receivables.map((r) => (
                            <div
                                key={r.temp_id}
                                className="flex items-center justify-between text-sm gap-3"
                            >
                                <span className="text-slate-700 dark:text-slate-300">
                                    {r.display_name}
                                </span>
                                <Amount
                                    value={r.amount}
                                    className="font-bold text-emerald-700 dark:text-emerald-300"
                                />
                            </div>
                        ))}
                    </div>

                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-500/20">
                        Total piutang bakal otomatis tercatat di Debt tipe{' '}
                        <strong>Piutang</strong>. Bisa di-settle nanti.
                    </p>
                </div>
            )}

            {/* Payable (kalau user bukan payer) */}
            {!result.payer_is_user && result.user_payable > 0 && (
                <div className="rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50/60 dark:bg-red-500/5 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <ArrowRightLeft className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <p className="text-[10px] font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider">
                            Utang Lu ke {result.payer_name}
                        </p>
                    </div>

                    <div className="flex items-center justify-between text-sm gap-3">
                        <span className="text-slate-700 dark:text-slate-300">
                            Share lu
                        </span>
                        <Amount
                            value={result.user_payable}
                            className="font-bold text-red-700 dark:text-red-300"
                        />
                    </div>

                    <p className="text-[11px] text-red-700 dark:text-red-300 mt-3 pt-3 border-t border-red-200 dark:border-red-500/20">
                        Bakal otomatis tercatat di Debt tipe <strong>Utang</strong>.
                    </p>
                </div>
            )}

            {/* Action */}
            <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={handleSave}
                disabled={submitting || !data.account_id}
                className="w-full"
            >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Menyimpan...' : 'Simpan Split Bill'}
            </Button>
        </div>
    )
}