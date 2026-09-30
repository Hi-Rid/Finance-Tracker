'use client'

import { useState, useRef, useEffect } from 'react'
import {
    Camera,
    Upload,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ScanLine,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Amount } from '@/components/ui/amount'
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
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import type { ParsedReceipt } from '@/lib/ocr/types'

type ReceiptScannerProps = {
    onScanned: (
        parsed: ParsedReceipt,
        receiptId: string | null,
        suggestedCategoryId: string | null
    ) => void
}

type ScanState = 'idle' | 'uploading' | 'success' | 'error'

export function ReceiptScanner({ onScanned }: ReceiptScannerProps) {
    const isMobile = useMediaQuery('(max-width: 767px)')

    const [open, setOpen] = useState(false)
    const [state, setState] = useState<ScanState>('idle')
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [result, setResult] = useState<ParsedReceipt | null>(null)
    const [receiptId, setReceiptId] = useState<string | null>(null)
    const [suggestedCategoryId, setSuggestedCategoryId] = useState<string | null>(
        null
    )
    const [picking, setPicking] = useState(false)

    const cameraInputRef = useRef<HTMLInputElement>(null)
    const uploadInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!picking) return
        const handleFocus = () => {
            setTimeout(() => setPicking(false), 150)
        }
        window.addEventListener('focus', handleFocus)
        return () => window.removeEventListener('focus', handleFocus)
    }, [picking])

    function reset() {
        setState('idle')
        setErrorMsg(null)
        setPreviewUrl(null)
        setResult(null)
        setReceiptId(null)
        setSuggestedCategoryId(null)
    }

    function openScanner() {
        reset()
        setOpen(true)
    }

    function closeScanner() {
        setOpen(false)
        setTimeout(reset, 300)
    }

    async function handleFile(file: File) {
        if (file.type.startsWith('image/')) {
            setPreviewUrl(URL.createObjectURL(file))
        } else {
            setPreviewUrl(null)
        }

        setState('uploading')
        setErrorMsg(null)

        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/ocr/scan', {
                method: 'POST',
                body: formData,
            })
            const data = await res.json()

            if (!res.ok) {
                setState('error')
                setErrorMsg(data.error || 'Gagal scan struk')
                return
            }

            setResult(data.parsed)
            setReceiptId(data.receiptId || null)
            setSuggestedCategoryId(data.suggestedCategoryId || null)
            setState('success')
        } catch (err: any) {
            setState('error')
            setErrorMsg(err?.message || 'Network error')
        }
    }

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) handleFile(file)
        e.target.value = ''
    }

    function handleConfirm() {
        if (result) {
            onScanned(result, receiptId, suggestedCategoryId)
            toast.success('Data struk diterapkan ke form')
            closeScanner()
        }
    }

    function handleCameraClick() {
        setPicking(true)
        cameraInputRef.current?.click()
    }

    function handleUploadClick() {
        setPicking(true)
        uploadInputRef.current?.click()
    }

    function handleInteractOutside(e: Event) {
        if (picking) {
            e.preventDefault()
        }
    }

    const content = (
        <div className="space-y-3">
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleInputChange}
                className="sr-only"
                tabIndex={-1}
            />
            <input
                ref={uploadInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleInputChange}
                className="sr-only"
                tabIndex={-1}
            />

            {/* ============ IDLE ============ */}
            {state === 'idle' && (
                <div className="grid grid-cols-2 md:grid-cols-1 gap-2.5">
                    <button
                        type="button"
                        onClick={handleCameraClick}
                        className={cn(
                            'md:hidden',
                            'group flex flex-col items-center justify-center gap-2.5 py-6 px-3 rounded-xl',
                            'bg-gradient-to-br from-brand/5 to-brand/10',
                            'border-2 border-dashed border-brand/30 hover:border-brand/60',
                            'transition-all active:scale-[0.98] cursor-pointer'
                        )}
                    >
                        <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
                            <Camera className="w-6 h-6 text-brand" />
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white">
                                Ambil Foto
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                Kamera HP
                            </p>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={handleUploadClick}
                        className={cn(
                            'group flex flex-col items-center justify-center gap-2.5 py-6 px-3 rounded-xl',
                            'bg-slate-50 dark:bg-white/5',
                            'border-2 border-dashed border-slate-300 dark:border-white/20',
                            'hover:border-brand/50 dark:hover:border-brand/50',
                            'transition-all active:scale-[0.98] cursor-pointer'
                        )}
                    >
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                            <Upload className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white">
                                Upload File
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                JPG, PNG, PDF
                            </p>
                        </div>
                    </button>
                </div>
            )}

            {/* ============ UPLOADING ============ */}
            {state === 'uploading' && (
                <div className="flex flex-col items-center justify-center py-6 px-3">
                    {previewUrl ? (
                        <div className="relative w-28 h-28 sm:w-36 sm:h-36 mb-4 rounded-xl overflow-hidden border-2 border-brand/30 shadow-lg">
                            <img
                                src={previewUrl}
                                alt="Receipt preview"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <ScanLine className="w-8 h-8 text-white animate-pulse" />
                            </div>
                        </div>
                    ) : (
                        <div className="w-28 h-28 sm:w-36 sm:h-36 mb-4 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-white/20">
                            <Loader2 className="w-8 h-8 text-brand animate-spin" />
                        </div>
                    )}
                    <div className="flex items-center gap-2 mb-1.5">
                        <Loader2 className="w-3.5 h-3.5 text-brand animate-spin" />
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                            Scanning struk...
                        </p>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center max-w-[240px] leading-relaxed">
                        Butuh 10-20 detik tergantung ukuran file.
                    </p>
                </div>
            )}

            {/* ============ ERROR ============ */}
            {state === 'error' && (
                <div className="flex flex-col items-center justify-center py-6 px-3">
                    <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mb-3">
                        <AlertCircle className="w-7 h-7 text-red-600 dark:text-red-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                        Gagal Scan Struk
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mb-4 max-w-[260px] leading-relaxed">
                        {errorMsg || 'Terjadi kesalahan. Coba lagi.'}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={closeScanner}
                            className="h-9"
                        >
                            Batal
                        </Button>
                        <Button size="sm" onClick={reset} className="h-9">
                            Coba Lagi
                        </Button>
                    </div>
                </div>
            )}

            {/* ============ SUCCESS ============ */}
            {state === 'success' && result && (
                <div className="space-y-3">
                    {/* Success banner */}
                    <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                                Struk berhasil di-scan!
                            </p>
                            <p className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                                Confidence: {Math.round(result.confidence * 100)}%
                            </p>
                        </div>
                    </div>

                    {/* Data table */}
                    <div className="rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-2.5 space-y-1.5">
                        <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                            Data yang di-extract
                        </p>
                        <DataRow label="Merchant" value={result.merchant} compact />
                        {result.category && (
                            <DataRow label="Kategori" value={result.category} compact />
                        )}
                        <DataRow
                            label="Tanggal"
                            value={
                                result.date
                                    ? `${result.date}${result.time ? ` · ${result.time}` : ''}`
                                    : null
                            }
                            compact
                        />
                        <DataRow
                            label="Total"
                            valueNode={
                                <span className="inline-flex items-center gap-1">
                                    <span className="text-[10px] font-medium text-slate-500">
                                        {result.currency}
                                    </span>
                                    <Amount
                                        value={result.totalAmount}
                                        className="text-sm font-bold text-brand"
                                    />
                                </span>
                            }
                            highlight
                            compact
                        />
                        {result.taxAmount > 0 && (
                            <DataRow
                                label="Pajak"
                                valueNode={
                                    <span className="inline-flex items-center gap-1">
                                        <span className="text-[10px] font-medium text-slate-500">
                                            {result.currency}
                                        </span>
                                        <Amount
                                            value={result.taxAmount}
                                            className="text-xs font-medium"
                                        />
                                    </span>
                                }
                                compact
                            />
                        )}
                        {result.receiptNumber && (
                            <DataRow
                                label="No. Struk"
                                value={result.receiptNumber}
                                compact
                            />
                        )}
                        {result.items.length > 0 && (
                            <div className="pt-1.5 mt-1.5 border-t border-slate-200 dark:border-white/10">
                                <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                                    {result.items.length} Item
                                </p>
                                <div className="space-y-0.5 max-h-28 overflow-y-auto">
                                    {result.items.map((item, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between text-[11px] gap-2"
                                        >
                                            <span className="text-slate-600 dark:text-slate-300 truncate flex-1">
                                                {item.quantity}x {item.description}
                                            </span>
                                            <Amount
                                                value={item.total}
                                                className="text-[11px] font-medium text-slate-900 dark:text-white shrink-0"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={reset}
                            className="flex-1 h-10"
                        >
                            Scan Ulang
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            className="flex-1 h-10 font-semibold"
                        >
                            Pakai Data Ini
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )

    return (
        <>
            <Button
                type="button"
                variant="outline"
                onClick={openScanner}
                className="w-full border-dashed border-brand/40 hover:border-brand/60 hover:bg-brand/5 text-brand h-10 text-sm"
            >
                <ScanLine className="w-4 h-4" />
                Scan Struk (OCR)
            </Button>

            {isMobile ? (
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetContent
                        side="bottom"
                        className="max-h-[85vh] overflow-y-auto"
                        onInteractOutside={handleInteractOutside}
                    >
                        <SheetHeader className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-white/5 space-y-1">
                            <SheetTitle className="text-base flex items-center gap-2">
                                <ScanLine className="w-4 h-4 text-brand" />
                                Scan Struk
                            </SheetTitle>
                            <SheetDescription className="text-xs">
                                Foto atau upload struk, kami extract datanya otomatis.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="px-4 pb-6 pt-3">{content}</div>
                    </SheetContent>
                </Sheet>
            ) : (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent
                        className="sm:max-w-md"
                        onInteractOutside={handleInteractOutside}
                    >
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <ScanLine className="w-4 h-4 text-brand" />
                                Scan Struk
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Upload struk biar kami extract datanya otomatis.
                            </DialogDescription>
                        </DialogHeader>
                        {content}
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}

function DataRow({
    label,
    value,
    valueNode,
    highlight = false,
    compact = false,
}: {
    label: string
    value?: string | null
    valueNode?: React.ReactNode
    highlight?: boolean
    compact?: boolean
}) {
    if (!value && !valueNode) return null
    return (
        <div
            className={cn(
                'flex items-start justify-between gap-3',
                compact ? 'text-[11px]' : 'text-xs'
            )}
        >
            <span className="text-slate-500 dark:text-slate-400 shrink-0">
                {label}
            </span>
            {valueNode ? (
                <span className="text-right shrink-0">{valueNode}</span>
            ) : (
                <span
                    className={cn(
                        'text-right font-medium truncate',
                        highlight
                            ? 'text-base font-bold text-brand tabular-nums'
                            : 'text-slate-900 dark:text-white'
                    )}
                >
                    {value}
                </span>
            )}
        </div>
    )
}