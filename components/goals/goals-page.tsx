'use client'

import { useMemo, useState } from 'react'
import {
    Plus,
    Target,
    TrendingUp,
    PiggyBank,
    CheckCircle2,
    Trophy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Amount } from '@/components/ui/amount'
import { EmptyState } from '@/components/ui/empty-state'
import { HideAmountsButton } from '@/components/shared/hide-amounts-button'
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
import { GoalForm } from './goal-form'
import { GoalCard } from './goal-card'
import { GoalContributeModal } from './goal-contribute-modal'
import { useGoals } from '@/lib/hooks/use-goals'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Goal = Database['public']['Tables']['goals']['Row']
type Contribution = Database['public']['Tables']['goal_contributions']['Row']

type Props = {
    goals: Goal[]
    contributions: Contribution[]
    accounts: Database['public']['Tables']['accounts']['Row'][]
    profileId: string
}

type Filter = 'active' | 'achieved' | 'all'

const FILTERS: { value: Filter; label: string }[] = [
    { value: 'active', label: 'Aktif' },
    { value: 'achieved', label: 'Tercapai' },
    { value: 'all', label: 'Semua' },
]

type ModalState =
    | { type: 'none' }
    | { type: 'create' }
    | { type: 'edit'; goal: Goal }
    | { type: 'contribute'; goal: Goal; mode: 'deposit' | 'withdraw' }

