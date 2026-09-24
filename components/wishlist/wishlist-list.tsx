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
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/ui/empty-state'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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
import { formatRupiah } from '@/lib/normalize'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import {
    PRIORITY_LABELS,
    PRIORITY_COLORS,
    STATUS_LABELS,
} from '@/lib/validators/wishlist'
import { getCategoryLabel } from '@/lib/constants/wishlist-categories'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Wishlist = Database['public']['Tables']['wishlists']['Row']

type WishlistListProps = {
    wishlists: Wishlist[]
    profileId: string
}

export function WishlistList({ wishlists, profileId }: WishlistListProps) {
    const isMobile = useMediaQuery('(max-width: 767px)')
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<Wishlist | null>(null)
    const [search, setSearch] = useState('')
    const [filterPriority, setFilterPriority] = useState<string>('all')

    const { deleteWishlist } = useWishlists()

    const filtered = useMemo(() => {
        return wishlists.filter((w) => {
            if (search && !w.name.toLowerCase().includes(search.toLowerCase()))
                return false
            if (filterPriority !== 'all' && w.priority !== filterPriority)
                return false
            return true
        })
    }, [wishlists, search, filterPriority])

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
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                    <h3 className="text-base font-semibold mb-0.5">Wishlist</h3>
                    <p className="text-xs text-muted-foreground">
                        {filtered.length} item · target {formatRupiah(totalTarget)}
                        {totalSaved > 0 && (
                            <> · tersimpan {formatRupiah(totalSaved)}</>
                        )}
                    </p>
                </div>
                <Button onClick={openCreate} size="sm">
                    <Plus className="w-4 h-4" />
                    Tambah
                </Button>
            </div>

            {/* Search + filter */}
            {wishlists.length > 0 && (
                <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
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
                    <div className="flex gap-1 shrink-0">
                        {['all', 'urgent', 'needs', 'wants', 'impulse'].map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setFilterPriority(p)}
                                className={cn(
                                    'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                                    filterPriority === p
                                        ? 'bg-brand text-white'
                                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                                )}
                            >
                                {p === 'all' ? 'Semua' : PRIORITY_LABELS[p]}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* List */}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filtered.map((w) => {
                        const priority = PRIORITY_COLORS[w.priority || 'wants']
                        const targetPrice = Number(w.target_price)
                        const savedAmount = Number(w.saved_amount)
                        const percent =
                            targetPrice > 0 ? (savedAmount / targetPrice) * 100 : 0

                        return (
                            <Card
                                key={w.id}
                                className="group relative overflow-hidden rounded-2xl p-0 gap-0"
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    'text-[10px] shrink-0',
                                                    priority.bg,
                                                    priority.text,
                                                    priority.border
                                                )}
                                            >
                                                {PRIORITY_LABELS[w.priority || 'wants']}
                                            </Badge>
                                            <Badge variant="outline" className="text-[10px] shrink-0">
                                                {STATUS_LABELS[w.status] || w.status}
                                            </Badge>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="opacity-100 shrink-0 -mt-1 -mr-1"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="min-w-[160px]">
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

                                    <h4 className="text-sm font-semibold truncate mb-1">
                                        {w.name}
                                    </h4>

                                    <p className="text-lg font-bold tabular-nums text-brand mb-3">
                                        {formatRupiah(targetPrice)}
                                    </p>

                                    {savedAmount > 0 && (
                                        <div className="mb-3">
                                            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                                                <span>Tersimpan {formatRupiah(savedAmount)}</span>
                                                <span className="tabular-nums">
                                                    {Math.round(percent)}%
                                                </span>
                                            </div>
                                            <Progress value={percent} variant="success" />
                                        </div>
                                    )}

                                    {w.category && (
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                            {getCategoryLabel(w.category)}
                                        </p>
                                    )}

                                    {w.reason && (
                                        <p className="text-[11px] text-muted-foreground line-clamp-2 italic">
                                            "{w.reason}"
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Form */}
            {isMobile ? (
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
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
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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