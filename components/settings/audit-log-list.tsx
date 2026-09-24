'use client'

import { useState, useMemo } from 'react'
import {
    Search,
    ScrollText,
    Plus,
    Pencil,
    Trash2,
    RotateCcw,
    Archive,
    ArchiveRestore,
    ChevronRight,
    X,
    SlidersHorizontal,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { DateFilter } from '@/components/shared/date-filter'
import {
    type DateRange,
    EMPTY_DATE_RANGE,
    isDateInRange,
} from '@/lib/utils/date-range'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type AuditLog = Database['public']['Tables']['audit_logs']['Row']

type AuditLogListProps = {
    logs: AuditLog[]
}

const ACTION_META: Record<string, { icon: any; color: string; label: string }> = {
    create: { icon: Plus, color: 'text-emerald-600 bg-emerald-500/10', label: 'Dibuat' },
    update: { icon: Pencil, color: 'text-blue-600 bg-blue-500/10', label: 'Diubah' },
    delete: { icon: Trash2, color: 'text-red-600 bg-red-500/10', label: 'Dihapus' },
    restore: { icon: RotateCcw, color: 'text-amber-600 bg-amber-500/10', label: 'Direstore' },
    archive: { icon: Archive, color: 'text-slate-600 bg-slate-500/10', label: 'Diarsipkan' },
    unarchive: { icon: ArchiveRestore, color: 'text-sky-600 bg-sky-500/10', label: 'Diaktifkan' },
}

const ENTITY_LABELS: Record<string, string> = {
    accounts: 'Akun',
    transactions: 'Transaksi',
    categories: 'Kategori',
    tags: 'Tag',
    contacts: 'Kontak',
    profiles: 'Profile',
    receipts: 'Struk',
    budgets: 'Budget',
    envelopes: 'Envelope',
    daily_budget_items: 'Daily Budget',
    goals: 'Goal',
    wishlists: 'Wishlist',
    recurring: 'Recurring',
    subscriptions: 'Langganan',
    assets: 'Aset',
    debts: 'Utang',
    tax_records: 'Pajak',
    zakat_records: 'Zakat',
    documents: 'Dokumen',
    trips: 'Trip',
    gifts: 'Gift',
    events: 'Split Bill',
}

function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    const today = new Date()

    const dateWIB = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
    const todayWIB = today.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
    const isToday = dateWIB === todayWIB

    if (isToday) {
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Jakarta',
        })
    }

    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
    })
}

function getEntityDisplayName(log: AuditLog): string {
    const data = (log.new_data || log.old_data) as any
    if (!data) return 'Tanpa nama'

    return (
        data.name ||
        data.title ||
        data.description ||
        data.merchant ||
        data.email ||
        (data.amount ? `Rp ${Number(data.amount).toLocaleString('id-ID')}` : null) ||
        log.entity_id?.slice(0, 8) ||
        'Tanpa nama'
    )
}

