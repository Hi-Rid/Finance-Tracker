'use client'

import { useState, useMemo } from 'react'
import {
    Plus,
    MoreVertical,
    Pencil,
    Trash2,
    ExternalLink,
    Search,
    X,
    SlidersHorizontal,
    Snowflake,
    CheckCircle2,
    PiggyBank,
    ShoppingBag,
    Calendar,
    ArrowUpDown,
    Target,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Amount } from '@/components/ui/amount'
import { EmptyState } from '@/components/ui/empty-state'
import { HideAmountsButton } from '@/components/shared/hide-amounts-button'
import { WishlistImage } from './wishlist-image'
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
import { WishlistForm } from './wishlist-form'
import { useWishlists } from '@/lib/hooks/use-wishlists'
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
    urgent: {
        bg: 'bg-red-500',
        text: 'text-white',
        label: 'Urgent',
    },
    needs: {
        bg: 'bg-brand',
        text: 'text-white',
        label: 'Needs',
    },
    wants: {
        bg: 'bg-amber-500',
        text: 'text-white',
        label: 'Wants',
    },
    impulse: {
        bg: 'bg-purple-500',
        text: 'text-white',
        label: 'Impulse',
    },
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
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<Wishlist | null>(null)
    const [search, setSearch] = useState('')
    const [filterPriority, setFilterPriority] = useState<PriorityFilter>('all')
    const [sortBy, setSortBy] = useState<SortOption>('newest')
    const [filterOpen, setFilterOpen] = useState(false)
    const [sortOpen, setSortOpen] = useState(false)

    const { deleteWishlist } = useWishlists()

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
                        (STATUS_ORDER[a.status] || 99) - (STATUS_ORDER[b.status] || 99)
                    )
                case 'category':
                    return (a.category || '').localeCompare(b.category || '')
                default:
                    return 0
            }
        })

        return result
    }, [wishlists, search, filterPriority, sortBy])

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

    const totalTarget = filtered.reduce(
        (sum, w) => sum + Number(w.target_price),
        0
    )
    const totalSaved = filtered.reduce(
        (sum, w) => sum + Number(w.saved_amount),
        0
    )

    function openCreate() {
        setEditing(null)
        setOpen(true)
    }

    function openEdit(w: Wishlist) {
        setEditing(w)
        setOpen(true)
    }

    function closeForm() {
        setOpen(false)
        setEditing(null)
    }

    function handleDelete(w: Wishlist) {
        if (confirm(`Hapus wishlist "${w.name}"?`)) {
            deleteWishlist(w.id)
        }
    }

    const formContent = (
        <WishlistForm
            profileId={profileId}
            wishlist={editing}
            onSuccess={closeForm}
            onCancel={closeForm}
        />
    )

    return (
        <>
            {/* HEADER */}
            <div className="flex items-end justify-between gap-3 mb-4">
                <div className="min-w-0">
                    <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider mb-0.5 md:mb-1">
                        {filtered.length} item
                    </p>
                    <div className="flex items-baseline gap-1.5 md:gap-2 flex-wrap">
                        <span className="text-[10px] md:text-xs text-muted-foreground">
                            Target:
                        </span>
                        <Amount
                            value={totalTarget}
                            className="text-lg md:text-2xl font-bold truncate leading-none"
                        />
                    </div>
                    {totalSaved > 0 && (
                        <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <span>Tersimpan:</span>
                            <Amount
                                value={totalSaved}
                                className="inline text-[10px] md:text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                            />
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pb-0.5">
                    <HideAmountsButton size="icon-sm" />
                    <Button
                        onClick={openCreate}
                        variant="primary"
                        size="sm"
                        className="h-8"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Tambah</span>
                    </Button>
                </div>
            </div>

            {/* SEARCH + FILTER + SORT */}
            {wishlists.length > 0 && (
                <>
                    {/* Desktop */}
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
                                        {SORT_OPTIONS.find((s) => s.value === sortBy)?.label}
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[180px]">
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
                                            sortBy === s.value && 'bg-brand/5 dark:bg-brand/10'
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'text-sm',
                                                sortBy === s.value && 'font-semibold text-brand'
                                            )}
                                        >
                                            {s.label}
                                        </span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Mobile */}
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

            {/* LIST */}
            {wishlists.length === 0 ? (
                <Card>
                    <CardContent>
                        <EmptyState
                            icon={Plus}
                            title="Belum ada wishlist"
                            description="Catat barang yang pengen lu beli biar bisa direncanain dengan baik."
                            action={
                                <Button onClick={openCreate} variant="primary" size="sm">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {filtered.map((w) => {
                        const targetPrice = Number(w.target_price)
                        const savedAmount = Number(w.saved_amount)
                        const percent =
                            targetPrice > 0 ? (savedAmount / targetPrice) * 100 : 0
                        const remaining = Math.max(0, targetPrice - savedAmount)
                        const priorityStyle =
                            PRIORITY_BADGE[w.priority || 'wants'] ||
                            PRIORITY_BADGE.wants
                        const statusStyle = STATUS_BADGE[w.status] || STATUS_BADGE.planned
                        const StatusIcon = statusStyle.icon
                        const isCoolingOff = w.status === 'cooling_off'
                        const isPurchased = w.status === 'purchased'
                        const isCancelled = w.status === 'cancelled'
                        const isDone = isPurchased || isCancelled
                        const hasSavings = savedAmount > 0

                        return (
                            <div
                                key={w.id}
                                className={cn(
                                    'group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-card flex flex-col',
                                    'transition-all duration-300 hover:border-brand/40 hover:shadow-md',
                                    isDone && 'opacity-60'
                                )}
                            >
                                {/* IMAGE */}
                                <div className="relative">
                                    <WishlistImage
                                        imageUrl={w.image_url}
                                        alt={w.name}
                                        aspect="4:3"
                                    />

                                    {/* Priority badge */}
                                    <div className="absolute top-2 left-2">
                                        <span
                                            className={cn(
                                                'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm',
                                                priorityStyle.bg,
                                                priorityStyle.text
                                            )}
                                        >
                                            {priorityStyle.label}
                                        </span>
                                    </div>

                                    {/* Dropdown menu */}
                                    <div className="absolute top-2 right-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors cursor-pointer"
                                                    aria-label="Menu"
                                                >
                                                    <MoreVertical className="w-3.5 h-3.5" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                align="end"
                                                className="min-w-[160px]"
                                            >
                                                <DropdownMenuItem
                                                    onSelect={() => openEdit(w)}
                                                    className="whitespace-nowrap"
                                                >
                                                    <Pencil className="w-4 h-4 mr-2 shrink-0" />
                                                    Edit
                                                </DropdownMenuItem>
                                                {w.link && (
                                                    <DropdownMenuItem
                                                        onSelect={() => window.open(w.link!, '_blank')}
                                                        className="whitespace-nowrap"
                                                    >
                                                        <ExternalLink className="w-4 h-4 mr-2 shrink-0" />
                                                        Buka Link
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onSelect={() => handleDelete(w)}
                                                    className="text-red-600 focus:text-red-600 whitespace-nowrap"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2 shrink-0" />
                                                    Hapus
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* Cooling-off countdown */}
                                    {isCoolingOff && w.cooling_off_until && (
                                        <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-sky-500/95 backdrop-blur-sm shadow-sm flex items-center gap-1">
                                            <Snowflake className="w-3 h-3 text-white" />
                                            <span className="text-[10px] font-bold tabular-nums text-white">
                                                {formatCoolingOffCountdown(w.cooling_off_until)}
                                            </span>
                                        </div>
                                    )}

                                    {/* Savings % badge */}
                                    {hasSavings && (
                                        <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-emerald-500/95 backdrop-blur-sm shadow-sm flex items-center gap-1">
                                            <PiggyBank className="w-3 h-3 text-white" />
                                            <span className="text-[10px] font-bold tabular-nums text-white">
                                                {Math.round(percent)}%
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* CONTENT */}
                                <div className="p-3.5 flex-1 flex flex-col">
                                    {/* Nama */}
                                    <h4
                                        className={cn(
                                            'text-sm font-bold leading-tight mb-2 line-clamp-2',
                                            isDone && 'line-through text-muted-foreground'
                                        )}
                                    >
                                        {w.name}
                                    </h4>

                                    {/* Status + kategori */}
                                    <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                                        <span
                                            className={cn(
                                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider',
                                                statusStyle.bg,
                                                statusStyle.text
                                            )}
                                        >
                                            {StatusIcon && <StatusIcon className="w-2.5 h-2.5" />}
                                            {statusStyle.label}
                                        </span>
                                        {w.category && (
                                            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                                                {getCategoryLabel(w.category)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Harga target */}
                                    <div className="mb-3">
                                        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                                            Target Harga
                                        </p>
                                        <Amount
                                            value={targetPrice}
                                            className={cn(
                                                'text-base font-bold block',
                                                isDone ? 'text-muted-foreground' : 'text-brand'
                                            )}
                                        />
                                    </div>

                                    {/* Progress bar — SELALU tampil */}
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between text-[10px] mb-1.5 gap-2">
                                            <div className="flex items-center gap-1 min-w-0">
                                                <Target className="w-3 h-3 text-slate-400 shrink-0" />
                                                <span className="text-muted-foreground truncate">
                                                    Tersimpan
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-0.5 shrink-0 tabular-nums">
                                                <Amount
                                                    value={savedAmount}
                                                    className={cn(
                                                        'inline text-[10px] font-semibold',
                                                        hasSavings
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : 'text-slate-500 dark:text-slate-400'
                                                    )}
                                                />
                                                <span className="text-muted-foreground text-[10px]">
                                                    /
                                                </span>
                                                <Amount
                                                    value={targetPrice}
                                                    className="inline text-[10px] font-medium text-muted-foreground"
                                                />
                                            </div>
                                        </div>

                                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
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
                                                    width: `${Math.min(Math.max(percent, 0), 100)}%`,
                                                }}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between mt-1">
                                            <span
                                                className={cn(
                                                    'text-[9px] tabular-nums font-bold',
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
                                                <span className="text-[9px] text-muted-foreground tabular-nums flex items-center gap-0.5">
                                                    <span>Kurang</span>
                                                    <Amount
                                                        value={remaining}
                                                        className="inline text-[9px] font-semibold text-slate-600 dark:text-slate-400"
                                                    />
                                                </span>
                                            )}
                                            {percent >= 100 && !isDone && (
                                                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                                                    ✓ Target tercapai
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    {(w.target_date || w.reason) && (
                                        <div className="mt-auto pt-2.5 border-t border-slate-100 dark:border-white/5 space-y-1">
                                            {w.target_date && (
                                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                    <Calendar className="w-3 h-3 shrink-0" />
                                                    <span className="truncate">
                                                        Target: {formatDateShortWIB(w.target_date)}
                                                    </span>
                                                </div>
                                            )}
                                            {w.reason && (
                                                <p className="text-[10px] text-muted-foreground line-clamp-1 italic leading-relaxed">
                                                    &quot;{w.reason}&quot;
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* MOBILE FILTER SHEET */}
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
                                            isActive && 'text-brand font-semibold'
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

            {/* MOBILE SORT SHEET */}
            <Sheet open={sortOpen} onOpenChange={setSortOpen}>
                <SheetContent side="bottom" className="md:hidden">
                    <SheetHeader>
                        <SheetTitle>Urutkan</SheetTitle>
                        <SheetDescription>Pilih urutan tampilan.</SheetDescription>
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
                                            isActive && 'text-brand font-semibold'
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

            {/* FORM */}
            {isMobile ? (
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle>
                                {editing ? 'Edit Wishlist' : 'Tambah Wishlist'}
                            </SheetTitle>
                            <SheetDescription>
                                {editing
                                    ? 'Update detail wishlist ini.'
                                    : 'Cooling-off 3 hari otomatis aktif setelah ditambah.'}
                            </SheetDescription>
                        </SheetHeader>
                        <div className="px-4 pb-6 pt-2">{formContent}</div>
                    </SheetContent>
                </Sheet>
            ) : (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editing ? 'Edit Wishlist' : 'Tambah Wishlist'}
                            </DialogTitle>
                            <DialogDescription>
                                {editing
                                    ? 'Update detail wishlist ini.'
                                    : 'Cooling-off 3 hari otomatis aktif setelah ditambah.'}
                            </DialogDescription>
                        </DialogHeader>
                        {formContent}
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}