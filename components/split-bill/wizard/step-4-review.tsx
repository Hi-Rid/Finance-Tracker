'use client'

import { useState } from 'react'
import {
    Loader2,
    Receipt,
    Users,
    Building2,
    Wallet,
    ArrowRightLeft,
} from 'lucide-react'
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

    const participantItems = result.participants.map((p) => {
        const itemsForP = data.items
            .filter((it) => it.assigned_to.includes(p.temp_id))
            .map((it) => {
                const assigneeCount = it.assigned_to.length || 1
                const lineTotal = it.quantity * it.unit_price
                const shareAmount = lineTotal / assigneeCount
                return {
                    temp_id: it.temp_id,
                    name: it.name || 'Item',
                    quantity: it.quantity,
                    unit_price: it.unit_price,
                    assigneeCount,
                    share_amount: shareAmount,
                }
            })

        const itemsTotal = itemsForP.reduce((sum, it) => sum + it.share_amount, 0)

        return {
            ...p,
            items: itemsForP,
            items_total: itemsTotal,
        }
    })

    async function handleSave() {
        setSubmitting(true)
        const res = await createEvent(data, profileId)
        setSubmitting(false)
    }

    return (
        <div className="space-y-3 md:space-y-4">
            {/* Summary Card */}
            <div className="rounded-xl md:rounded-2xl border border-slate-200 dark:border-white/10 bg-card overflow-hidden">
                <div className="p-3.5 md:p-5 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-start gap-2.5 md:gap-3">
                        <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                            <Receipt className="w-4 h-4 md:w-5 md:h-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-sm md:text-base font-bold truncate">{data.name}</h3>
                            <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5">
                                {formatDateShortWIB(data.date)} · {data.participants.length}{' '}
                                peserta
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-3.5 md:px-5 py-3 md:py-4 space-y-1.5">
                    <div className="flex justify-between text-[11px] md:text-xs">
                        <span className="text-muted-foreground">Subtotal</span>
                        <Amount value={result.subtotal} className="text-[11px] md:text-xs" />
                    </div>
                    {result.ppn_amount > 0 && (
                        <div className="flex justify-between text-[11px] md:text-xs">
                            <span className="text-muted-foreground">
                                PPN {(data.ppn_rate * 100).toFixed(0)}%
                            </span>
                            <Amount value={result.ppn_amount} className="text-[11px] md:text-xs" />
                        </div>
                    )}
                    {result.service_amount > 0 && (
                        <div className="flex justify-between text-[11px] md:text-xs">
                            <span className="text-muted-foreground">
                                Service {(data.service_rate * 100).toFixed(0)}%
                            </span>
                            <Amount value={result.service_amount} className="text-[11px] md:text-xs" />
                        </div>
                    )}
                    {result.discount_amount > 0 && (
                        <div className="flex justify-between text-[11px] md:text-xs">
                            <span className="text-muted-foreground">Diskon</span>
                            <span className="flex items-center gap-0.5">
                                −
                                <Amount
                                    value={result.discount_amount}
                                    className="text-[11px] md:text-xs"
                                />
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-white/5">
                        <span className="text-xs md:text-sm font-bold">Grand Total</span>
                        <Amount
                            value={result.grand_total}
                            className="text-sm md:text-base font-bold text-brand"
                        />
                    </div>
                </div>
            </div>

            {/* Account / Payer info */}
            {result.payer_is_user ? (
                <div className="rounded-xl md:rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-3.5 md:p-5">
                    <div className="flex items-center gap-2 mb-2.5 md:mb-3">
                        <Building2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                        <p className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Sumber Dana
                        </p>
                    </div>
                    {selectedAccount ? (
                        <div className="flex items-center gap-2.5 md:gap-3">
                            <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                                <Wallet className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs md:text-sm font-semibold truncate">
                                    {selectedAccount.name}
                                </p>
                                <p className="text-[10px] md:text-[11px] text-muted-foreground flex items-center gap-1">
                                    <span>Saldo:</span>
                                    <Amount
                                        value={Number(selectedAccount.current_balance)}
                                        className="inline text-[10px] md:text-[11px] font-medium"
                                    />
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs md:text-sm text-red-500">Belum pilih akun</p>
                    )}
                </div>
            ) : (
                <div className="rounded-xl md:rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/5 p-3.5 md:p-5">
                    <div className="flex items-center gap-2 mb-2.5 md:mb-3">
                        <Wallet className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600 dark:text-amber-400" />
                        <p className="text-[10px] md:text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                            Sumber Dana
                        </p>
                    </div>
                    <p className="text-xs md:text-sm font-semibold mb-0.5 md:mb-1">
                        {result.payer_name} (talangin dulu)
                    </p>
                    <p className="text-[11px] md:text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                        Saldo lu gak akan berkurang. Lu bakal punya <strong>utang</strong>{' '}
                        ke {result.payer_name} sebesar share lu.
                    </p>
                </div>
            )}

            {/* Detail Per Orang */}
            <div className="rounded-xl md:rounded-2xl border border-slate-200 dark:border-white/10 bg-card overflow-hidden">
                <div className="px-3.5 md:px-5 py-2.5 md:py-3 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                        <p className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Detail Per Orang
                        </p>
                    </div>
                    <p className="text-[10px] md:text-xs text-muted-foreground">
                        {data.items.length} item
                    </p>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {participantItems.map((p) => (
                        <div
                            key={p.temp_id}
                            className={cn(
                                'p-3.5 md:p-5',
                                p.is_user && 'bg-brand/5 dark:bg-brand/10'
                            )}
                        >
                            <div className="flex items-start justify-between gap-3 mb-2.5 md:mb-4">
                                <div className="flex items-center gap-2 min-w-0">
                                    <p className="text-xs md:text-sm font-bold truncate">
                                        {p.display_name}
                                    </p>
                                    {p.is_user && (
                                        <span className="text-[9px] md:text-[10px] font-bold text-brand shrink-0">
                                            LU
                                        </span>
                                    )}
                                    {p.is_payer && (
                                        <span className="text-[9px] md:text-[10px] font-medium text-amber-600 dark:text-amber-400 shrink-0">
                                            · talangin
                                        </span>
                                    )}
                                </div>
                                <Amount
                                    value={p.total_share}
                                    className={cn(
                                        'text-base md:text-lg font-bold shrink-0',
                                        p.is_user
                                            ? 'text-brand'
                                            : 'text-slate-900 dark:text-white'
                                    )}
                                />
                            </div>

                            {p.items.length > 0 ? (
                                <div className="rounded-lg md:rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-2.5 md:p-3 mb-2.5 md:mb-3 space-y-1.5 md:space-y-2">
                                    {p.items.map((it) => (
                                        <div
                                            key={it.temp_id}
                                            className="flex items-start justify-between gap-2.5 md:gap-3 text-[11px] md:text-xs"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="text-slate-700 dark:text-slate-300 truncate">
                                                    {it.quantity}× {it.name}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
                                                    <Amount
                                                        value={it.unit_price}
                                                        className="inline text-[10px]"
                                                    />
                                                    {it.assigneeCount > 1 && (
                                                        <span>÷ {it.assigneeCount} orang</span>
                                                    )}
                                                </p>
                                            </div>
                                            <Amount
                                                value={it.share_amount}
                                                className="text-[11px] md:text-xs font-semibold text-slate-900 dark:text-white shrink-0"
                                            />
                                        </div>
                                    ))}
                                    <div className="flex justify-between pt-1.5 md:pt-2 border-t border-slate-200 dark:border-white/10">
                                        <span className="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Subtotal Item
                                        </span>
                                        <Amount
                                            value={p.items_total}
                                            className="text-[11px] md:text-xs font-bold text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[11px] md:text-xs text-muted-foreground italic mb-2.5 md:mb-3">
                                    Gak ada item di-assign
                                </p>
                            )}

                            <div className="space-y-1 md:space-y-1.5">
                                <div className="flex justify-between text-[11px] md:text-xs">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <Amount value={p.subtotal} className="text-[11px] md:text-xs font-medium" />
                                </div>
                                {p.ppn_share > 0 && (
                                    <div className="flex justify-between text-[11px] md:text-xs">
                                        <span className="text-muted-foreground">PPN</span>
                                        <Amount value={p.ppn_share} className="text-[11px] md:text-xs font-medium" />
                                    </div>
                                )}
                                {p.service_share > 0 && (
                                    <div className="flex justify-between text-[11px] md:text-xs">
                                        <span className="text-muted-foreground">Service</span>
                                        <Amount value={p.service_share} className="text-[11px] md:text-xs font-medium" />
                                    </div>
                                )}
                                {p.discount_share > 0 && (
                                    <div className="flex justify-between text-[11px] md:text-xs">
                                        <span className="text-muted-foreground">Diskon</span>
                                        <span className="flex items-center gap-0.5">
                                            −
                                            <Amount value={p.discount_share} className="text-[11px] md:text-xs font-medium" />
                                        </span>
                                    </div>
                                )}
                                <div
                                    className={cn(
                                        'flex justify-between pt-1.5 md:pt-2 border-t',
                                        p.is_user
                                            ? 'border-brand/20'
                                            : 'border-slate-100 dark:border-white/5'
                                    )}
                                >
                                    <span className="text-[11px] md:text-xs font-bold">Total</span>
                                    <Amount
                                        value={p.total_share}
                                        className={cn(
                                            'text-xs md:text-sm font-bold',
                                            p.is_user ? 'text-brand' : 'text-slate-900 dark:text-white'
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Receivables */}
            {result.payer_is_user && result.receivables.length > 0 && (
                <div className="rounded-xl md:rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/5 p-3.5 md:p-5">
                    <div className="flex items-center gap-2 mb-2.5 md:mb-3">
                        <ArrowRightLeft className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-600 dark:text-emerald-400" />
                        <p className="text-[10px] md:text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                            Piutang Lu
                        </p>
                    </div>

                    <div className="space-y-1.5 md:space-y-2">
                        {result.receivables.map((r) => (
                            <div
                                key={r.temp_id}
                                className="flex items-center justify-between text-xs md:text-sm gap-3"
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

                    <p className="text-[10px] md:text-[11px] text-emerald-700 dark:text-emerald-300 mt-2.5 md:mt-3 pt-2.5 md:pt-3 border-t border-emerald-200 dark:border-emerald-500/20 leading-relaxed">
                        Total piutang bakal otomatis tercatat di Debt tipe{' '}
                        <strong>Piutang</strong>. Bisa di-settle nanti dari halaman detail
                        event.
                    </p>
                </div>
            )}

            {/* Payable */}
            {!result.payer_is_user && result.user_payable > 0 && (
                <div className="rounded-xl md:rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50/60 dark:bg-red-500/5 p-3.5 md:p-5">
                    <div className="flex items-center gap-2 mb-2.5 md:mb-3">
                        <ArrowRightLeft className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-600 dark:text-red-400" />
                        <p className="text-[10px] md:text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-wider">
                            Utang Lu ke {result.payer_name}
                        </p>
                    </div>

                    <div className="flex items-center justify-between text-xs md:text-sm gap-3">
                        <span className="text-slate-700 dark:text-slate-300">
                            Share lu
                        </span>
                        <Amount
                            value={result.user_payable}
                            className="font-bold text-red-700 dark:text-red-300"
                        />
                    </div>

                    <p className="text-[10px] md:text-[11px] text-red-700 dark:text-red-300 mt-2.5 md:mt-3 pt-2.5 md:pt-3 border-t border-red-200 dark:border-red-500/20 leading-relaxed">
                        Bakal otomatis tercatat di Debt tipe <strong>Utang</strong>.
                    </p>
                </div>
            )}

            {/* Save Button */}
            <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={handleSave}
                disabled={submitting || !data.account_id}
                className="w-full h-11 md:h-12 text-sm md:text-base font-bold"
            >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Menyimpan...' : 'Simpan Split Bill'}
            </Button>
        </div>
    )
}