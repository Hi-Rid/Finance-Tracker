'use client'

import { useState, useMemo, useEffect } from 'react'
import {
    Plus,
    Pencil,
    Archive,
    MoreVertical,
    ArchiveRestore,
    Search,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import { CategoryForm } from './category-form'
import { useCategories } from '@/lib/hooks/use-categories'
import { getCategoryIcon } from '@/lib/constants/category-icons'
import { GROUP_LABELS } from '@/lib/validators/category'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Category = Database['public']['Tables']['categories']['Row']

type CategoryListProps = {
    categories: Category[]
}

export function CategoryList({ categories }: CategoryListProps) {
    const isMobile = useMediaQuery('(max-width: 767px)')
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<Category | null>(null)
    const [search, setSearch] = useState('')
    const [tab, setTab] = useState<'expense' | 'income'>('expense')
    const [showArchived, setShowArchived] = useState(false)

    const { archiveCategory, unarchiveCategory } = useCategories()

    async function handleRestore(id: string) {
        await unarchiveCategory(id)
        setShowArchived(false)
    }

    // Filter kategori
    const filtered = useMemo(() => {
        return categories.filter((c) => {
            if (c.type !== tab) return false
            if (c.is_archived !== showArchived) return false
            if (search && !c.name.toLowerCase().includes(search.toLowerCase()))
                return false
            return true
        })
    }, [categories, tab, search, showArchived])

    // Group by group_name
    const grouped = useMemo(() => {
        const map = new Map<string, Category[]>()
        for (const c of filtered) {
            if (!map.has(c.group_name)) map.set(c.group_name, [])
            map.get(c.group_name)!.push(c)
        }
        return Array.from(map.entries()).sort((a, b) => {
            const order = ['needs', 'wants', 'invest', 'savings', 'debt', 'donation', 'tax', 'zakat', 'income', 'other']
            return order.indexOf(a[0]) - order.indexOf(b[0])
        })
    }, [filtered])

    const archivedCount = categories.filter((c) => c.is_archived).length
    // Auto-reset ke view aktif kalo arsip kosong
    useEffect(() => {
        if (showArchived && archivedCount === 0) {
            setShowArchived(false)
        }
    }, [showArchived, archivedCount])

    function openCreate() {
        setEditing(null)
        setOpen(true)
    }

    function openEdit(category: Category) {
        setEditing(category)
        setOpen(true)
    }

    function closeForm() {
        setOpen(false)
        setEditing(null)
    }

    const formContent = (
        <CategoryForm
            category={editing}
            onSuccess={closeForm}
            onCancel={closeForm}
        />
    )

    return (
        <>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                    <h3 className="text-base font-semibold mb-1">Kategori</h3>
                    <p className="text-xs text-muted-foreground">
                        Atur kategori untuk transaksi, budget, dan daily items
                    </p>
                </div>
                <Button onClick={openCreate} size="sm">
                    <Plus className="w-4 h-4" />
                    Tambah
                </Button>
            </div>

            {/* Tab Type */}
            <div className="flex gap-2 mb-4">
                <button
                    type="button"
                    onClick={() => setTab('expense')}
                    className={cn(
                        'flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all cursor-pointer',
                        tab === 'expense'
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/30'
                            : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                    )}
                >
                    Pengeluaran ({categories.filter((c) => c.type === 'expense' && !c.is_archived).length})
                </button>
                <button
                    type="button"
                    onClick={() => setTab('income')}
                    className={cn(
                        'flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all cursor-pointer',
                        tab === 'income'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30'
                            : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                    )}
                >
                    Pemasukan ({categories.filter((c) => c.type === 'income' && !c.is_archived).length})
                </button>
            </div>

            {/* Search + Archive toggle */}
            <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input
                        placeholder="Cari kategori..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                {archivedCount > 0 && (
                    <Button
                        variant={showArchived ? 'primary' : 'outline'}
                        onClick={() => setShowArchived((v) => !v)}
                        className="shrink-0"
                    >
                        <Archive className="w-4 h-4" />
                        {showArchived ? 'Lihat Aktif' : `Arsip (${archivedCount})`}
                    </Button>
                )}
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <Card>
                    <CardContent>
                        <EmptyState
                            icon={Plus}
                            title={showArchived ? 'Belum ada kategori diarsipkan' : 'Belum ada kategori'}
                            description={
                                search
                                    ? 'Coba keyword lain.'
                                    : showArchived
                                        ? 'Kategori yang lu arsipkan bakal muncul di sini.'
                                        : 'Tambah kategori baru biar bisa dipakai di transaksi.'
                            }
                            action={
                                !search && !showArchived ? (
                                    <Button onClick={openCreate} variant="primary" size="sm">
                                        <Plus className="w-4 h-4" />
                                        Tambah Kategori
                                    </Button>
                                ) : undefined
                            }
                        />
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-5">
                    {grouped.map(([groupName, items]) => (
                        <div key={groupName}>
                            <div className="flex items-center gap-2 mb-2 px-1">
                                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    {GROUP_LABELS[groupName] || groupName}
                                </p>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                    · {items.length}
                                </span>
                            </div>

                            <Card>
                                <CardContent className="p-1.5">
                                    <div className="space-y-0.5">
                                        {items.map((cat) => {
                                            const Icon = getCategoryIcon(cat.icon)

                                            return (
                                                <div
                                                    key={cat.id}
                                                    className="group flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                                >
                                                    <div
                                                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                                        style={{
                                                            backgroundColor: `${cat.color || '#334DAF'}20`,
                                                        }}
                                                    >
                                                        <Icon
                                                            className="w-4 h-4"
                                                            style={{ color: cat.color || '#334DAF' }}
                                                        />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">
                                                            {cat.name}
                                                        </p>
                                                    </div>

                                                    {cat.is_archived && (
                                                        <Badge variant="outline" className="text-[9px]">
                                                            Arsip
                                                        </Badge>
                                                    )}

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon-sm"
                                                                className="opacity-100 shrink-0"
                                                            >
                                                                <MoreVertical className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="min-w-[180px]">
                                                            {!cat.is_archived ? (
                                                                <>
                                                                    <DropdownMenuItem onSelect={() => openEdit(cat)} className="whitespace-nowrap">
                                                                        <Pencil className="w-4 h-4 mr-2 shrink-0" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onSelect={() => archiveCategory(cat.id)}
                                                                        className="text-red-600 focus:text-red-600 whitespace-nowrap"
                                                                    >
                                                                        <Archive className="w-4 h-4 mr-2 shrink-0" />
                                                                        Arsipkan
                                                                    </DropdownMenuItem>
                                                                </>
                                                            ) : (
                                                                <DropdownMenuItem
                                                                    onSelect={() => handleRestore(cat.id)}
                                                                    className="whitespace-nowrap"
                                                                >
                                                                    <ArchiveRestore className="w-4 h-4 mr-2 shrink-0" />
                                                                    Aktifkan Kembali
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            )}

            {/* Form */}
            {isMobile ? (
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle>{editing ? 'Edit Kategori' : 'Tambah Kategori'}</SheetTitle>
                            <SheetDescription>
                                {editing
                                    ? 'Update detail kategori ini.'
                                    : 'Bikin kategori baru untuk transaksi.'}
                            </SheetDescription>
                        </SheetHeader>
                        <div className="px-4 pb-6 pt-2">{formContent}</div>
                    </SheetContent>
                </Sheet>
            ) : (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle>
                            <DialogDescription>
                                {editing
                                    ? 'Update detail kategori ini.'
                                    : 'Bikin kategori baru untuk transaksi.'}
                            </DialogDescription>
                        </DialogHeader>
                        {formContent}
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}