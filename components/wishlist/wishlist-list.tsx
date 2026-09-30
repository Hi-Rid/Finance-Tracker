'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
    Plus,
    Search,
    X,
    SlidersHorizontal,
    Snowflake,
    CheckCircle2,
    PiggyBank,
    ShoppingBag,
    Calendar,
    ArrowUpDown,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Amount } from '@/components/ui/amount'
import { EmptyState } from '@/components/ui/empty-state'
import { HideAmountsButton } from '@/components/shared/hide-amounts-button'
import { WishlistImage } from './wishlist-image'
import { WishlistForm } from './wishlist-form'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
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
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { getCategoryLabel } from '@/lib/constants/wishlist-categories'
import { formatDateShortWIB } from '@/lib/utils/datetime'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Wishlist = Database['public']['Tables']['wishlists']['Row']

type WishlistListProps = {
    wishlists: Wishlist[]
    profileId: string
}

type PriorityFilter = 'all' | 'urgent' | 'needs' | 'wants' | 'impulse'
type SortOption =
    | 'newest'
    | 'oldest'
    | 'priority'
    | 'price_high'
    | 'price_low'
    | 'status'
    | 'category'

const PRIORITY_FILTERS: { value: PriorityFilter; label: string }[] = [
    { value: 'all', label: 'Semua' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'needs', label: 'Needs' },
    { value: 'wants', label: 'Wants' },
    { value: 'impulse', label: 'Impulse' },
]

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Terbaru' },
    { value: 'oldest', label: 'Terlama' },
    { value: 'priority', label: 'Prioritas' },
    { value: 'price_high', label: 'Harga Tinggi' },
    { value: 'price_low', label: 'Harga Rendah' },
    { value: 'status', label: 'Status' },
    { value: 'category', label: 'Kategori' },
]

const PRIORITY_ORDER: Record<string, number> = {
    urgent: 0,
    needs: 1,
    wants: 2,
    impulse: 3,
}

const STATUS_ORDER: Record<string, number> = {
    ready: 0,
    saving: 1,
    planned: 2,
    cooling_off: 3,
    purchased: 4,
    cancelled: 5,
}

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

