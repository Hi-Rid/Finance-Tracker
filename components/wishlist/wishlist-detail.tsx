'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    PiggyBank,
    ShoppingBag,
    Undo2,
    Pencil,
    Trash2,
    Ban,
    Snowflake,
    CheckCircle2,
    Calendar,
    ExternalLink,
    Link2,
    FileText,
    Tag,
    Heart,
    Sparkles,
    ArrowDownLeft,
    ArrowUpRight,
    ShoppingCart,
    RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Amount } from '@/components/ui/amount'
import { HideAmountsButton } from '@/components/shared/hide-amounts-button'
import { useConfirmDialog } from '@/components/ui/confirm-dialog'
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
import { WishlistImage } from './wishlist-image'
import { WishlistContributeModal } from './wishlist-contribute-modal'
import { WishlistPurchaseModal } from './wishlist-purchase-modal'
import { WishlistDecisionModal } from './wishlist-decision-modal'
import { WishlistForm } from './wishlist-form'
import { useWishlists } from '@/lib/hooks/use-wishlists'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { getCategoryLabel } from '@/lib/constants/wishlist-categories'
import { formatDateShortWIB, formatDateTimeWIB } from '@/lib/utils/datetime'
import {
    MOOD_OPTIONS,
    DECISION_QUESTIONS,
    DECISION_MAX_SCORE,
    getDecisionInterpretation,
    type DecisionInput,
} from '@/lib/validators/wishlist'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Wishlist = Database['public']['Tables']['wishlists']['Row']
type Account = Database['public']['Tables']['accounts']['Row']
type Transaction = Database['public']['Tables']['transactions']['Row']

type Props = {
    wishlist: Wishlist
    envelope: Account | null
    transactions: Transaction[]
    accounts: Account[]
    profileId: string
}

type ModalState =
    | { type: 'none' }
    | { type: 'edit' }
    | { type: 'contribute'; mode: 'deposit' | 'withdraw' }
    | { type: 'purchase' }
    | { type: 'decision' }

const PRIORITY_BADGE: Record<
    string,
    { bg: string; text: string; label: string }
> = {
    urgent: { bg: 'bg-red-500', text: 'text-white', label: 'Urgent' },
    needs: { bg: 'bg-brand', text: 'text-white', label: 'Needs' },
    wants: { bg: 'bg-amber-500', text: 'text-white', label: 'Wants' },
    impulse: { bg: 'bg-purple-500', text: 'text-white', label: 'Impulse' },
}

const STATUS_BADGE: Record<
    string,
    { bg: string; text: string; label: string; icon?: any }
> = {
    planned: {
        bg: 'bg-slate-500/10',
        text: 'text-slate-600 dark:text-slate-400',
        label: 'Rencana',
    },
    cooling_off: {
        bg: 'bg-sky-500/10',
        text: 'text-sky-600 dark:text-sky-400',
        label: 'Cooling-off',
        icon: Snowflake,
    },
    saving: {
        bg: 'bg-brand/10',
        text: 'text-brand',
        label: 'Nabung',
        icon: PiggyBank,
    },
    ready: {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-600 dark:text-emerald-400',
        label: 'Siap Beli',
        icon: CheckCircle2,
    },
    purchased: {
        bg: 'bg-emerald-500',
        text: 'text-white',
        label: 'Dibeli',
        icon: ShoppingBag,
    },
    cancelled: {
        bg: 'bg-red-500/10',
        text: 'text-red-600 dark:text-red-400',
        label: 'Batal',
    },
}

function getMoodLabel(mood: string | null): string | null {
    if (!mood) return null
    return MOOD_OPTIONS.find((m) => m.value === mood)?.label || mood
}