export function AuditLogList({ logs }: AuditLogListProps) {
    const [search, setSearch] = useState('')
    const [filterAction, setFilterAction] = useState<string>('all')
    const [filterEntity, setFilterEntity] = useState<string>('all')
    const [dateRange, setDateRange] = useState<DateRange>(EMPTY_DATE_RANGE)
    const [selected, setSelected] = useState<AuditLog | null>(null)
    const [filterOpen, setFilterOpen] = useState(false)

    const entityTypes = useMemo(() => {
        const set = new Set(logs.map((l) => l.entity_type))
        return Array.from(set).sort()
    }, [logs])

    const filtered = useMemo(() => {
        return logs.filter((log) => {
            if (filterAction !== 'all' && log.action !== filterAction) return false
            if (filterEntity !== 'all' && log.entity_type !== filterEntity) return false
            if (!isDateInRange(log.created_at, dateRange)) return false
            if (search) {
                const name = getEntityDisplayName(log).toLowerCase()
                if (!name.includes(search.toLowerCase())) return false
            }
            return true
        })
    }, [logs, filterAction, filterEntity, search, dateRange])

    const hasActiveFilter =
        filterAction !== 'all' ||
        filterEntity !== 'all' ||
        dateRange.preset !== 'all'

    function resetFilters() {
        setFilterAction('all')
        setFilterEntity('all')
        setDateRange(EMPTY_DATE_RANGE)
    }

    if (logs.length === 0) {
        return (
            <Card>
                <CardContent>
                    <EmptyState
                        icon={ScrollText}
                        title="Belum ada aktivitas"
                        description="Audit log bakal muncul otomatis setiap ada perubahan data."
                    />
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            {/* Compact search + filter */}
            <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input
                        placeholder="Cari..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-9 h-10"
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

                {/* Mobile: filter button + sheet */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setFilterOpen(true)}
                    className="md:hidden relative shrink-0"
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    {hasActiveFilter && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand ring-2 ring-background" />
                    )}
                </Button>

                {/* Desktop: date filter dulu */}
                <div className="hidden md:block">
                    <DateFilter
                        value={dateRange}
                        onChange={setDateRange}
                        className="md:w-44 h-10"
                    />
                </div>

                <Select value={filterAction} onValueChange={setFilterAction}>
                    <SelectTrigger className="hidden md:flex md:w-40 h-10">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Aksi</SelectItem>
                        <SelectItem value="create">Dibuat</SelectItem>
                        <SelectItem value="update">Diubah</SelectItem>
                        <SelectItem value="delete">Dihapus</SelectItem>
                        <SelectItem value="restore">Direstore</SelectItem>
                        <SelectItem value="archive">Diarsipkan</SelectItem>
                        <SelectItem value="unarchive">Diaktifkan</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={filterEntity} onValueChange={setFilterEntity}>
                    <SelectTrigger className="hidden md:flex md:w-44 h-10">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Tabel</SelectItem>
                        {entityTypes.map((e) => (
                            <SelectItem key={e} value={e}>
                                {ENTITY_LABELS[e] || e}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Active chips */}
            {hasActiveFilter && (
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {filterAction !== 'all' && (
                        <Badge variant="default" className="gap-1">
                            {ACTION_META[filterAction]?.label || filterAction}
                            <button
                                onClick={() => setFilterAction('all')}
                                className="cursor-pointer hover:opacity-70"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </Badge>
                    )}
                    {filterEntity !== 'all' && (
                        <Badge variant="default" className="gap-1">
                            {ENTITY_LABELS[filterEntity] || filterEntity}
                            <button
                                onClick={() => setFilterEntity('all')}
                                className="cursor-pointer hover:opacity-70"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </Badge>
                    )}
                    {dateRange.preset !== 'all' && (
                        <Badge variant="default" className="gap-1">
                            {dateRange.preset === 'today'
                                ? 'Hari ini'
                                : dateRange.preset === '7days'
                                    ? '7 hari'
                                    : dateRange.preset === '30days'
                                        ? '30 hari'
                                        : dateRange.preset === 'thisMonth'
                                            ? 'Bulan ini'
                                            : dateRange.preset === 'lastMonth'
                                                ? 'Bulan lalu'
                                                : 'Custom'}
                            <button
                                onClick={() => setDateRange(EMPTY_DATE_RANGE)}
                                className="cursor-pointer hover:opacity-70"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </Badge>
                    )}
                </div>
            )}

            {/* Result count */}
            <p className="text-xs text-muted-foreground mb-3">
                {filtered.length} dari {logs.length} aktivitas
            </p>

            {/* List */}
            {filtered.length === 0 ? (
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
                <Card>
                    <CardContent className="p-1.5">
                        <div className="space-y-0.5">
                            {filtered.map((log) => {
                                const meta = ACTION_META[log.action] || ACTION_META.update
                                const Icon = meta.icon
                                const entityLabel = ENTITY_LABELS[log.entity_type] || log.entity_type
                                const displayName = getEntityDisplayName(log)

                                return (
                                    <button
                                        key={log.id}
                                        type="button"
                                        onClick={() => setSelected(log)}
                                        className="group w-full flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left"
                                    >
                                        <div
                                            className={cn(
                                                'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                                                meta.color
                                            )}
                                        >
                                            <Icon className="w-4 h-4" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate leading-tight">
                                                {displayName}
                                            </p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                                {entityLabel} · {meta.label}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[11px] text-muted-foreground tabular-nums">
                                                {formatDate(log.created_at)}
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Mobile Filter Sheet */}
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                <SheetContent side="bottom" className="md:hidden">
                    <SheetHeader>
                        <SheetTitle>Filter</SheetTitle>
                        <SheetDescription>Saring audit log sesuai kebutuhan.</SheetDescription>
                    </SheetHeader>
                    <div className="px-4 pb-6 space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Aksi</label>
                            <Select value={filterAction} onValueChange={setFilterAction}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Aksi</SelectItem>
                                    <SelectItem value="create">Dibuat</SelectItem>
                                    <SelectItem value="update">Diubah</SelectItem>
                                    <SelectItem value="delete">Dihapus</SelectItem>
                                    <SelectItem value="restore">Direstore</SelectItem>
                                    <SelectItem value="archive">Diarsipkan</SelectItem>
                                    <SelectItem value="unarchive">Diaktifkan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Tabel</label>
                            <Select value={filterEntity} onValueChange={setFilterEntity}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Tabel</SelectItem>
                                    {entityTypes.map((e) => (
                                        <SelectItem key={e} value={e}>
                                            {ENTITY_LABELS[e] || e}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Tanggal</label>
                            <DateFilter value={dateRange} onChange={setDateRange} fullWidth />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    resetFilters()
                                    setFilterOpen(false)
                                }}
                            >
                                Reset
                            </Button>
                            <Button className="flex-1" onClick={() => setFilterOpen(false)}>
                                Terapkan
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Detail Dialog */}
            <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                    {selected && <AuditLogDetail log={selected} />}
                </DialogContent>
            </Dialog>
        </>
    )
}

function AuditLogDetail({ log }: { log: AuditLog }) {
    const meta = ACTION_META[log.action] || ACTION_META.update
    const Icon = meta.icon
    const entityLabel = ENTITY_LABELS[log.entity_type] || log.entity_type

    const oldData = log.old_data as Record<string, any> | null
    const newData = log.new_data as Record<string, any> | null

    const changedFields = useMemo(() => {
        if (!oldData || !newData) return []
        const keys = new Set([...Object.keys(oldData), ...Object.keys(newData)])
        const changed: Array<{ key: string; old: any; new: any }> = []

        keys.forEach((key) => {
            const oldVal = oldData[key]
            const newVal = newData[key]
            if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                changed.push({ key, old: oldVal, new: newVal })
            }
        })

        return changed
    }, [oldData, newData])

    return (
        <>
            <DialogHeader className="p-5 md:p-6 pb-4 border-b border-slate-200 dark:border-white/10 shrink-0 pr-12">
                <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', meta.color)}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <DialogTitle className="text-base md:text-lg">
                            {meta.label} · {entityLabel}
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(log.created_at).toLocaleString('id-ID')}
                        </p>
                    </div>
                </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-5 md:p-6 pt-4 space-y-4">
                <div className="text-xs">
                    <span className="text-muted-foreground">Entity ID: </span>
                    <code className="text-[11px] bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded">
                        {log.entity_id || 'N/A'}
                    </code>
                </div>

                {log.action === 'create' && newData && (
                    <div>
                        <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-2">
                            Data yang dibuat
                        </p>
                        <DataTable data={newData} variant="new" />
                    </div>
                )}

                {log.action === 'delete' && oldData && (
                    <div>
                        <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider mb-2">
                            Data yang dihapus
                        </p>
                        <DataTable data={oldData} variant="old" />
                    </div>
                )}

                {['update', 'archive', 'unarchive', 'restore'].includes(log.action) && (
                    <>
                        {changedFields.length > 0 ? (
                            <div>
                                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-2">
                                    Field yang berubah ({changedFields.length})
                                </p>
                                <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
                                    {changedFields.map(({ key, old: oldVal, new: newVal }) => (
                                        <div key={key} className="p-3 space-y-2">
                                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                {key}
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-2">
                                                    <p className="text-[9px] font-semibold text-red-600 dark:text-red-400 uppercase mb-1">
                                                        Sebelum
                                                    </p>
                                                    <p className="text-xs text-red-900 dark:text-red-200 break-words">
                                                        {formatValue(oldVal)}
                                                    </p>
                                                </div>
                                                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-2">
                                                    <p className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase mb-1">
                                                        Sesudah
                                                    </p>
                                                    <p className="text-xs text-emerald-900 dark:text-emerald-200 break-words">
                                                        {formatValue(newVal)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground text-center py-4">
                                Gak ada perubahan field yang terdeteksi.
                            </p>
                        )}
                    </>
                )}
            </div>
        </>
    )
}

function DataTable({ data, variant }: { data: Record<string, any>; variant: 'old' | 'new' }) {
    const entries = Object.entries(data).filter(([_, v]) => v !== null && v !== undefined)

    return (
        <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
            {entries.map(([key, value]) => (
                <div key={key} className="flex items-start gap-3 py-2 px-3 text-xs">
                    <span className="text-muted-foreground font-mono shrink-0 w-32 truncate">
                        {key}
                    </span>
                    <span className="flex-1 break-words">{formatValue(value)}</span>
                </div>
            ))}
        </div>
    )
}

function formatValue(value: any): string {
    if (value === null || value === undefined) return '—'
    if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
}