function formatCoolingOffCountdown(untilDate: string): string {
    const until = new Date(untilDate).getTime()
    const now = Date.now()
    const diff = until - now

    if (diff <= 0) return 'Selesai'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}h ${hours}j`
    if (hours > 0) return `${hours}j ${minutes}m`
    return `${minutes}m`
}

export function WishlistList({ wishlists, profileId }: WishlistListProps) {
    const isMobile = useMediaQuery('(max-width: 767px)')
    const [createOpen, setCreateOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [filterPriority, setFilterPriority] = useState<PriorityFilter>('all')
    const [sortBy, setSortBy] = useState<SortOption>('newest')
    const [filterOpen, setFilterOpen] = useState(false)
    const [sortOpen, setSortOpen] = useState(false)

    const filtered = useMemo(() => {
        let result = wishlists.filter((w) => {
            if (search && !w.name.toLowerCase().includes(search.toLowerCase()))
                return false
            if (filterPriority !== 'all' && w.priority !== filterPriority)
                return false
            return true
        })

        result = [...result].sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return (
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                    )
                case 'oldest':
                    return (
                        new Date(a.created_at).getTime() -
                        new Date(b.created_at).getTime()
                    )
                case 'priority':
                    return (
                        (PRIORITY_ORDER[a.priority || 'wants'] || 99) -
                        (PRIORITY_ORDER[b.priority || 'wants'] || 99)
                    )
                case 'price_high':
                    return Number(b.target_price) - Number(a.target_price)
                case 'price_low':
                    return Number(a.target_price) - Number(b.target_price)
                case 'status':
                    return (
                        (STATUS_ORDER[a.status] || 99) -
                        (STATUS_ORDER[b.status] || 99)
                    )
                case 'category':
                    return (a.category || '').localeCompare(b.category || '')
                default:
                    return 0
            }
        })

        return result
    }, [wishlists, search, filterPriority, sortBy])

    const activeWishlists = useMemo(
        () =>
            filtered.filter(
                (w) => !['purchased', 'cancelled'].includes(w.status)
            ),
        [filtered]
    )

    const purchasedWishlists = useMemo(
        () => filtered.filter((w) => w.status === 'purchased'),
        [filtered]
    )

    const cancelledWishlists = useMemo(
        () => filtered.filter((w) => w.status === 'cancelled'),
        [filtered]
    )
    const totalCancelled = cancelledWishlists.reduce(
        (sum, w) => sum + Number(w.target_price),
        0
    )

    const availableFilters = useMemo(() => {
        return PRIORITY_FILTERS.filter((f) => {
            if (f.value === 'all') return true
            return wishlists.some((w) => w.priority === f.value)
        })
    }, [wishlists])

    function getPriorityCount(p: PriorityFilter): number {
        if (p === 'all') return wishlists.length
        return wishlists.filter((w) => w.priority === p).length
    }

    const totalTarget = activeWishlists.reduce(
        (sum, w) => sum + Number(w.target_price),
        0
    )
    const totalSaved = activeWishlists.reduce(
        (sum, w) => sum + Number(w.saved_amount),
        0
    )
    const totalPurchased = purchasedWishlists.reduce(
        (sum, w) => sum + Number(w.target_price),
        0
    )

    return (
        <>
            {/* ============ HEADER ============ */}
            <div className="mb-5 md:mb-6">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-8 min-w-0 flex-1">
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                Target Aktif ({activeWishlists.length})
                            </p>
                            <Amount
                                value={totalTarget}
                                className="text-2xl md:text-4xl font-bold tracking-tight leading-none block"
                            />
                        </div>

                        <div className="hidden md:block w-px self-stretch bg-slate-200 dark:bg-white/10 shrink-0 my-1" />

                        <div className="flex items-start justify-between gap-2 md:gap-6 w-full md:w-auto md:shrink-0">
                            <div className="min-w-0">
                                <p className="text-[9px] md:text-[11px] font-semibold text-muted-foreground md:tracking-wider mb-0.5 md:mb-1">
                                    Tersimpan
                                </p>
                                <Amount
                                    value={totalSaved}
                                    className="text-[11px] md:text-lg font-bold text-emerald-600 dark:text-emerald-400 leading-tight block"
                                />
                            </div>

                            <div className="min-w-0">
                                <p className="text-[9px] md:text-[11px] font-semibold text-muted-foreground md:tracking-wider mb-0.5 md:mb-1">
                                    Terbeli ({purchasedWishlists.length})
                                </p>
                                <Amount
                                    value={totalPurchased}
                                    className="text-[11px] md:text-lg font-bold text-brand leading-tight block"
                                />
                            </div>

                            {cancelledWishlists.length > 0 && (
                                <div className="min-w-0">
                                    <p className="text-[9px] md:text-[11px] font-semibold text-muted-foreground md:tracking-wider mb-0.5 md:mb-1">
                                        Batal ({cancelledWishlists.length})
                                    </p>
                                    <Amount
                                        value={totalCancelled}
                                        className="text-[11px] md:text-lg font-bold text-red-600 dark:text-red-400 leading-tight block"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <HideAmountsButton size="icon-sm" />
                        <Button
                            onClick={() => setCreateOpen(true)}
                            variant="primary"
                            size="sm"
                            className="h-8"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Tambah</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* ============ SEARCH + FILTER + SORT ============ */}
            {wishlists.length > 0 && (
                <>
                    <div className="hidden md:flex items-center gap-2 mb-4">
                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <Input
                                placeholder="Cari wishlist..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 pr-9 h-9"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                            {availableFilters.map((f) => {
                                const count = getPriorityCount(f.value)
                                const isActive = filterPriority === f.value
                                return (
                                    <button
                                        key={f.value}
                                        type="button"
                                        onClick={() => setFilterPriority(f.value)}
                                        className={cn(
                                            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer',
                                            isActive
                                                ? 'bg-brand text-white shadow-sm shadow-brand/20'
                                                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                                        )}
                                    >
                                        <span>{f.label}</span>
                                        <span
                                            className={cn(
                                                'text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full leading-none',
                                                isActive
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                                            )}
                                        >
                                            {count}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 gap-1.5 px-3 shrink-0"
                                >
                                    <ArrowUpDown className="w-3.5 h-3.5" />
                                    <span className="text-xs font-semibold">
                                        {
                                            SORT_OPTIONS.find(
                                                (s) => s.value === sortBy
                                            )?.label
                                        }
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="min-w-[180px]"
                            >
                                <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    Urutkan
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {SORT_OPTIONS.map((s) => (
                                    <DropdownMenuItem
                                        key={s.value}
                                        onSelect={() => setSortBy(s.value)}
                                        className={cn(
                                            'whitespace-nowrap',
                                            sortBy === s.value &&
                                            'bg-brand/5 dark:bg-brand/10'
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'text-sm',
                                                sortBy === s.value &&
                                                'font-semibold text-brand'
                                            )}
                                        >
                                            {s.label}
                                        </span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="md:hidden flex items-center gap-2 mb-4">
                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <Input
                                placeholder="Cari..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 pr-9 h-9"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setFilterOpen(true)}
                            className="relative shrink-0 h-9 w-9"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            {filterPriority !== 'all' && (
                                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-brand text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-background tabular-nums">
                                    {getPriorityCount(filterPriority)}
                                </span>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setSortOpen(true)}
                            className="shrink-0 h-9 w-9"
                        >
                            <ArrowUpDown className="w-4 h-4" />
                        </Button>
                    </div>
                </>
            )}

            {/* ============ LIST ============ */}
            {wishlists.length === 0 ? (
                <Card>
                    <CardContent>
                        <EmptyState
                            icon={Plus}
                            title="Belum ada wishlist"
                            description="Catat barang yang pengen lu beli biar bisa direncanain dengan baik."
                            action={
                                <Button
                                    onClick={() => setCreateOpen(true)}
                                    variant="primary"
                                    size="sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    Tambah Wishlist
                                </Button>
                            }
                        />
                    </CardContent>
                </Card>
            ) : filtered.length === 0 ? (
                <Card>
                    <CardContent>
                        <EmptyState
                            icon={Search}
                            title="Gak ada hasil"
                            description="Coba ubah filter atau keyword."
                        />
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-3 lg:gap-4">
                    {filtered.map((w) => {
                        const targetPrice = Number(w.target_price)
                        const savedAmount = Number(w.saved_amount)
                        const percent =
                            targetPrice > 0
                                ? (savedAmount / targetPrice) * 100
                                : 0
                        const remaining = Math.max(
                            0,
                            targetPrice - savedAmount
                        )
                        const priorityStyle =
                            PRIORITY_BADGE[w.priority || 'wants'] ||
                            PRIORITY_BADGE.wants
                        const statusStyle =
                            STATUS_BADGE[w.status] || STATUS_BADGE.planned
                        const StatusIcon = statusStyle.icon
                        const isCoolingOff = w.status === 'cooling_off'
                        const isPurchased = w.status === 'purchased'
                        const isCancelled = w.status === 'cancelled'
                        const isDone = isPurchased || isCancelled
                        const hasSavings = savedAmount > 0

                        return (
                            <Link
                                key={w.id}
                                href={`/wishlist/${w.id}`}
                                className={cn(
                                    'group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-card flex flex-col',
                                    'transition-all duration-300 hover:border-brand/40 hover:shadow-md hover:-translate-y-0.5',
                                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                                )}
                            >
                                {/* IMAGE */}
                                <div className="relative">
                                    <WishlistImage
                                        imageUrl={w.image_url}
                                        alt={w.name}
                                        aspect="4:3"
                                    />

                                    <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2">
                                        <span
                                            className={cn(
                                                'inline-flex items-center px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-wider shadow-sm',
                                                priorityStyle.bg,
                                                priorityStyle.text
                                            )}
                                        >
                                            {priorityStyle.label}
                                        </span>
                                    </div>

                                    {isCoolingOff && w.cooling_off_until && (
                                        <div className="absolute bottom-1.5 right-1.5 md:bottom-2 md:right-2 px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg bg-sky-500/95 backdrop-blur-sm shadow-sm flex items-center gap-1">
                                            <Snowflake className="w-3 h-3 text-white" />
                                            <span className="text-[10px] md:text-[11px] font-bold tabular-nums text-white">
                                                {formatCoolingOffCountdown(
                                                    w.cooling_off_until
                                                )}
                                            </span>
                                        </div>
                                    )}

                                    {hasSavings && (
                                        <div className="absolute bottom-1.5 left-1.5 md:bottom-2 md:left-2 px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg bg-emerald-500/95 backdrop-blur-sm shadow-sm flex items-center gap-1">
                                            <PiggyBank className="w-3 h-3 text-white" />
                                            <span className="text-[10px] md:text-[11px] font-bold tabular-nums text-white">
                                                {Math.round(percent)}%
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* CONTENT */}
                                <div className="p-2.5 md:p-3.5 flex-1 flex flex-col">
                                    <h4
                                        className={cn(
                                            'text-sm md:text-base font-bold leading-tight mb-1.5 md:mb-2 line-clamp-2 min-h-[2.5rem] md:min-h-[2.75rem]',
                                            isDone &&
                                            'line-through text-muted-foreground'
                                        )}
                                    >
                                        {w.name}
                                    </h4>

                                    <div className="flex items-center gap-1 md:gap-1.5 flex-wrap mb-2 md:mb-2.5">
                                        <span
                                            className={cn(
                                                'inline-flex items-center gap-1 px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-wider',
                                                statusStyle.bg,
                                                statusStyle.text
                                            )}
                                        >
                                            {StatusIcon && (
                                                <StatusIcon className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                            )}
                                            {statusStyle.label}
                                        </span>
                                        {w.category && (
                                            <span className="text-[10px] md:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                                                {getCategoryLabel(w.category)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mb-2.5 md:mb-3">
                                        <p className="hidden md:block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                                            Target Harga
                                        </p>
                                        <Amount
                                            value={targetPrice}
                                            className={cn(
                                                'text-base md:text-lg font-bold block',
                                                isDone
                                                    ? 'text-muted-foreground'
                                                    : 'text-brand'
                                            )}
                                        />
                                    </div>

                                    <div className="mb-2 md:mb-3">
                                        <div className="flex items-center justify-between gap-1.5 mb-1 md:mb-1.5">
                                            <span className="text-[11px] md:text-xs text-muted-foreground truncate">
                                                Tersimpan
                                            </span>
                                            <div className="flex items-center gap-0.5 shrink-0 tabular-nums">
                                                <Amount
                                                    value={savedAmount}
                                                    className={cn(
                                                        'inline text-[11px] md:text-xs font-semibold',
                                                        hasSavings
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : 'text-slate-500 dark:text-slate-400'
                                                    )}
                                                />
                                                <span className="text-muted-foreground text-[10px] md:text-[11px]">
                                                    /
                                                </span>
                                                <Amount
                                                    value={targetPrice}
                                                    className="inline text-[11px] md:text-xs font-medium text-muted-foreground"
                                                />
                                            </div>
                                        </div>

                                        <div className="w-full h-1.5 md:h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
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

                                        <div className="flex items-center justify-between mt-1 md:mt-1.5">
                                            <span
                                                className={cn(
                                                    'text-[11px] md:text-xs tabular-nums font-bold',
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
                                                <span className="text-[11px] md:text-xs text-muted-foreground tabular-nums flex items-center gap-0.5">
                                                    <span className="hidden md:inline">
                                                        Kurang
                                                    </span>
                                                    <Amount
                                                        value={remaining}
                                                        className="inline text-[11px] md:text-xs font-semibold text-slate-600 dark:text-slate-400"
                                                    />
                                                </span>
                                            )}
                                            {percent >= 100 && !isDone && (
                                                <span className="text-[11px] md:text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                    ✓ Tercapai
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {w.target_date && (
                                        <div className="mt-auto pt-2 md:pt-2.5 border-t border-slate-100 dark:border-white/5">
                                            <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-muted-foreground">
                                                <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
                                                <span className="truncate">
                                                    <span className="hidden md:inline">
                                                        Target:{' '}
                                                    </span>
                                                    {formatDateShortWIB(
                                                        w.target_date
                                                    )}
                                                </span>
                                            </div>
                                            {w.reason && (
                                                <p className="hidden md:block text-[11px] text-muted-foreground line-clamp-1 italic leading-relaxed mt-1">
                                                    &quot;{w.reason}&quot;
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}

            {/* ============ MOBILE FILTER SHEET ============ */}
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                <SheetContent side="bottom" className="md:hidden">
                    <SheetHeader>
                        <SheetTitle>Filter Prioritas</SheetTitle>
                        <SheetDescription>
                            Pilih prioritas yang mau ditampilkan.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="px-4 pb-6 pt-2 space-y-2">
                        {availableFilters.map((f) => {
                            const count = getPriorityCount(f.value)
                            const isActive = filterPriority === f.value
                            return (
                                <button
                                    key={f.value}
                                    type="button"
                                    onClick={() => {
                                        setFilterPriority(f.value)
                                        setFilterOpen(false)
                                    }}
                                    className={cn(
                                        'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer',
                                        isActive
                                            ? 'bg-brand/5 border-brand/40'
                                            : 'bg-card border-slate-200 dark:border-white/10 hover:border-brand/30'
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'text-sm font-medium',
                                            isActive &&
                                            'text-brand font-semibold'
                                        )}
                                    >
                                        {f.label}
                                    </span>
                                    <span
                                        className={cn(
                                            'text-xs tabular-nums font-medium',
                                            isActive
                                                ? 'text-brand'
                                                : 'text-slate-500 dark:text-slate-400'
                                        )}
                                    >
                                        {count}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </SheetContent>
            </Sheet>

            {/* ============ MOBILE SORT SHEET ============ */}
            <Sheet open={sortOpen} onOpenChange={setSortOpen}>
                <SheetContent side="bottom" className="md:hidden">
                    <SheetHeader>
                        <SheetTitle>Urutkan</SheetTitle>
                        <SheetDescription>
                            Pilih urutan tampilan.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="px-4 pb-6 pt-2 space-y-2">
                        {SORT_OPTIONS.map((s) => {
                            const isActive = sortBy === s.value
                            return (
                                <button
                                    key={s.value}
                                    type="button"
                                    onClick={() => {
                                        setSortBy(s.value)
                                        setSortOpen(false)
                                    }}
                                    className={cn(
                                        'w-full text-left px-4 py-3 rounded-xl border transition-all cursor-pointer',
                                        isActive
                                            ? 'bg-brand/5 border-brand/40'
                                            : 'bg-card border-slate-200 dark:border-white/10 hover:border-brand/30'
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'text-sm font-medium',
                                            isActive &&
                                            'text-brand font-semibold'
                                        )}
                                    >
                                        {s.label}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </SheetContent>
            </Sheet>

            {/* ============ CREATE MODAL ============ */}
            {isMobile ? (
                <Sheet open={createOpen} onOpenChange={setCreateOpen}>
                    <SheetContent
                        side="bottom"
                        className="max-h-[92vh] overflow-y-auto"
                    >
                        <SheetHeader>
                            <SheetTitle>Tambah Wishlist</SheetTitle>
                            <SheetDescription>
                                Cooling-off 3 hari otomatis aktif setelah
                                ditambah.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="px-4 pb-6 pt-2">
                            <WishlistForm
                                profileId={profileId}
                                wishlist={null}
                                onSuccess={() => setCreateOpen(false)}
                                onCancel={() => setCreateOpen(false)}
                            />
                        </div>
                    </SheetContent>
                </Sheet>
            ) : (
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Tambah Wishlist</DialogTitle>
                            <DialogDescription>
                                Cooling-off 3 hari otomatis aktif setelah
                                ditambah.
                            </DialogDescription>
                        </DialogHeader>
                        <WishlistForm
                            profileId={profileId}
                            wishlist={null}
                            onSuccess={() => setCreateOpen(false)}
                            onCancel={() => setCreateOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}