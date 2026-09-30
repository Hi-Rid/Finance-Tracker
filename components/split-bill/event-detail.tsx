'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
    ArrowLeft,
    Users,
    Receipt,
    CheckCircle2,
    Clock,
    Trash2,
    Share2,
    Wallet,
    FileText,
    Utensils,
    Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Amount } from '@/components/ui/amount'
import { HideAmountsButton } from '@/components/shared/hide-amounts-button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ShareModal } from './share-modal'
import { SettleModal } from './settle-modal'
import { useEvents } from '@/lib/split-bill/use-events'
import { formatDateLongWIB, formatTimeWIB } from '@/lib/utils/datetime'
import { cn } from '@/lib/utils'
import type { EventDetailData } from '@/lib/split-bill/actions'
import type { Database } from '@/types/database'

type Account = Database['public']['Tables']['accounts']['Row']

type EventDetailProps = {
    data: EventDetailData
    accounts: Account[]
}

type SettleTarget = {
    participantId: string
    participantName: string
    amount: number
    isIncome: boolean
}

export function EventDetail({ data, accounts }: EventDetailProps) {
    const {
        event,
        items,
        participants,
        itemShares,
        receipts,
        debts,
        account,
        group,
        payer_participant,
    } = data

    const { deleteEvent } = useEvents()
    const [shareOpen, setShareOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [settleTarget, setSettleTarget] = useState<SettleTarget | null>(null)

    const userParticipant = participants.find((p: any) => p.is_user)
    const payerIsUser = event.payer_is_user
    const totalPaidCount = participants.filter((p: any) => p.paid).length
    const allSettled = totalPaidCount === participants.length

    const breakdown = useMemo(() => {
        return participants.map((p: any) => {
            const shares = itemShares.filter((s: any) => s.participant_id === p.id)
            const pItems = shares.map((s: any) => {
                const item = items.find((i: any) => i.id === s.item_id)
                return {
                    name: item?.name || 'Item',
                    quantity: item?.quantity || 1,
                    share_amount: Number(s.share_amount),
                }
            })
            return {
                participant_id: p.id,
                display_name: p.display_name,
                is_user: p.is_user,
                is_payer: p.id === event.payer_participant_id,
                paid: p.paid,
                items: pItems,
                items_total: pItems.reduce(
                    (sum: number, it: any) => sum + it.share_amount,
                    0
                ),
                grand_total_share: Number(p.total_share),
            }
        })
    }, [participants, itemShares, items, event.payer_participant_id])

    async function handleDelete() {
        const res = await deleteEvent(event.id)
        if (res.success) {
            window.location.href = '/split-bill'
        }
    }

    function canSettleParticipant(p: any): boolean {
        if (p.paid) return false
        if (payerIsUser && !p.is_user) return true
        if (!payerIsUser && p.is_user) return true
        return false
    }

    function openSettle(p: any) {
        const isIncome = payerIsUser && !p.is_user
        setSettleTarget({
            participantId: p.id,
            participantName: p.display_name,
            amount: Number(p.total_share),
            isIncome,
        })
    }

    return (
        <>
            <div className="space-y-3 md:space-y-5">
                {/* Top bar */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-muted-foreground hover:text-foreground -ml-2 h-8 md:h-9 text-xs md:text-sm"
                    >
                        <Link href="/split-bill">
                            <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            Split Bill
                        </Link>
                    </Button>

                    <div className="flex items-center gap-1 md:gap-1.5">
                        <HideAmountsButton size="icon-sm" />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShareOpen(true)}
                            className="h-8 md:h-9 text-xs md:text-sm px-2 md:px-3"
                        >
                            <Share2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Share</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeleteOpen(true)}
                            className="text-slate-400 hover:text-red-500 h-8 w-8 md:h-9 md:w-9"
                        >
                            <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </Button>
                    </div>
                </div>

                {/* Hero */}
                <div className="relative rounded-xl md:rounded-2xl border border-slate-200 dark:border-white/10 bg-card overflow-hidden shadow-sm">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500" />
                    <div className="p-3.5 md:p-5 pl-4 md:pl-6">
                        <div className="flex items-start gap-2.5 md:gap-3 mb-3 md:mb-4">
                            <div
                                className={cn(
                                    'w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-2xl flex items-center justify-center shrink-0',
                                    allSettled
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                        : 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                                )}
                            >
                                {allSettled ? (
                                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
                                ) : (
                                    <Clock className="w-4 h-4 md:w-5 md:h-5" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-base md:text-2xl font-bold tracking-tight truncate">
                                    {event.name}
                                </h1>
                                <div className="flex items-center gap-1.5 md:gap-2 mt-0.5 md:mt-1 text-[10px] md:text-xs text-muted-foreground flex-wrap">
                                    <span>{formatDateLongWIB(event.date)}</span>
                                    <span>·</span>
                                    <span>{formatTimeWIB(event.date)}</span>
                                </div>
                                {group && (
                                    <Badge variant="outline" className="mt-1.5 md:mt-2 text-[9px] md:text-[10px]">
                                        {group.name}
                                    </Badge>
                                )}
                            </div>
                            <Badge
                                variant={allSettled ? 'success' : 'warning'}
                                className="shrink-0 text-[9px] md:text-[10px]"
                            >
                                {allSettled
                                    ? 'Settled'
                                    : `${participants.length - totalPaidCount} belum`}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:gap-4 pt-3 md:pt-4 border-t border-slate-100 dark:border-white/5">
                            <div>
                                <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5 md:mb-1">
                                    Grand Total
                                </p>
                                <Amount
                                    value={Number(event.grand_total)}
                                    className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5 md:mb-1">
                                    Share Lu
                                </p>
                                <Amount
                                    value={Number(event.user_share)}
                                    className="text-lg md:text-2xl font-bold text-violet-600 dark:text-violet-400"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payer info */}
                <div
                    className={cn(
                        'rounded-xl md:rounded-2xl border p-3 md:p-4 flex items-center gap-2.5 md:gap-3',
                        payerIsUser
                            ? 'bg-emerald-50/60 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-amber-50/60 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/30'
                    )}
                >
                    <Wallet
                        className={cn(
                            'w-4 h-4 md:w-5 md:h-5 shrink-0',
                            payerIsUser
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                        )}
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] md:text-[10px] font-semibold uppercase tracking-wider mb-0.5">
                            {payerIsUser ? 'Lu yang talangin' : 'Ditalangin oleh'}
                        </p>
                        <p className="text-xs md:text-sm font-semibold truncate">
                            {payerIsUser
                                ? account?.name || 'Akun lu'
                                : payer_participant?.display_name ||
                                'Orang lain (data lama)'}
                        </p>
                    </div>
                </div>

                {/* Siapa makan apa */}
                {breakdown.length > 0 && itemShares.length > 0 && (
                    <div className="rounded-xl md:rounded-2xl border border-slate-200 dark:border-white/10 bg-card overflow-hidden">
                        <div className="px-3.5 md:px-5 py-2.5 md:py-3 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
                            <Utensils className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                            <p className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Siapa Makan Apa
                            </p>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                            {breakdown.map((b: any) => (
                                <div
                                    key={b.participant_id}
                                    className={cn(
                                        'px-3.5 md:px-5 py-3 md:py-4',
                                        b.is_user && 'bg-brand/5 dark:bg-brand/10'
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-1.5 md:mb-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <p className="text-xs md:text-sm font-semibold truncate">
                                                {b.display_name}
                                            </p>
                                            {b.is_user && (
                                                <span className="text-[9px] md:text-[10px] font-bold text-brand shrink-0">
                                                    LU
                                                </span>
                                            )}
                                            {b.is_payer && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-[8px] md:text-[9px] shrink-0"
                                                >
                                                    Talangin
                                                </Badge>
                                            )}
                                        </div>
                                        <Amount
                                            value={b.items_total}
                                            className="text-xs md:text-sm font-bold shrink-0"
                                        />
                                    </div>

                                    {b.items.length > 0 ? (
                                        <div className="space-y-0.5 md:space-y-1 pl-1">
                                            {b.items.map((it: any, i: number) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center justify-between text-[10px] md:text-[11px] text-muted-foreground gap-3"
                                                >
                                                    <span className="truncate flex-1">
                                                        {it.quantity}× {it.name}
                                                    </span>
                                                    <Amount
                                                        value={it.share_amount}
                                                        className="inline text-[10px] md:text-[11px] font-medium shrink-0"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[10px] md:text-[11px] text-muted-foreground italic pl-1">
                                            Gak ada item di-assign
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Peserta & Settle */}
                <div className="rounded-xl md:rounded-2xl border border-slate-200 dark:border-white/10 bg-card overflow-hidden">
                    <div className="px-3.5 md:px-5 py-2.5 md:py-3 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                        <p className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Status Pembayaran
                        </p>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {participants.map((p: any) => {
                            const canSettle = canSettleParticipant(p)
                            const isUser = p.is_user
                            const isPayer = p.id === event.payer_participant_id

                            return (
                                <div
                                    key={p.id}
                                    className={cn(
                                        'px-3.5 md:px-5 py-2.5 md:py-3 flex items-center gap-2.5 md:gap-3',
                                        isUser && 'bg-brand/5 dark:bg-brand/10'
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center shrink-0',
                                            p.paid
                                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                                : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                                        )}
                                    >
                                        {p.paid ? (
                                            <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                        ) : (
                                            <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs md:text-sm font-semibold truncate">
                                            {p.display_name}
                                            {isUser && (
                                                <span className="ml-1.5 text-[9px] md:text-[10px] font-bold text-brand">
                                                    LU
                                                </span>
                                            )}
                                            {isPayer && (
                                                <span className="ml-1.5 text-[9px] md:text-[10px] font-medium text-slate-500">
                                                    (talangin)
                                                </span>
                                            )}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge
                                                variant={p.paid ? 'success' : 'warning'}
                                                className="text-[8px] md:text-[9px]"
                                            >
                                                {p.paid ? 'Lunas' : 'Belum'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                                        <Amount
                                            value={Number(p.total_share)}
                                            className={cn(
                                                'text-xs md:text-base font-bold',
                                                isUser ? 'text-brand' : 'text-slate-900 dark:text-white'
                                            )}
                                        />
                                        {canSettle && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openSettle(p)}
                                                className="h-7 md:h-8 text-[10px] md:text-[11px] px-2 md:px-3"
                                            >
                                                {payerIsUser ? 'Lunas' : 'Bayar'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Items */}
                {items.length > 0 && (
                    <div className="rounded-xl md:rounded-2xl border border-slate-200 dark:border-white/10 bg-card overflow-hidden">
                        <div className="px-3.5 md:px-5 py-2.5 md:py-3 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Receipt className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                                <p className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Items ({items.length})
                                </p>
                            </div>
                            <Amount
                                value={Number(event.subtotal)}
                                className="text-[11px] md:text-xs font-bold text-slate-700 dark:text-slate-300"
                            />
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                            {items.map((item: any) => (
                                <div
                                    key={item.id}
                                    className="px-3.5 md:px-5 py-2 md:py-2.5 flex items-center justify-between gap-3 text-xs md:text-sm"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium truncate">{item.name}</p>
                                        <p className="text-[9px] md:text-[10px] text-muted-foreground tabular-nums">
                                            {item.quantity} ×{' '}
                                            <Amount
                                                value={Number(item.unit_price)}
                                                className="inline text-[9px] md:text-[10px]"
                                            />
                                        </p>
                                    </div>
                                    <Amount
                                        value={Number(item.subtotal)}
                                        className="font-semibold shrink-0 text-xs md:text-sm"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Breakdown */}
                <div className="rounded-xl md:rounded-2xl border border-slate-200 dark:border-white/10 bg-card overflow-hidden">
                    <div className="px-3.5 md:px-5 py-2.5 md:py-3 border-b border-slate-100 dark:border-white/5">
                        <p className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Breakdown
                        </p>
                    </div>
                    <div className="p-3.5 md:p-5 space-y-1.5 md:space-y-2">
                        <div className="flex justify-between text-[11px] md:text-xs">
                            <span className="text-muted-foreground">Subtotal</span>
                            <Amount value={Number(event.subtotal)} className="text-[11px] md:text-xs" />
                        </div>
                        {Number(event.ppn_amount) > 0 && (
                            <div className="flex justify-between text-[11px] md:text-xs">
                                <span className="text-muted-foreground">
                                    PPN ({(Number(event.ppn_rate) * 100).toFixed(0)}%)
                                </span>
                                <Amount value={Number(event.ppn_amount)} className="text-[11px] md:text-xs" />
                            </div>
                        )}
                        {Number(event.service_amount) > 0 && (
                            <div className="flex justify-between text-[11px] md:text-xs">
                                <span className="text-muted-foreground">
                                    Service ({(Number(event.service_rate) * 100).toFixed(0)}%)
                                </span>
                                <Amount value={Number(event.service_amount)} className="text-[11px] md:text-xs" />
                            </div>
                        )}
                        {Number(event.discount_amount) > 0 && (
                            <div className="flex justify-between text-[11px] md:text-xs">
                                <span className="text-muted-foreground">Diskon</span>
                                <span className="flex items-center gap-0.5">
                                    −
                                    <Amount
                                        value={Number(event.discount_amount)}
                                        className="text-[11px] md:text-xs"
                                    />
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-white/5">
                            <span className="text-xs md:text-sm font-bold">Grand Total</span>
                            <Amount
                                value={Number(event.grand_total)}
                                className="text-sm md:text-base font-bold text-brand"
                            />
                        </div>
                    </div>
                </div>

                {/* Debts */}
                {debts.length > 0 && (
                    <div className="rounded-xl md:rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/5 overflow-hidden">
                        <div className="px-3.5 md:px-5 py-2.5 md:py-3 border-b border-amber-200 dark:border-amber-500/20 flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600 dark:text-amber-400" />
                            <p className="text-[10px] md:text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                                {payerIsUser ? 'Piutang Lu' : 'Utang Lu'}
                            </p>
                        </div>
                        <div className="divide-y divide-amber-200/60 dark:divide-amber-500/20">
                            {debts.map((d: any) => (
                                <div
                                    key={d.id}
                                    className="px-3.5 md:px-5 py-2.5 md:py-3 flex items-center justify-between gap-3"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs md:text-sm font-medium truncate">
                                            {d.name.replace(`${event.name} — `, '')}
                                        </p>
                                        <Badge
                                            variant={d.status === 'paid' ? 'success' : 'warning'}
                                            className="text-[8px] md:text-[9px] mt-0.5 md:mt-1"
                                        >
                                            {d.status === 'paid' ? 'Lunas' : 'Outstanding'}
                                        </Badge>
                                    </div>
                                    <Amount
                                        value={Number(d.outstanding)}
                                        className={cn(
                                            'font-bold shrink-0 text-xs md:text-sm',
                                            payerIsUser
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-red-600 dark:text-red-400'
                                        )}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Receipts */}
                {receipts.length > 0 && (
                    <div className="rounded-xl md:rounded-2xl border border-slate-200 dark:border-white/10 bg-card overflow-hidden">
                        <div className="px-3.5 md:px-5 py-2.5 md:py-3 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
                            <Receipt className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                            <p className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Struk ({receipts.length})
                            </p>
                        </div>
                        <div className="p-2.5 md:p-4 grid grid-cols-3 gap-1.5 md:gap-2">
                            {receipts.map((r: any) => (
                                <a
                                    key={r.id}
                                    href={`/api/ocr/file/${r.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative aspect-square rounded-lg md:rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-brand/40 transition-all"
                                >
                                    <img
                                        src={`/api/ocr/file/${r.id}`}
                                        alt="Struk"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        loading="lazy"
                                    />
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <ShareModal open={shareOpen} onOpenChange={setShareOpen} data={data} />

            {settleTarget && (
                <SettleModal
                    open={!!settleTarget}
                    onOpenChange={(o) => !o && setSettleTarget(null)}
                    eventId={event.id}
                    eventName={event.name}
                    participant={{
                        id: settleTarget.participantId,
                        display_name: settleTarget.participantName,
                        total_share: settleTarget.amount,
                    }}
                    isIncome={settleTarget.isIncome}
                    payerName={payer_participant?.display_name}
                    accounts={accounts}
                    defaultAccountId={event.account_id || undefined}
                />
            )}

            <ConfirmDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Hapus event ini?"
                description="Event, items, participants, dan data terkait akan dihapus."
                confirmLabel="Hapus"
                variant="destructive"
                onConfirm={handleDelete}
            />
        </>
    )
}