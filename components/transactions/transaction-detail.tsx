'use client'

import {
    TrendingUp,
    TrendingDown,
    ArrowLeftRight,
    Wallet,
    Target,
    Calendar,
    Clock,
    Store,
    Hash,
    FileText,
    Pencil,
    Trash2,
    Copy,
    Check,
    Receipt,
    ExternalLink,
} from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog'
import { ReceiptDetail } from '@/components/receipts/receipt-detail'
import { cn } from '@/lib/utils'
import { formatRupiah } from '@/lib/normalize'
import { formatDateLongWIB, formatTimeWIB } from '@/lib/utils/datetime'
import type { Database } from '@/types/database'

type Account = Database['public']['Tables']['accounts']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Transaction = Database['public']['Tables']['transactions']['Row']
type ReceiptRow = Database['public']['Tables']['receipts']['Row']

type TransactionDetailProps = {
    transaction: Transaction
    account?: Account
    toAccount?: Account
    category?: Category
    receipt?: ReceiptRow | null
    onEdit?: () => void
    onDelete?: () => void
    onDuplicate?: () => void
}

export function TransactionDetail({
    transaction,
    account,
    toAccount,
    category,
    receipt,
    onEdit,
    onDelete,
    onDuplicate,
}: TransactionDetailProps) {
    const [copied, setCopied] = useState(false)
    const [showReceipt, setShowReceipt] = useState(false)

    const isIncome = transaction.type === 'income'
    const isTransfer = transaction.type === 'transfer'

    const tanggal = formatDateLongWIB(transaction.date)
    const waktu = formatTimeWIB(transaction.date)

    const accent = isIncome
        ? {
            iconBg: 'from-emerald-400 to-emerald-600',
            icon: TrendingUp,
            amount: 'text-emerald-600 dark:text-emerald-400',
            prefix: '+',
            status: 'success' as const,
            statusLabel: 'Pemasukan',
        }
        : isTransfer
            ? {
                iconBg: 'from-primary-400 to-primary-700',
                icon: ArrowLeftRight,
                amount: 'text-brand',
                prefix: '',
                status: 'default' as const,
                statusLabel: 'Transfer',
            }
            : {
                iconBg: 'from-red-400 to-red-600',
                icon: TrendingDown,
                amount: 'text-red-600 dark:text-red-400',
                prefix: '−',
                status: 'danger' as const,
                statusLabel: 'Pengeluaran',
            }

    const Icon = accent.icon

    async function handleCopyId() {
        try {
            await navigator.clipboard.writeText(transaction.id)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // silent
        }
    }

    return (
        <>
            <div className="flex flex-col flex-1 min-h-0">
                {/* ============ HEADER ============ */}
                <div className="relative p-6 md:p-8 pb-5 border-b border-slate-200 dark:border-white/10">
                    <div
                        className={cn(
                            'w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-4',
                            'bg-gradient-to-br shadow-lg',
                            accent.iconBg,
                            'shadow-brand/20'
                        )}
                    >
                        <Icon className="w-7 h-7 md:w-8 md:h-8 text-white" strokeWidth={2.2} />
                    </div>

                    <h2 className="text-lg md:text-xl font-bold mb-1.5 pr-8">
                        {transaction.name}
                    </h2>

                    <div className="flex items-baseline gap-1 mb-3">
                        <span className={cn('text-2xl md:text-3xl font-bold', accent.amount)}>
                            {accent.prefix}
                            {formatRupiah(Number(transaction.amount_idr))}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={accent.status}>{accent.statusLabel}</Badge>
                        {transaction.status === 'pending' ? (
                            <Badge variant="warning">Pending</Badge>
                        ) : (
                            <Badge variant="success">Sukses</Badge>
                        )}
                        {transaction.exclude_from_daily_budget && (
                            <Badge variant="outline">no-daily</Badge>
                        )}
                        {transaction.exclude_from_budget && (
                            <Badge variant="outline">no-budget</Badge>
                        )}
                    </div>
                </div>

                {/* ============ CONTENT ============ */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 pt-5 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {isTransfer ? (
                            <>
                                <MetaRow
                                    icon={Wallet}
                                    label="Dari Akun"
                                    value={account?.name || '—'}
                                />
                                <MetaRow
                                    icon={Wallet}
                                    label="Ke Akun"
                                    value={toAccount?.name || '—'}
                                />
                            </>
                        ) : (
                            <>
                                <MetaRow
                                    icon={Wallet}
                                    label="Akun"
                                    value={account?.name || '—'}
                                />
                                <MetaRow
                                    icon={Target}
                                    label="Kategori"
                                    value={category?.name || '—'}
                                />
                            </>
                        )}

                        <MetaRow icon={Calendar} label="Tanggal" value={tanggal} />
                        <MetaRow icon={Clock} label="Waktu" value={waktu} />

                        {transaction.merchant && (
                            <MetaRow
                                icon={Store}
                                label="Merchant"
                                value={transaction.merchant}
                            />
                        )}
                    </div>

                    {/* Link ke struk asli (kalau hasil OCR) */}
                    {receipt && (
                        <button
                            type="button"
                            onClick={() => setShowReceipt(true)}
                            className={cn(
                                'group flex items-center gap-3 p-3.5 rounded-xl transition-all w-full text-left cursor-pointer',
                                'bg-brand/5 border border-brand/20',
                                'hover:bg-brand/10 hover:border-brand/40'
                            )}
                        >
                            <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                                <Receipt className="w-4 h-4 text-brand" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-brand">
                                    Lihat Struk Asli
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    Transaksi ini punya struk dari hasil scan OCR
                                </p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-brand shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </button>
                    )}

                    {/* Taxes */}
                    {(Number(transaction.ppn_amount) > 0 ||
                        Number(transaction.pph_amount) > 0) && (
                            <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                                <div className="bg-slate-50 dark:bg-white/5 px-4 py-2 border-b border-slate-200 dark:border-white/10">
                                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Pajak
                                    </p>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-white/5">
                                    {Number(transaction.ppn_amount) > 0 && (
                                        <TaxRow label="PPN" value={Number(transaction.ppn_amount)} />
                                    )}
                                    {Number(transaction.pph_amount) > 0 && (
                                        <TaxRow label="PPh" value={Number(transaction.pph_amount)} />
                                    )}
                                </div>
                            </div>
                        )}

                    {/* Notes */}
                    {transaction.note && (
                        <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Catatan
                                </p>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                {transaction.note}
                            </p>
                        </div>
                    )}

                    {/* Transaction ID */}
                    <button
                        type="button"
                        onClick={handleCopyId}
                        className="group w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 hover:border-brand/30 transition-colors cursor-pointer text-left"
                    >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                                    ID Transaksi
                                </p>
                                <p className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate">
                                    {transaction.id}
                                </p>
                            </div>
                        </div>
                        <div className="shrink-0">
                            {copied ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                                <Copy className="w-4 h-4 text-slate-400 group-hover:text-brand transition-colors" />
                            )}
                        </div>
                    </button>
                </div>

                {/* ============ ACTIONS ============ */}
                {(onEdit || onDelete || onDuplicate) && (
                    <div className="shrink-0 p-4 md:p-5 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex flex-row gap-2">
                        {onDelete && (
                            <Button
                                variant="outline"
                                onClick={onDelete}
                                className="flex-1 md:flex-initial md:mr-auto text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 border-red-200 dark:border-red-500/30"
                            >
                                <Trash2 className="w-4 h-4" />
                                Hapus
                            </Button>
                        )}
                        {onDuplicate && (
                            <Button
                                variant="outline"
                                onClick={onDuplicate}
                                className="flex-1 md:flex-initial"
                            >
                                <Copy className="w-4 h-4" />
                                Duplikat
                            </Button>
                        )}
                        {onEdit && (
                            <Button onClick={onEdit} className="flex-1 md:flex-initial">
                                <Pencil className="w-4 h-4" />
                                Edit
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* ============ RECEIPT DETAIL DIALOG (nested) ============ */}
            {receipt && (
                <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
                    <DialogContent
                        className="sm:max-w-lg max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden z-[70]"
                        overlayClassName="z-[65] bg-black/70 backdrop-blur-md"
                    >
                        <ReceiptDetail receipt={receipt} />
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}

function MetaRow({
    icon: Icon,
    label,
    value,
}: {
    icon: any
    label: string
    value: string
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                    {label}
                </p>
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {value}
                </p>
            </div>
        </div>
    )
}

function TaxRow({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex items-center justify-between py-2.5 px-4 text-sm">
            <span className="text-slate-600 dark:text-slate-400">{label}</span>
            <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                {formatRupiah(value)}
            </span>
        </div>
    )
}