export function GoalsPage({ goals, contributions, accounts, profileId }: Props) {
    const isMobile = useMediaQuery('(max-width: 767px)')
    const { deleteGoal, updateStatus } = useGoals()
    const { confirm, Dialog: ConfirmDialog } = useConfirmDialog()
    const [filter, setFilter] = useState<Filter>('active')
    const [modal, setModal] = useState<ModalState>({ type: 'none' })

    const filtered = useMemo(() => {
        if (filter === 'all') return goals
        if (filter === 'active')
            return goals.filter((g) => g.status === 'active')
        return goals.filter((g) => g.status === 'achieved')
    }, [goals, filter])

    const stats = useMemo(() => {
        const active = goals.filter((g) => g.status === 'active')
        const achieved = goals.filter((g) => g.status === 'achieved')
        const totalTarget = active.reduce(
            (s, g) => s + Number(g.target_amount),
            0
        )
        const totalSaved = active.reduce(
            (s, g) => s + Number(g.current_amount),
            0
        )

        return {
            activeCount: active.length,
            achievedCount: achieved.length,
            totalTarget,
            totalSaved,
            totalProgress: totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0,
        }
    }, [goals])

    function openCreate() {
        setModal({ type: 'create' })
    }

    function closeModal() {
        setModal({ type: 'none' })
    }

    function handleDelete(goal: Goal) {
        confirm({
            title: `Hapus "${goal.name}"?`,
            description:
                'Goal beserta riwayat setorannya bakal dihapus permanen. Gak bisa di-undo.',
            confirmLabel: 'Hapus',
            variant: 'destructive',
            onConfirm: async () => {
                await deleteGoal(goal.id)
            },
        })
    }

    function handleMarkAchieved(goal: Goal) {
        confirm({
            title: `Tandai "${goal.name}" selesai?`,
            description:
                'Goal bakal masuk ke daftar "Tercapai". Bisa diaktifkan lagi kapan aja.',
            confirmLabel: 'Tandai Selesai',
            variant: 'default',
            onConfirm: async () => {
                await updateStatus(goal.id, 'achieved')
            },
        })
    }

    function handleReactivate(goal: Goal) {
        updateStatus(goal.id, 'active')
    }

    const formContent = (
        <GoalForm
            profileId={profileId}
            goal={modal.type === 'edit' ? modal.goal : null}
            onSuccess={closeModal}
            onCancel={closeModal}
        />
    )

    return (
        <>
            {/* ============ HEADER STATS ============ */}
            <div className="flex items-start justify-between gap-3 mb-3 md:mb-4 flex-wrap">
                <div className="flex items-center gap-3 md:gap-5 flex-wrap">
                    <div>
                        <p className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 md:mb-1">
                            Total Tersimpan
                        </p>
                        <Amount
                            value={stats.totalSaved}
                            className="text-lg md:text-2xl font-bold text-brand"
                        />
                        <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
                            <span>dari</span>
                            <Amount
                                value={stats.totalTarget}
                                className="inline text-[10px] md:text-xs font-medium"
                            />
                        </p>
                    </div>
                    <div className="hidden md:block w-px self-stretch bg-slate-200 dark:bg-white/10 my-1" />
                    <div className="flex items-center gap-3 md:gap-5">
                        <div>
                            <p className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 md:mb-1">
                                Aktif
                            </p>
                            <p className="text-base md:text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                                {stats.activeCount}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 md:mb-1">
                                Tercapai
                            </p>
                            <p className="text-base md:text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                {stats.achievedCount}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                    <HideAmountsButton size="icon-sm" />
                    <Button
                        onClick={openCreate}
                        variant="primary"
                        size="sm"
                        className="h-8 gap-1.5"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline text-xs">Goal Baru</span>
                        <span className="sm:hidden text-xs">Baru</span>
                    </Button>
                </div>
            </div>

            {/* ============ FILTER TABS ============ */}
            {goals.length > 0 && (
                <div className="flex items-center gap-1 mb-3 md:mb-4 p-0.5 md:p-1 rounded-lg md:rounded-xl bg-slate-100 dark:bg-white/5 w-fit">
                    {FILTERS.map((f) => {
                        const count =
                            f.value === 'all'
                                ? goals.length
                                : goals.filter((g) => g.status === f.value)
                                    .length
                        const isActive = filter === f.value
                        return (
                            <button
                                key={f.value}
                                type="button"
                                onClick={() => setFilter(f.value)}
                                className={cn(
                                    'flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg text-[11px] md:text-xs font-semibold transition-all cursor-pointer',
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
            )}

            {/* ============ LIST ============ */}
            {goals.length === 0 ? (
                <Card>
                    <CardContent>
                        <EmptyState
                            icon={Target}
                            title="Belum ada goal"
                            description="Mulai bikin target tabungan pertama lu — dana darurat, liburan, gadget, dll."
                            action={
                                <Button
                                    onClick={openCreate}
                                    variant="primary"
                                    className="h-10"
                                >
                                    <Plus className="w-4 h-4" />
                                    Bikin Goal
                                </Button>
                            }
                        />
                    </CardContent>
                </Card>
            ) : filtered.length === 0 ? (
                <Card>
                    <CardContent>
                        <EmptyState
                            icon={
                                filter === 'achieved' ? Trophy : CheckCircle2
                            }
                            title={
                                filter === 'achieved'
                                    ? 'Belum ada goal tercapai'
                                    : 'Gak ada goal di kategori ini'
                            }
                            description={
                                filter === 'achieved'
                                    ? 'Terus nabung biar target lu tercapai!'
                                    : 'Coba pilih filter lain.'
                            }
                        />
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-3 lg:gap-4">
                    {filtered.map((g) => (
                        <GoalCard
                            key={g.id}
                            goal={g}
                            contributions={contributions.filter(
                                (c) => c.goal_id === g.id
                            )}
                            onContribute={() =>
                                setModal({
                                    type: 'contribute',
                                    goal: g,
                                    mode: 'deposit',
                                })
                            }
                            onWithdraw={() =>
                                setModal({
                                    type: 'contribute',
                                    goal: g,
                                    mode: 'withdraw',
                                })
                            }
                            onEdit={() => setModal({ type: 'edit', goal: g })}
                            onDelete={() => handleDelete(g)}
                            onMarkAchieved={() => handleMarkAchieved(g)}
                            onReactivate={() => handleReactivate(g)}
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
                                    ? 'Edit Goal'
                                    : 'Goal Baru'}
                            </SheetTitle>
                            <SheetDescription>
                                {modal.type === 'edit'
                                    ? 'Update detail goal.'
                                    : 'Tentukan target & deadline lu.'}
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
                                    ? 'Edit Goal'
                                    : 'Goal Baru'}
                            </DialogTitle>
                            <DialogDescription>
                                {modal.type === 'edit'
                                    ? 'Update detail goal.'
                                    : 'Tentukan target & deadline lu.'}
                            </DialogDescription>
                        </DialogHeader>
                        {formContent}
                    </DialogContent>
                </Dialog>
            )}

            {modal.type === 'contribute' && (
                <GoalContributeModal
                    open
                    onOpenChange={(o) => !o && closeModal()}
                    mode={modal.mode}
                    goal={modal.goal}
                    accounts={accounts}
                />
            )}

            <ConfirmDialog />
        </>
    )
}