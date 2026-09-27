'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Step1Info } from './step-1-info'
import { Step2Items } from './step-2-items'
import { Step3Split } from './step-3-split'
import { Step4Review } from './step-4-review'
import type {
    EventWizardData,
    ParticipantInput,
} from '@/lib/split-bill/types'
import type { Database } from '@/types/database'

type Group = Database['public']['Tables']['groups']['Row']
type Account = Database['public']['Tables']['accounts']['Row']

type EventWizardProps = {
    profileId: string
    groups: Group[]
    accounts: Account[]
    userName: string
}

function newId() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID()
    }
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function toDateTimeInputValue(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const h = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${day}T${h}:${min}`
}

const STEPS = [
    { num: 1, label: 'Info' },
    { num: 2, label: 'Items' },
    { num: 3, label: 'Split' },
    { num: 4, label: 'Review' },
]

export function EventWizard({
    profileId,
    groups,
    accounts,
    userName,
}: EventWizardProps) {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [exitConfirmOpen, setExitConfirmOpen] = useState(false)

    const userTempId = newId()
    const [data, setData] = useState<EventWizardData>({
        name: '',
        date: toDateTimeInputValue(new Date()),
        group_id: null,
        payer_participant_id: userTempId,
        ppn_rate: 0,
        service_rate: 0,
        discount_amount: 0,
        currency: 'IDR',
        account_id: null,
        note: '',
        participants: [
            {
                temp_id: userTempId,
                display_name: userName,
                is_user: true,
                contact_id: null,
            },
        ],
        items: [],
        split: { mode: 'equal', tax_distribution: 'proportional' },
        receipt_ids: [],
    })

    function update(partial: Partial<EventWizardData>) {
        setData((d) => ({ ...d, ...partial }))
    }

    function updateParticipants(participants: ParticipantInput[]) {
        update({ participants })
    }

    function canProceed(): boolean {
        if (step === 1) {
            return (
                data.name.trim().length > 0 &&
                data.participants.length >= 2 &&
                data.participants.every((p) => p.display_name.trim().length > 0) &&
                data.date.length > 0 &&
                !!data.account_id
            )
        }
        if (step === 2) {
            return (
                data.items.length > 0 &&
                data.items.every((it) => it.name.trim().length > 0)
            )
        }
        if (step === 3) {
            if (data.split.mode === 'percentage') {
                const sum = Object.values(data.split.percentages || {}).reduce(
                    (a, b) => a + b,
                    0
                )
                return Math.abs(sum - 100) < 0.01
            }
        }
        return true
    }

    function next() {
        if (!canProceed()) return
        setStep((s) => Math.min(s + 1, 4))
    }

    function prev() {
        setStep((s) => Math.max(s - 1, 1))
    }

    function handleExitConfirm() {
        router.push('/split-bill')
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">
                        Split Bill Baru
                    </h1>
                    <p className="text-sm text-muted-foreground">Step {step} dari 4</p>
                </div>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setExitConfirmOpen(true)}
                    title="Keluar"
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <div className="flex items-center gap-2 mb-6">
                {STEPS.map((s, i) => {
                    const isActive = step === s.num
                    const isDone = step > s.num
                    return (
                        <div key={s.num} className="flex items-center gap-2 flex-1">
                            <div
                                className={cn(
                                    'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0',
                                    isActive
                                        ? 'bg-brand text-white shadow-sm'
                                        : isDone
                                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                            : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                                )}
                            >
                                {isDone ? (
                                    <Check className="w-3 h-3" />
                                ) : (
                                    <span className="tabular-nums">{s.num}</span>
                                )}
                                <span className="hidden sm:inline">{s.label}</span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div
                                    className={cn(
                                        'flex-1 h-0.5 rounded-full transition-colors',
                                        isDone
                                            ? 'bg-emerald-500/40'
                                            : 'bg-slate-200 dark:bg-white/10'
                                    )}
                                />
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="mb-6">
                {step === 1 && (
                    <Step1Info
                        data={data}
                        update={update}
                        updateParticipants={updateParticipants}
                        groups={groups}
                        accounts={accounts}
                        userTempId={userTempId}
                    />
                )}
                {step === 2 && <Step2Items data={data} update={update} />}
                {step === 3 && <Step3Split data={data} update={update} />}
                {step === 4 && (
                    <Step4Review
                        data={data}
                        accounts={accounts}
                        profileId={profileId}
                    />
                )}
            </div>

            <div className="flex gap-3">
                {step > 1 ? (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={prev}
                        className="flex-1"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Kembali
                    </Button>
                ) : (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setExitConfirmOpen(true)}
                        className="flex-1"
                    >
                        Batal
                    </Button>
                )}

                {step < 4 && (
                    <Button
                        type="button"
                        variant="primary"
                        onClick={next}
                        disabled={!canProceed()}
                        className="flex-1"
                    >
                        Lanjut
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                )}
            </div>

            <ConfirmDialog
                open={exitConfirmOpen}
                onOpenChange={setExitConfirmOpen}
                title="Keluar dari wizard?"
                description="Data yang belum disimpan akan hilang."
                confirmLabel="Keluar"
                cancelLabel="Lanjut Edit"
                variant="destructive"
                onConfirm={handleExitConfirm}
            />
        </div>
    )
}