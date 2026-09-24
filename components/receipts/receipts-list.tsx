'use client'

import { useState, useMemo, useEffect } from 'react'
import {
    Receipt as ReceiptIcon,
    Search,
    X,
    Trash2,
    ImageOff,
    CheckCircle2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { ReceiptDetail } from './receipt-detail'
import { AnimatedCheckbox } from '@/components/ui/animated-checkbox'
import { Pagination } from '@/components/shared/pagination'
import { BulkActionBar } from '@/components/shared/bulk-action-bar'
import { useConfirmDialog } from '@/components/ui/confirm-dialog'
import { usePagination } from '@/lib/hooks/use-pagination'
import { useReceipts } from '@/lib/hooks/use-receipts'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'
import type { ParsedReceipt } from '@/lib/ocr/types'

type ReceiptRow = Database['public']['Tables']['receipts']['Row']

type ReceiptsListProps = {
    receipts: ReceiptRow[]
}

function formatRelativeDate(dateStr: string): string {
    const d = new Date(dateStr)
    const now = new Date()

    const dWIB = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
    const todayWIB = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayWIB = yesterday.toLocaleDateString('en-CA', {
        timeZone: 'Asia/Jakarta',
    })

    if (dWIB === todayWIB) {
        return d.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Jakarta',
        })
    }
    if (dWIB === yesterdayWIB) return 'Kemarin'

    return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        timeZone: 'Asia/Jakarta',
    })
}

