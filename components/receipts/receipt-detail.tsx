'use client'

import { useState } from 'react'
import { ExternalLink, Eye, Store, X, ZoomIn } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'
import type { ParsedReceipt } from '@/lib/ocr/types'

type ReceiptRow = Database['public']['Tables']['receipts']['Row']

export function ReceiptDetail({ receipt }: { receipt: ReceiptRow }) {
    const parsed = receipt.parsed_data as ParsedReceipt | null
    const [showFullImage, setShowFullImage] = useState(false)
    const [imageError, setImageError] = useState(false)
    const imageUrl = `/api/ocr/file/${receipt.id}`

    if (!parsed) {
        return (
            <>
                <DialogHeader className="p-6 pb-4 border-b border-slate-200 dark:border-white/15 shrink-0">
                    <DialogTitle>Detail Struk</DialogTitle>
                    <DialogDescription>
                        {receipt.error_message || 'Tidak ada data'}
                    </DialogDescription>
                </DialogHeader>
            </>
        )
    }

    return (
        <>
            {/* HEADER */}
            <DialogHeader className="p-5 md:p-6 pb-4 border-b border-slate-200 dark:border-white/15 shrink-0 pr-12">
                <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Store className="w-4 h-4 md:w-5 md:h-5 text-brand shrink-0" />
                    <span className="truncate">{parsed.merchant || 'Tanpa nama'}</span>
                </DialogTitle>
                <DialogDescription className="text-xs">
                    Di-scan{' '}
                    {new Date(receipt.created_at).toLocaleString('id-ID', {
                        timeZone: 'Asia/Jakarta',
                    })}
                </DialogDescription>
            </DialogHeader>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6 pt-4 space-y-4">
                {/* IMAGE PREVIEW */}
                {imageUrl && !imageError && (
                    <button
                        type="button"
                        onClick={() => setShowFullImage(true)}
                        className={cn(
                            'group relative block w-full rounded-xl overflow-hidden cursor-pointer',
                            'bg-slate-100 dark:bg-black/40',
                            'border border-slate-200 dark:border-white/15',
                            'hover:border-brand/40 dark:hover:border-brand/40 transition-colors'
                        )}
                    >
                        <img
                            src={imageUrl}
                            alt="Struk"
                            className="w-full max-h-48 md:max-h-64 object-contain"
                            loading="lazy"
                            onError={() => setImageError(true)}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 dark:bg-white/10 backdrop-blur-md rounded-full p-2.5 shadow-lg">
                                <ZoomIn className="w-5 h-5 text-brand dark:text-white" />
                            </div>
                        </div>
                    </button>
                )}

                {/* CONFIDENCE */}
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                        Confidence
                    </span>
                    <Badge
                        variant={
                            parsed.confidence >= 0.8
                                ? 'success'
                                : parsed.confidence >= 0.5
                                    ? 'warning'
                                    : 'danger'
                        }
                    >
                        {Math.round(parsed.confidence * 100)}%
                    </Badge>
                </div>

                {/* INFO GRID */}
                <div
                    className={cn(
                        'grid grid-cols-2 gap-3 p-3.5 rounded-xl border',
                        // Dark: kasih bg yang lebih terang + border lebih tegas
                        'bg-slate-50 dark:bg-white/[0.06]',
                        'border-slate-200 dark:border-white/15'
                    )}
                >
                    {parsed.date && <Info label="Tanggal" value={parsed.date} />}
                    {parsed.receiptNumber && (
                        <Info label="No. Struk" value={parsed.receiptNumber} />
                    )}
                    {parsed.merchantPhone && (
                        <Info label="Telepon" value={parsed.merchantPhone} />
                    )}
                    {parsed.currency && <Info label="Mata Uang" value={parsed.currency} />}
                </div>

                {/* ADDRESS */}
                {parsed.merchantAddress && (
                    <div
                        className={cn(
                            'p-3.5 rounded-xl border',
                            'bg-slate-50 dark:bg-white/[0.06]',
                            'border-slate-200 dark:border-white/15'
                        )}
                    >
                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Alamat
                        </p>
                        <p className="text-xs text-slate-700 dark:text-slate-200">
                            {parsed.merchantAddress}
                        </p>
                    </div>
                )}

                {/* ITEMS */}
                {parsed.items.length > 0 && (
                    <div
                        className={cn(
                            'rounded-xl border overflow-hidden',
                            'border-slate-200 dark:border-white/15'
                        )}
                    >
                        <div
                            className={cn(
                                'px-3.5 py-2 border-b',
                                'bg-slate-50 dark:bg-white/[0.06]',
                                'border-slate-200 dark:border-white/15'
                            )}
                        >
                            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Item ({parsed.items.length})
                            </p>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-white/[0.08]">
                            {parsed.items.map((item, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        'flex items-center justify-between py-2.5 px-3.5 text-xs gap-2',
                                        // Dark: background lebih terang dari dialog
                                        'bg-white dark:bg-white/[0.03]'
                                    )}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate text-slate-900 dark:text-white">
                                            {item.description}
                                        </p>
                                        <p className="text-slate-500 dark:text-slate-400">
                                            {item.quantity}x @{' '}
                                            {item.unitPrice.toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    <p className="font-semibold tabular-nums shrink-0 text-slate-900 dark:text-white">
                                        {item.total.toLocaleString('id-ID')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TOTAL — pakai gradient brand biar "pop" */}
                <div
                    className={cn(
                        'space-y-2 p-4 rounded-xl border-2',
                        // Light
                        'bg-gradient-to-br from-brand/5 to-brand/10 border-brand/20',
                        // Dark
                        'dark:from-brand/15 dark:to-brand/25 dark:border-brand/40'
                    )}
                >
                    {parsed.subtotal > 0 && (
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-600 dark:text-slate-300">
                                Subtotal
                            </span>
                            <span className="font-medium tabular-nums text-slate-900 dark:text-white">
                                {parsed.currency}{' '}
                                {parsed.subtotal.toLocaleString('id-ID')}
                            </span>
                        </div>
                    )}
                    {parsed.taxAmount > 0 && (
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-600 dark:text-slate-300">Pajak</span>
                            <span className="font-medium tabular-nums text-slate-900 dark:text-white">
                                {parsed.currency}{' '}
                                {parsed.taxAmount.toLocaleString('id-ID')}
                            </span>
                        </div>
                    )}
                    <div
                        className={cn(
                            'flex justify-between items-center pt-2 border-t',
                            'border-brand/20 dark:border-brand/30'
                        )}
                    >
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            Total
                        </span>
                        <span className="text-lg md:text-xl font-bold tabular-nums text-brand dark:text-sky-300">
                            {parsed.currency}{' '}
                            {parsed.totalAmount.toLocaleString('id-ID')}
                        </span>
                    </div>
                </div>

                {/* BUTTON — Buka di Tab Baru */}
                <a
                    href={imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                        'flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-colors border',
                        'border-brand/30 text-brand',
                        'hover:bg-brand/5 dark:border-brand/40 dark:text-sky-300 dark:hover:bg-brand/15'
                    )}
                >
                    <Eye className="w-4 h-4" />
                    Buka di Tab Baru
                    <ExternalLink className="w-3 h-3" />
                </a>

                {/* TRANSACTION LINK */}
                {receipt.transaction_id && (
                    <div className="text-xs text-center text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-white/10">
                        ✓ Terhubung ke transaksi
                    </div>
                )}
            </div>

            {/* FULL IMAGE VIEWER */}
            {imageUrl && showFullImage && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setShowFullImage(false)}
                >
                    <button
                        type="button"
                        onClick={() => setShowFullImage(false)}
                        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors cursor-pointer"
                        aria-label="Tutup"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                    <img
                        src={imageUrl}
                        alt="Struk"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    )
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                {label}
            </p>
            <p className="text-slate-900 dark:text-white truncate text-sm">
                {value}
            </p>
        </div>
    )
}