'use client'

import { useMemo, useState } from 'react'
import {
    Plus,
    HandCoins,
    TrendingDown,
    TrendingUp,
    Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Amount } from '@/components/ui/amount'
import { EmptyState } from '@/components/ui/empty-state'
import { useConfirmDialog } from '@/components/ui/confirm-dialog'
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
import { DebtCard } from './debt-card'
import { DebtForm } from './debt-form'
import { DebtPaymentModal } from './debt-payment-modal'
import { useDebts } from '@/lib/hooks/use-debts'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'
import type { DebtType } from '@/lib/validators/debts'

type Debt = Database['public']['Tables']['debts']['Row']
type Account = Database['public']['Tables']['accounts']['Row']

type Props = {
    debts: Debt[]
    accounts: Account[]
    profileId: string
}

type Filter = 'all' | DebtType

const FILTERS: { value: Filter; label: string }[] = [
    { value: 'all', label: 'Semua' },
    { value: 'debt', label: 'Utang' },
    { value: 'receivable', label: 'Piutang' },
]

type ModalState =
    | { type: 'none' }
    | { type: 'create' }
    | { type: 'edit'; debt: Debt }
    | { type: 'payment'; debt: Debt }

export function DebtsTab({ debts, accounts, profileId }: Props) {
    const isMobile = useMediaQuery('(max-width: 767px)')
    const { deleteDebt, updateStatus } = useDebts()
    const { confirm, Dialog: ConfirmDialog } = useConfirmDialog()
    const [filter, setFilter] = useState<Filter>('all')
    const [modal, setModal] = useState<ModalState>({ type: 'none' })

    const filtered = useMemo(() => {
        if (filter === 'all') return debts
        return debts.filter((d) => d.type === filter)
    }, [debts, filter])

    const stats = useMemo(() => {
        const active = debts.filter(
            (d) => d.status === 'active' || d.status === 'overdue'
        )
        const totalDebt = active
            .filter((d) => d.type === 'debt')
            .reduce((s, d) => s + Number(d.outstanding), 0)
        const totalReceivable = active
            .filter((d) => d.type === 'receivable')
            .reduce((s, d) => s + Number(d.outstanding), 0)
        const net = totalReceivable - totalDebt

        return {
            totalDebt,
            totalReceivable,
            net,
            activeCount: active.length,
        }
    }, [debts])

    function openCreate() {
        setModal({ type: 'create' })
    }

    function closeModal() {
        setModal({ type: 'none' })
    }

    function handleDelete(debt: Debt) {
        confirm({
            title: `Hapus "${debt.name}"?`,
            description:
                'Data utang/piutang beserta riwayat pembayarannya bakal dihapus permanen.',
            confirmLabel: 'Hapus',
            variant: 'destructive',
            onConfirm: async () => {
                await deleteDebt(debt.id)
            },
        })
    }

    function handleMarkPaid(debt: Debt) {
        confirm({
            title: `Tandai lunas "${debt.name}"?`,
            description:
                'Status bakal diubah jadi lunas. Outstanding di-set 0 (transaksi pembayaran tetap tersimpan).',
            confirmLabel: 'Tandai Lunas',
            onConfirm: async () => {
                await updateStatus(debt.id, 'paid')
            },
        })
    }

    const formContent = (
        <DebtForm
            profileId={profileId}
            debt={modal.type === 'edit' ? modal.debt : null}
            onSuccess={closeModal}
            onCancel={closeModal}
        />
    )

    return (
        <>
            {/* ============ STATS ============ */}
            <div className="grid grid-cols-3 gap-2 md:gap-3 mb-3 md:mb-4">
                <StatBox
                    label="Total Utang"
                    value={stats.totalDebt}
                    color="#ef4444"
                    icon={TrendingDown}
                />
                <StatBox
                    label="Total Piutang"
                    value={stats.totalReceivable}
                    color="#10b981"
                    icon={TrendingUp}
                />
                <StatBox
                    label="Net"
                    value={stats.net}
                    color={stats.net >= 0 ? '#334DAF' : '#ef4444'}
                    icon={Wallet}
                    isNet
                />
            </div>

            {/* ============ TOOLBAR ============ */}
            <div className="flex items-center justify-between gap-2 mb-3 md:mb-4 flex-wrap">
                <div className="flex items-center gap-1 p-0.5 md:p-1 rounded-lg md:rounded-xl bg-slate-100 dark:bg-white/5">
                    {FILTERS.map((f) => {
                        const count =
                            f.value === 'all'
                                ? debts.length
                                : debts.filter((d) => d.type === f.value).length
                        const isActive = filter === f.value
                        return (
                            <button
                                key={f.value}
                                type="button"
                                onClick={() => setFilter(f.value)}
                                className={cn(
                                    'flex items-center gap-1.5 px-2.5 md:px-3.5 py-1.5 md:py-2 rounded-md md:rounded-lg text-[11px] md:text-xs font-semibold transition-all cursor-pointer',
                                    isActive
                                        ? 'bg-white dark:bg-white/10 text-brand shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                )}
                            >
                                {f.label}
                                <span
                                    className={cn(
                                        'text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full leading-none',
                                        isActive
                                            ? 'bg-brand/10 text-brand'
                                            : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                                    )}
                                >
                                    {count}
                                </span>
                            </button>
                        )
                    })}
                </div>

                <Button
                    onClick={openCreate}
                    variant="primary"
                    size="sm"
                    className="h-8 gap-1.5 ml-auto"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">Tambah</span>
                    <span className="sm:hidden text-xs">Baru</span>
                </Button>
            </div>

            {/* ============ LIST ============ */}
            {debts.length === 0 ? (
                <Card>
                    <CardContent>
                        <EmptyState
                            icon={HandCoins}
                            title="Belum ada utang atau piutang"
                            description="Catat utang (paylater, kredit, pinjaman) atau piutang (uang yang dipinjam orang) biar keuangan lu ter-track."
                            action={
                                <Button
                                    onClick={openCreate}
                                    variant="primary"
                                    className="h-10"
                                >
                                    <Plus className="w-4 h-4" />
                                    Tambah
                                </Button>
                            }
                        />
                    </CardContent>
                </Card>
            ) : filtered.length === 0 ? (
                <Card>
                    <CardContent>
                        <EmptyState
                            icon={HandCoins}
                            title={`Belum ada ${filter === 'debt' ? 'utang' : 'piutang'}`}
                            description="Coba pilih filter lain atau tambah baru."
                        />
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-3">
                    {filtered.map((d) => (
                        <DebtCard
                            key={d.id}
                            debt={d}
                            onPay={() => setModal({ type: 'payment', debt: d })}
                            onEdit={() => setModal({ type: 'edit', debt: d })}
                            onDelete={() => handleDelete(d)}
                            onMarkPaid={() => handleMarkPaid(d)}
                        />
                    ))}
                </div>
            )}

            {/* ============ MODALS ============ */}
            {isMobile ? (
                <Sheet
                    open={modal.type === 'create' || modal.type === 'edit'}
                    onOpenChange={(o) => !o && closeModal()}
                >
                    <SheetContent
                        side="bottom"
                        className="max-h-[92vh] overflow-y-auto"
                    >
                        <SheetHeader>
                            <SheetTitle>
                                {modal.type === 'edit'
                                    ? 'Edit'
                                    : 'Tambah Utang/Piutang'}
                            </SheetTitle>
                            <SheetDescription>
                                Catat detail utang atau piutang lu.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="px-4 pb-6 pt-2">{formContent}</div>
                    </SheetContent>
                </Sheet>
            ) : (
                <Dialog
                    open={modal.type === 'create' || modal.type === 'edit'}
                    onOpenChange={(o) => !o && closeModal()}
                >
                    <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {modal.type === 'edit'
                                    ? 'Edit'
                                    : 'Tambah Utang/Piutang'}
                            </DialogTitle>
                            <DialogDescription>
                                Catat detail utang atau piutang lu.
                            </DialogDescription>
                        </DialogHeader>
                        {formContent}
                    </DialogContent>
                </Dialog>
            )}

            {modal.type === 'payment' && (
                <DebtPaymentModal
                    open
                    onOpenChange={(o) => !o && closeModal()}
                    debt={modal.debt}
                    accounts={accounts}
                />
            )}

            <ConfirmDialog />
        </>
    )
}

function StatBox({
    label,
    value,
    color,
    icon: Icon,
    isNet = false,
}: {
    label: string
    value: number
    color: string
    icon: any
    isNet?: boolean
}) {
    return (
        <div className="rounded-xl md:rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-2.5 md:p-4">
            <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2.5">
                <div
                    className="w-6 h-6 md:w-8 md:h-8 rounded-md md:rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${color}15` }}
                >
                    <Icon
                        className="w-3 h-3 md:w-3.5 md:h-3.5"
                        style={{ color }}
                    />
                </div>
                <p className="text-[9px] md:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                    {label}
                </p>
            </div>
            <Amount
                value={value}
                sign={isNet ? (value >= 0 ? 'positive' : 'negative') : 'none'}
                className={cn(
                    'text-sm md:text-lg font-bold leading-tight block break-all',
                    isNet && value < 0 && 'text-red-600 dark:text-red-400'
                )}
            />
        </div>
    )
}