export function ReceiptsList({ receipts }: ReceiptsListProps) {
    const [selected, setSelected] = useState<ReceiptRow | null>(null)
    const [search, setSearch] = useState('')
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

    const { bulkDeleteReceipts } = useReceipts()
    const { confirm, Dialog: ConfirmDialog } = useConfirmDialog()

    const filtered = useMemo(() => {
        if (!search) return receipts
        const q = search.toLowerCase()
        return receipts.filter((r) => {
            const parsed = r.parsed_data as ParsedReceipt | null
            const merchant = parsed?.merchant?.toLowerCase() || ''
            const date = parsed?.date?.toLowerCase() || ''
            return merchant.includes(q) || date.includes(q)
        })
    }, [receipts, search])

    const pagination = usePagination(filtered, 18)
    const {
        page,
        perPage,
        totalItems,
        totalPages,
        paginatedItems,
        setPage,
        setPerPage,
        reset: resetPage,
    } = pagination

    useEffect(() => {
        resetPage()
    }, [search])

    const pageIds = paginatedItems.map((r) => r.id)
    const allOnPageSelected =
        pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id))
    const someOnPageSelected =
        !allOnPageSelected && pageIds.some((id) => selectedIds.has(id))

    function toggleSelectAllOnPage() {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (allOnPageSelected) {
                pageIds.forEach((id) => next.delete(id))
            } else {
                pageIds.forEach((id) => next.add(id))
            }
            return next
        })
    }

    function toggleSelect(id: string) {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    function clearSelection() {
        setSelectedIds(new Set())
    }

    function handleBulkDelete() {
        if (selectedIds.size === 0) return
        const count = selectedIds.size

        confirm({
            title: `Hapus ${count} struk?`,
            description:
                'Struk yang dihapus gak bisa di-restore. Data transaksi terkait tetap aman.',
            confirmLabel: 'Hapus',
            variant: 'destructive',
            onConfirm: async () => {
                const result = await bulkDeleteReceipts(Array.from(selectedIds))
                if (result.success) {
                    clearSelection()
                }
            },
        })
    }

    function handleImageError(id: string) {
        setImageErrors((prev) => new Set(prev).add(id))
    }

    if (receipts.length === 0) {
        return (
            <Card>
                <CardContent>
                    <EmptyState
                        icon={ReceiptIcon}
                        title="Belum ada struk tersimpan"
                        description="Scan struk pertama lu dari form transaksi."
                    />
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            {/* Search + Select All */}
            <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input
                        placeholder="Cari merchant..."
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

                {paginatedItems.length > 0 && (
                    <div
                        onClick={toggleSelectAllOnPage}
                        className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer select-none shrink-0"
                    >
                        <AnimatedCheckbox
                            checked={allOnPageSelected}
                            indeterminate={someOnPageSelected && !allOnPageSelected}
                            onCheckedChange={toggleSelectAllOnPage}
                            ariaLabel="Pilih semua"
                        />
                        <span className="hidden sm:inline whitespace-nowrap">
                            {allOnPageSelected ? 'Terpilih' : 'Pilih semua'}
                        </span>
                    </div>
                )}
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <Card>
                    <CardContent>
                        <EmptyState
                            icon={Search}
                            title="Gak ada hasil"
                            description={`Gak nemu struk dengan keyword "${search}".`}
                        />
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 xl:gap-5">
                        {paginatedItems.map((r) => {
                            const parsed = r.parsed_data as ParsedReceipt | null
                            const isSelected = selectedIds.has(r.id)
                            const hasImageError = imageErrors.has(r.id)
                            const imageUrl = hasImageError ? null : `/api/ocr/file/${r.id}`

                            return (
                                <div
                                    key={r.id}
                                    onClick={() => setSelected(r)}
                                    className={cn(
                                        'group relative flex gap-3 md:gap-4 p-3 md:p-4 rounded-2xl transition-all cursor-pointer',
                                        'bg-card shadow-sm',
                                        'border',
                                        isSelected
                                            ? 'border-brand ring-2 ring-brand/20 shadow-lg'
                                            : 'border-slate-200/70 dark:border-white/15 hover:border-brand/40 hover:shadow-lg dark:hover:shadow-black/50'
                                    )}
                                >
                                    {/* Image */}
                                    <div className="relative w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5 shrink-0">
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt={parsed?.merchant || 'Struk'}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                loading="lazy"
                                                onError={() => handleImageError(r.id)}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                                                <ImageOff className="w-7 h-7" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        {/* Top: title + checkbox */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm md:text-base font-semibold truncate leading-tight">
                                                    {parsed?.merchant || 'Tanpa nama'}
                                                </p>
                                                <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 tabular-nums truncate mt-0.5 md:mt-1">
                                                    {formatRelativeDate(r.created_at)}
                                                    {parsed?.items && parsed.items.length > 0 && (
                                                        <> · {parsed.items.length} item</>
                                                    )}
                                                </p>
                                            </div>

                                            {/* Checkbox — kanan atas */}
                                            <div
                                                className="shrink-0"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <AnimatedCheckbox
                                                    checked={isSelected}
                                                    onCheckedChange={() => toggleSelect(r.id)}
                                                    ariaLabel={`Pilih ${parsed?.merchant || ''}`}
                                                />
                                            </div>
                                        </div>

                                        {/* Bottom: amount + badge checkmark */}
                                        <div className="flex items-end justify-between gap-2 mt-2">
                                            {parsed?.totalAmount ? (
                                                <p className="text-base md:text-lg font-bold tabular-nums text-brand truncate leading-tight">
                                                    {parsed.currency}{' '}
                                                    {parsed.totalAmount.toLocaleString('id-ID')}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-muted-foreground italic truncate">
                                                    No data
                                                </p>
                                            )}

                                            {/* Badge — kanan bawah (visual indicator, non-interactive) */}
                                            <div
                                                className={cn(
                                                    'w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center shrink-0',
                                                    'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                                                )}
                                                title="Struk berhasil diproses"
                                            >
                                                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <Pagination
                        page={page}
                        perPage={perPage}
                        totalItems={totalItems}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        onPerPageChange={setPerPage}
                    />
                </>
            )}

            {/* Bulk Action Bar */}
            <BulkActionBar
                selectedCount={selectedIds.size}
                totalOnPage={pageIds.length}
                onClearSelection={clearSelection}
                actions={[
                    {
                        label: 'Hapus',
                        icon: <Trash2 className="w-4 h-4" />,
                        onClick: handleBulkDelete,
                        variant: 'destructive',
                    },
                ]}
            />

            {/* Detail Dialog */}
            <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
                <DialogContent className="sm:max-w-lg max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
                    {selected && <ReceiptDetail receipt={selected} />}
                </DialogContent>
            </Dialog>

            {/* Confirm Dialog */}
            <ConfirmDialog />
        </>
    )
}