'use client'

import { useState } from 'react'
import { Plus, Trash2, ScanLine, Users, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Amount } from '@/components/ui/amount'
import { ReceiptScanner } from '@/components/receipts/receipt-scanner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { formatRupiah } from '@/lib/normalize'
import { cn } from '@/lib/utils'
import type {
    EventWizardData,
    ItemInput,
    ScanApplyMode,
} from '@/lib/split-bill/types'
import type { ParsedReceipt } from '@/lib/ocr/types'

type Step2ItemsProps = {
    data: EventWizardData
    update: (partial: Partial<EventWizardData>) => void
}

function newId() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID()
    }
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function Step2Items({ data, update }: Step2ItemsProps) {
    const { items, participants } = data
    const [pendingScan, setPendingScan] = useState<ParsedReceipt | null>(null)
    const [pendingReceiptId, setPendingReceiptId] = useState<string | null>(null)
    const [showAppendDialog, setShowAppendDialog] = useState(false)

    const subtotal = items.reduce(
        (sum, it) => sum + it.quantity * it.unit_price,
        0
    )

    function addItem() {
        update({
            items: [
                ...items,
                {
                    temp_id: newId(),
                    name: '',
                    quantity: 1,
                    unit_price: 0,
                    assigned_to: participants.map((p) => p.temp_id),
                },
            ],
        })
    }

    function updateItem(tempId: string, patch: Partial<ItemInput>) {
        update({
            items: items.map((it) =>
                it.temp_id === tempId ? { ...it, ...patch } : it
            ),
        })
    }

    function removeItem(tempId: string) {
        update({ items: items.filter((it) => it.temp_id !== tempId) })
    }

    function toggleAssignment(tempId: string, participantId: string) {
        update({
            items: items.map((it) => {
                if (it.temp_id !== tempId) return it
                const isAssigned = it.assigned_to.includes(participantId)
                return {
                    ...it,
                    assigned_to: isAssigned
                        ? it.assigned_to.filter((id) => id !== participantId)
                        : [...it.assigned_to, participantId],
                }
            }),
        })
    }

    // ============ Scan Handler ============
    function handleScanned(
        parsed: ParsedReceipt,
        receiptId: string | null,
        _suggestedCategoryId: string | null
    ) {
        if (items.length > 0) {
            // Tanya Append/Replace
            setPendingScan(parsed)
            setPendingReceiptId(receiptId)
            setShowAppendDialog(true)
            return
        }
        applyScan(parsed, receiptId, 'append')
    }

    function applyScan(
        parsed: ParsedReceipt,
        receiptId: string | null,
        mode: ScanApplyMode
    ) {
        const allParticipantIds = participants.map((p) => p.temp_id)

        const newItems: ItemInput[] = parsed.items.map((it) => ({
            temp_id: newId(),
            name: it.description,
            quantity: it.quantity,
            unit_price: it.unitPrice || it.total / it.quantity || 0,
            assigned_to: allParticipantIds,
        }))

        const nextItems =
            mode === 'replace' ? newItems : [...items, ...newItems]

        // Auto-fill event name kalau masih kosong
        const nextName = data.name.trim() || parsed.merchant || ''

        // Auto-detect PPN rate dari tax/subtotal
        let nextPpnRate = data.ppn_rate
        if (parsed.taxAmount > 0 && parsed.subtotal > 0) {
            nextPpnRate = parsed.taxAmount / parsed.subtotal
        }

        // Track receipt IDs
        const nextReceiptIds = receiptId
            ? [...data.receipt_ids, receiptId]
            : data.receipt_ids

        update({
            items: nextItems,
            name: nextName,
            ppn_rate: nextPpnRate,
            receipt_ids: nextReceiptIds,
        })

        setPendingScan(null)
        setPendingReceiptId(null)
        setShowAppendDialog(false)
    }

    return (
        <div className="space-y-4">
            {/* Header + Scan button */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            Items
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Tambah manual atau scan struk
                        </p>
                    </div>
                </div>

                <ReceiptScanner onScanned={handleScanned} />

                {data.receipt_ids.length > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-2">
                        ✓ {data.receipt_ids.length} struk ter-scan
                    </p>
                )}
            </div>

            {/* Items list */}
            {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/15 bg-card p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        Belum ada item. Scan struk atau tambah manual.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item, idx) => {
                        const lineTotal = item.quantity * item.unit_price

                        return (
                            <div
                                key={item.temp_id}
                                className="rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-4 space-y-3"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Item {idx + 1}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() => removeItem(item.temp_id)}
                                        className="text-slate-400 hover:text-red-500"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>

                                <Input
                                    placeholder="Nama item"
                                    value={item.name}
                                    onChange={(e) =>
                                        updateItem(item.temp_id, { name: e.target.value })
                                    }
                                />

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                                            Qty
                                        </label>
                                        <Input
                                            type="number"
                                            inputMode="decimal"
                                            value={item.quantity || ''}
                                            onChange={(e) =>
                                                updateItem(item.temp_id, {
                                                    quantity:
                                                        e.target.value === ''
                                                            ? 0
                                                            : Number(e.target.value),
                                                })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                                            Harga
                                        </label>
                                        <CurrencyInput
                                            value={item.unit_price}
                                            onChange={(v) =>
                                                updateItem(item.temp_id, { unit_price: v })
                                            }
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="flex items-center justify-between text-xs pt-1">
                                    <span className="text-slate-500 dark:text-slate-400">
                                        Subtotal
                                    </span>
                                    <Amount
                                        value={lineTotal}
                                        className="text-sm font-bold text-slate-900 dark:text-white"
                                    />
                                </div>

                                {/* Assignment */}
                                <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <Users className="w-3 h-3 text-slate-400" />
                                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Untuk siapa?
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {participants.map((p) => {
                                            const isAssigned = item.assigned_to.includes(p.temp_id)
                                            return (
                                                <button
                                                    key={p.temp_id}
                                                    type="button"
                                                    onClick={() =>
                                                        toggleAssignment(item.temp_id, p.temp_id)
                                                    }
                                                    className={cn(
                                                        'px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer',
                                                        isAssigned
                                                            ? 'bg-brand text-white shadow-sm'
                                                            : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                                                    )}
                                                >
                                                    {p.display_name || 'Tanpa nama'}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    {item.assigned_to.length === 0 && (
                                        <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5">
                                            ⚠️ Belum ada assignee — bakal dibagi rata ke semua
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Add button */}
            <Button
                type="button"
                variant="outline"
                onClick={addItem}
                className="w-full border-dashed"
            >
                <Plus className="w-4 h-4" />
                Tambah Item Manual
            </Button>

            {/* Subtotal summary */}
            {items.length > 0 && (
                <div className="rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-4 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Subtotal
                    </span>
                    <Amount
                        value={subtotal}
                        className="text-lg font-bold text-brand"
                    />
                </div>
            )}

            {/* ============ Append/Replace Dialog ============ */}
            <Dialog open={showAppendDialog} onOpenChange={setShowAppendDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Struk baru terdeteksi</DialogTitle>
                        <DialogDescription>
                            Lu udah punya {items.length} item di event ini. Mau diapain?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3 text-xs">
                        <p className="font-semibold mb-1">
                            {pendingScan?.merchant || 'Struk baru'}
                        </p>
                        <p className="text-muted-foreground">
                            {pendingScan?.items.length || 0} item · Total{' '}
                            {pendingScan
                                ? formatRupiah(pendingScan.totalAmount)
                                : ''}
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                        <Button
                            variant="primary"
                            onClick={() => {
                                if (pendingScan)
                                    applyScan(pendingScan, pendingReceiptId, 'append')
                            }}
                        >
                            <Plus className="w-4 h-4" />
                            Tambahkan (Append)
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (pendingScan)
                                    applyScan(pendingScan, pendingReceiptId, 'replace')
                            }}
                        >
                            <X className="w-4 h-4" />
                            Ganti Semua (Replace)
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setPendingScan(null)
                                setPendingReceiptId(null)
                                setShowAppendDialog(false)
                            }}
                        >
                            Batal
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}