export function WishlistDetail({
    wishlist,
    envelope,
    transactions,
    accounts,
    profileId,
}: Props) {
    const router = useRouter()
    const isMobile = useMediaQuery('(max-width: 767px)')
    const { deleteWishlist, cancelWishlist } = useWishlists()
    const { confirm, Dialog: ConfirmDialog } = useConfirmDialog()
    const [modal, setModal] = useState<ModalState>({ type: 'none' })

    const targetPrice = Number(wishlist.target_price)
    const savedAmount = Number(wishlist.saved_amount)
    const percent =
        targetPrice > 0 ? (savedAmount / targetPrice) * 100 : 0
    const remaining = Math.max(0, targetPrice - savedAmount)

    const isPurchased = wishlist.status === 'purchased'
    const isCancelled = wishlist.status === 'cancelled'
    const isDone = isPurchased || isCancelled
    const canBuy = savedAmount >= targetPrice && targetPrice > 0 && !isDone
    const hasSavings = savedAmount > 0
    const isCoolingOff = wishlist.status === 'cooling_off'

    const priorityStyle =
        PRIORITY_BADGE[wishlist.priority || 'wants'] || PRIORITY_BADGE.wants
    const statusStyle =
        STATUS_BADGE[wishlist.status] || STATUS_BADGE.planned
    const StatusIcon = statusStyle.icon

    const envelopeBalance = Number(envelope?.current_balance || 0)

    // Decision check
    const decisionScore = wishlist.decision_score
    const hasDecision =
        decisionScore !== null && decisionScore !== undefined
    const decisionAnswers =
        (wishlist.decision_answers as DecisionInput | null) || null
    const answeredCount = decisionAnswers
        ? Object.keys(decisionAnswers).length
        : 0
    const interpretation = hasDecision
        ? getDecisionInterpretation(Number(decisionScore))
        : null

    // Riwayat summary
    const totalDeposit = transactions
        .filter((t) => t.internal_ref_type === 'envelope_deposit')
        .reduce((s, t) => s + Number(t.amount_idr), 0)
    const totalWithdraw = transactions
        .filter((t) => t.internal_ref_type === 'envelope_withdraw')
        .reduce((s, t) => s + Number(t.amount_idr), 0)

    function closeModal() {
        setModal({ type: 'none' })
    }

    function handleCancel() {
        confirm({
            title: `Batalkan "${wishlist.name}"?`,
            description: hasSavings
                ? 'Uang tabungan bakal direfund otomatis ke akun asal. Data tetap tersimpan sebagai riwayat.'
                : 'Wishlist ditandai batal. Data tetap tersimpan sebagai riwayat.',
            confirmLabel: 'Batalkan',
            cancelLabel: 'Kembali',
            variant: 'default',
            onConfirm: async () => {
                await cancelWishlist(wishlist.id)
                router.push('/wishlist')
            },
        })
    }

    function handleDelete() {
        confirm({
            title: `Hapus "${wishlist.name}"?`,
            description:
                'Wishlist dihapus permanen. Uang tabungan (kalau ada) direfund otomatis ke akun asal. Gak bisa di-undo.',
            confirmLabel: 'Hapus',
            cancelLabel: 'Batal',
            variant: 'destructive',
            onConfirm: async () => {
                await deleteWishlist(wishlist.id)
                router.push('/wishlist')
            },
        })
    }

    const editFormContent = (
        <WishlistForm
            profileId={profileId}
            wishlist={wishlist}
            onSuccess={closeModal}
            onCancel={closeModal}
        />
    )

    return (
        <>
            <div className="space-y-4 md:space-y-5">
                {/* ============ TOP BAR ============ */}
                <div className="flex items-center justify-between gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-muted-foreground hover:text-foreground -ml-2"
                    >
                        <Link href="/wishlist">
                            <ArrowLeft className="w-4 h-4" />
                            Wishlist
                        </Link>
                    </Button>

                    <div className="flex items-center gap-1.5">
                        <HideAmountsButton size="icon-sm" />
                        {!isDone && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setModal({ type: 'edit' })}
                                className="h-8"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Edit</span>
                            </Button>
                        )}
                        {!isDone && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancel}
                                className="h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10 border-amber-200 dark:border-amber-500/30"
                            >
                                <Ban className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">
                                    Batalkan
                                </span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* ============ HERO ============ */}
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-card overflow-hidden shadow-sm">
                    <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                        {/* Image */}
                        <div className="relative border-b md:border-b-0 md:border-r border-slate-100 dark:border-white/5">
                            <WishlistImage
                                imageUrl={wishlist.image_url}
                                alt={wishlist.name}
                                aspect="4:3"
                                className="md:aspect-auto md:h-full md:min-h-[340px]"
                            />
                            <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
                                <span
                                    className={cn(
                                        'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm',
                                        priorityStyle.bg,
                                        priorityStyle.text
                                    )}
                                >
                                    {priorityStyle.label}
                                </span>
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider',
                                        statusStyle.bg,
                                        statusStyle.text
                                    )}
                                >
                                    {StatusIcon && (
                                        <StatusIcon className="w-3 h-3" />
                                    )}
                                    {statusStyle.label}
                                </span>
                            </div>

                            {isCoolingOff && wishlist.cooling_off_until && (
                                <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-sky-500/95 backdrop-blur-sm shadow-md p-3 flex items-center gap-2.5">
                                    <Snowflake className="w-5 h-5 text-white shrink-0" />
                                    <div>
                                        <p className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">
                                            Cooling-off
                                        </p>
                                        <p className="text-xs font-bold text-white">
                                            Tunggu sampai{' '}
                                            {new Date(
                                                wishlist.cooling_off_until
                                            ).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                                timeZone: 'Asia/Jakarta',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="p-5 md:p-6 flex flex-col">
                            <h1
                                className={cn(
                                    'text-2xl md:text-3xl font-bold tracking-tight leading-tight mb-2',
                                    isDone &&
                                    'line-through text-muted-foreground'
                                )}
                            >
                                {wishlist.name}
                            </h1>

                            {wishlist.category && (
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                                    {getCategoryLabel(wishlist.category)}
                                </p>
                            )}

                            {/* Target */}
                            <div className="mb-5">
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                    Target Harga
                                </p>
                                <Amount
                                    value={targetPrice}
                                    className={cn(
                                        'text-3xl md:text-4xl font-bold block',
                                        isDone
                                            ? 'text-muted-foreground'
                                            : 'text-brand'
                                    )}
                                />
                            </div>

                            {/* Progress */}
                            <div className="mb-5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-muted-foreground">
                                        Tersimpan
                                    </span>
                                    <div className="flex items-center gap-1 tabular-nums">
                                        <Amount
                                            value={savedAmount}
                                            className={cn(
                                                'text-sm font-bold',
                                                hasSavings
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : 'text-slate-500'
                                            )}
                                        />
                                        <span className="text-muted-foreground text-xs">
                                            /
                                        </span>
                                        <Amount
                                            value={targetPrice}
                                            className="text-xs font-medium text-muted-foreground"
                                        />
                                    </div>
                                </div>

                                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                                    <div
                                        className={cn(
                                            'h-full rounded-full transition-all duration-500',
                                            percent >= 100
                                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                                : percent > 0
                                                    ? 'bg-gradient-to-r from-brand to-brand-hover'
                                                    : 'bg-transparent'
                                        )}
                                        style={{
                                            width: `${Math.min(
                                                Math.max(percent, 0),
                                                100
                                            )}%`,
                                        }}
                                    />
                                </div>

                                <div className="flex items-center justify-between mt-2">
                                    <span
                                        className={cn(
                                            'text-sm tabular-nums font-bold',
                                            percent >= 100
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : percent > 0
                                                    ? 'text-brand'
                                                    : 'text-slate-400 dark:text-slate-500'
                                        )}
                                    >
                                        {Math.round(percent)}%
                                    </span>
                                    {!isDone && remaining > 0 && (
                                        <span className="text-xs text-muted-foreground tabular-nums flex items-center gap-1">
                                            Kurang
                                            <Amount
                                                value={remaining}
                                                className="inline text-xs font-semibold text-slate-600 dark:text-slate-400"
                                            />
                                        </span>
                                    )}
                                    {percent >= 100 && !isDone && (
                                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                            ✓ Tercapai
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Envelope info */}
                            {!isDone && envelope && (
                                <div className="mb-4 rounded-xl bg-gradient-to-br from-brand/5 to-brand/[0.02] border border-brand/20 p-3 flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                                        <PiggyBank className="w-4 h-4 text-brand" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                            Saldo Envelope
                                        </p>
                                        <Amount
                                            value={envelopeBalance}
                                            className="text-base font-bold text-brand block"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            {!isDone && (
                                <div className="flex flex-col gap-2 mt-auto">
                                    {canBuy ? (
                                        <Button
                                            onClick={() =>
                                                setModal({ type: 'purchase' })
                                            }
                                            size="lg"
                                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 text-base font-semibold"
                                        >
                                            <ShoppingBag className="w-4 h-4" />
                                            Beli Sekarang
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() =>
                                                setModal({
                                                    type: 'contribute',
                                                    mode: 'deposit',
                                                })
                                            }
                                            size="lg"
                                            className="w-full h-12 text-base font-semibold"
                                        >
                                            <PiggyBank className="w-4 h-4" />
                                            Nabung
                                        </Button>
                                    )}
                                    {hasSavings && (
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                setModal({
                                                    type: 'contribute',
                                                    mode: 'withdraw',
                                                })
                                            }
                                            size="lg"
                                            className="w-full h-11"
                                        >
                                            <Undo2 className="w-4 h-4" />
                                            Tarik Uang
                                        </Button>
                                    )}

                                    {wishlist.link && (
                                        <a
                                            href={wishlist.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={cn(
                                                'inline-flex items-center justify-center gap-2 h-11 px-4 rounded-lg text-sm font-medium transition-colors',
                                                'border border-slate-200 dark:border-white/10',
                                                'text-slate-700 dark:text-slate-300',
                                                'hover:bg-slate-50 dark:hover:bg-white/5'
                                            )}
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Buka Link Produk
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ============ DECISION CHECK ============ */}
                {!isDone && (
                    <div>
                        {hasDecision && interpretation ? (
                            <div
                                className={cn(
                                    'rounded-2xl border overflow-hidden',
                                    interpretation.variant === 'success'
                                        ? 'bg-emerald-50/60 dark:bg-emerald-500/[0.03] border-emerald-200 dark:border-emerald-500/30'
                                        : interpretation.variant === 'warning'
                                            ? 'bg-amber-50/60 dark:bg-amber-500/[0.03] border-amber-200 dark:border-amber-500/30'
                                            : 'bg-red-50/60 dark:bg-red-500/[0.03] border-red-200 dark:border-red-500/30'
                                )}
                            >
                                <div className="p-5">
                                    <div className="flex items-start gap-4">
                                        <div
                                            className={cn(
                                                'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                                                interpretation.variant === 'success'
                                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                                    : interpretation.variant === 'warning'
                                                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                                        : 'bg-red-500/15 text-red-600 dark:text-red-400'
                                            )}
                                        >
                                            <Sparkles className="w-6 h-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
                                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Decision Check
                                                </p>
                                                <div className="flex items-baseline gap-1">
                                                    <span
                                                        className={cn(
                                                            'text-xl font-bold tabular-nums leading-none',
                                                            interpretation.variant === 'success'
                                                                ? 'text-emerald-700 dark:text-emerald-300'
                                                                : interpretation.variant === 'warning'
                                                                    ? 'text-amber-700 dark:text-amber-300'
                                                                    : 'text-red-700 dark:text-red-300'
                                                        )}
                                                    >
                                                        {decisionScore}
                                                    </span>
                                                    <span className="text-xs font-medium text-muted-foreground">
                                                        /{DECISION_MAX_SCORE}
                                                    </span>
                                                </div>
                                            </div>
                                            <p
                                                className={cn(
                                                    'text-sm font-bold mb-1',
                                                    interpretation.variant === 'success'
                                                        ? 'text-emerald-700 dark:text-emerald-300'
                                                        : interpretation.variant === 'warning'
                                                            ? 'text-amber-700 dark:text-amber-300'
                                                            : 'text-red-700 dark:text-red-300'
                                                )}
                                            >
                                                {interpretation.emoji}{' '}
                                                {interpretation.label}
                                            </p>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {interpretation.message}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setModal({ type: 'decision' })
                                            }
                                            className="flex-1 bg-background/50"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            Ubah Jawaban
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setModal({ type: 'decision' })}
                                className={cn(
                                    'group w-full text-left rounded-2xl border-2 border-dashed p-5 transition-all cursor-pointer',
                                    'border-brand/30 bg-brand/[0.03]',
                                    'hover:border-brand/50 hover:bg-brand/[0.06]'
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                                        <Sparkles className="w-6 h-6 text-brand" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-brand mb-1">
                                            Isi Decision Check
                                        </p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Jawab 6 pertanyaan singkat buat
                                            nilai apakah barang ini beneran
                                            worth it. Bantu lu keputusan lebih
                                            rasional.
                                        </p>
                                    </div>
                                    <ArrowDownLeft className="w-5 h-5 text-brand/50 group-hover:text-brand transition-colors shrink-0 rotate-45" />
                                </div>
                            </button>
                        )}
                    </div>
                )}

                {/* ============ DETAIL INFO ============ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {wishlist.target_date && (
                        <InfoCard
                            icon={Calendar}
                            label="Target Beli"
                            value={formatDateShortWIB(wishlist.target_date)}
                        />
                    )}

                    {wishlist.mood && (
                        <InfoCard
                            icon={Sparkles}
                            label="Mood"
                            value={getMoodLabel(wishlist.mood) || '—'}
                        />
                    )}

                    {wishlist.reason && (
                        <InfoCard
                            icon={Heart}
                            label="Alasan Beli"
                            value={wishlist.reason}
                            fullWidth
                        />
                    )}

                    {wishlist.alternatives && (
                        <InfoCard
                            icon={Tag}
                            label="Alternatif Lebih Murah"
                            value={wishlist.alternatives}
                            fullWidth
                        />
                    )}

                    {wishlist.note && (
                        <InfoCard
                            icon={FileText}
                            label="Catatan"
                            value={wishlist.note}
                            fullWidth
                        />
                    )}

                    {wishlist.link && (
                        <InfoCard
                            icon={Link2}
                            label="Link Produk"
                            action={
                                <a
                                    href={wishlist.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-brand hover:underline text-sm font-medium inline-flex items-center gap-1 max-w-full"
                                >
                                    <span className="truncate">
                                        {wishlist.link}
                                    </span>
                                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                </a>
                            }
                            fullWidth
                        />
                    )}
                </div>

                {/* ============ RIWAYAT ============ */}
                <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h2 className="text-base font-semibold">
                            Riwayat Transaksi
                        </h2>
                        <span className="text-xs text-muted-foreground tabular-nums">
                            {transactions.length} transaksi
                        </span>
                    </div>

                    {transactions.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-card p-8 text-center">
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
                                <PiggyBank className="w-5 h-5 text-slate-400" />
                            </div>
                            <p className="text-sm font-medium mb-1">
                                Belum ada riwayat
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Mulai nabung buat lihat history di sini
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Summary */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-card p-3">
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                        Total Setor
                                    </p>
                                    <Amount
                                        value={totalDeposit}
                                        className="text-base font-bold text-emerald-600 dark:text-emerald-400"
                                    />
                                </div>
                                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-card p-3">
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                        Total Tarik
                                    </p>
                                    <Amount
                                        value={totalWithdraw}
                                        className="text-base font-bold text-amber-600 dark:text-amber-400"
                                    />
                                </div>
                            </div>

                            {/* List */}
                            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-card overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
                                {transactions.map((tx) => {
                                    const isDeposit =
                                        tx.internal_ref_type ===
                                        'envelope_deposit'
                                    const isWithdraw =
                                        tx.internal_ref_type ===
                                        'envelope_withdraw'
                                    const isRefund =
                                        tx.internal_ref_type ===
                                        'envelope_cancel'
                                    const isPurchase =
                                        tx.internal_ref_type ===
                                        'wishlist_purchase'

                                    let label = tx.type
                                    let Icon: any = ShoppingCart
                                    let colorClass =
                                        'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                                    let amountColor =
                                        'text-slate-900 dark:text-white'
                                    let sign: 'positive' | 'negative' =
                                        'positive'

                                    if (isDeposit) {
                                        label = 'Setor'
                                        Icon = ArrowDownLeft
                                        colorClass =
                                            'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                        amountColor =
                                            'text-emerald-600 dark:text-emerald-400'
                                        sign = 'positive'
                                    } else if (isWithdraw) {
                                        label = 'Tarik'
                                        Icon = ArrowUpRight
                                        colorClass =
                                            'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                        amountColor =
                                            'text-amber-600 dark:text-amber-400'
                                        sign = 'negative'
                                    } else if (isRefund) {
                                        label = 'Refund'
                                        Icon = ArrowDownLeft
                                        colorClass =
                                            'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                                        amountColor =
                                            'text-sky-600 dark:text-sky-400'
                                        sign = 'positive'
                                    } else if (isPurchase) {
                                        label = 'Pembelian'
                                        Icon = ShoppingBag
                                        colorClass =
                                            'bg-red-500/10 text-red-600 dark:text-red-400'
                                        amountColor =
                                            'text-red-600 dark:text-red-400'
                                        sign = 'negative'
                                    }

                                    return (
                                        <div
                                            key={tx.id}
                                            className="flex items-center gap-3 p-4"
                                        >
                                            <div
                                                className={cn(
                                                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                                                    colorClass
                                                )}
                                            >
                                                <Icon className="w-4 h-4" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate">
                                                    {label}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums truncate">
                                                    {formatDateTimeWIB(tx.date)}
                                                    {tx.note &&
                                                        ` · ${tx.note}`}
                                                </p>
                                            </div>

                                            <Amount
                                                value={Number(tx.amount_idr)}
                                                sign={sign}
                                                className={cn(
                                                    'text-sm font-bold shrink-0',
                                                    amountColor
                                                )}
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ============ DANGER ZONE ============ */}
                {!isDone && (
                    <div className="pt-2">
                        <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/[0.02] p-4">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-0.5">
                                        Hapus Wishlist
                                    </p>
                                    <p className="text-[11px] text-red-600/80 dark:text-red-400/80 leading-relaxed">
                                        Hapus permanen. Uang tabungan (kalau
                                        ada) direfund otomatis ke akun asal.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDelete}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-500/20 border-red-300 dark:border-red-500/40 shrink-0"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Hapus
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ============ MODALS ============ */}
            {isMobile ? (
                <Sheet
                    open={modal.type === 'edit'}
                    onOpenChange={(o) => !o && closeModal()}
                >
                    <SheetContent
                        side="bottom"
                        className="max-h-[92vh] overflow-y-auto"
                    >
                        <SheetHeader>
                            <SheetTitle>Edit Wishlist</SheetTitle>
                            <SheetDescription>
                                Update detail wishlist ini.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="px-4 pb-6 pt-2">
                            {editFormContent}
                        </div>
                    </SheetContent>
                </Sheet>
            ) : (
                <Dialog
                    open={modal.type === 'edit'}
                    onOpenChange={(o) => !o && closeModal()}
                >
                    <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Wishlist</DialogTitle>
                            <DialogDescription>
                                Update detail wishlist ini.
                            </DialogDescription>
                        </DialogHeader>
                        {editFormContent}
                    </DialogContent>
                </Dialog>
            )}

            <WishlistContributeModal
                open={modal.type === 'contribute'}
                onOpenChange={(o) => !o && closeModal()}
                mode={
                    modal.type === 'contribute' ? modal.mode : 'deposit'
                }
                wishlist={wishlist}
                accounts={accounts}
            />

            <WishlistPurchaseModal
                open={modal.type === 'purchase'}
                onOpenChange={(o) => !o && closeModal()}
                wishlist={wishlist}
            />

            <WishlistDecisionModal
                open={modal.type === 'decision'}
                onOpenChange={(o) => !o && closeModal()}
                wishlist={wishlist}
            />

            <ConfirmDialog />
        </>
    )
}

function InfoCard({
    icon: Icon,
    label,
    value,
    action,
    fullWidth = false,
}: {
    icon: any
    label: string
    value?: string
    action?: React.ReactNode
    fullWidth?: boolean
}) {
    return (
        <div
            className={cn(
                'rounded-xl border border-slate-200 dark:border-white/10 bg-card p-4',
                fullWidth && 'md:col-span-2'
            )}
        >
            <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {label}
                </p>
            </div>
            {action || (
                <p className="text-sm text-slate-900 dark:text-white whitespace-pre-wrap break-words">
                    {value}
                </p>
            )}
        </div>
    )
}