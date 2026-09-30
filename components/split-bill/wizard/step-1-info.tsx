'use client'

import { Plus, X, User, UserCircle, Wallet } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Amount } from '@/components/ui/amount'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type {
    EventWizardData,
    ParticipantInput,
} from '@/lib/split-bill/types'
import type { Database } from '@/types/database'

type Group = Database['public']['Tables']['groups']['Row']
type Account = Database['public']['Tables']['accounts']['Row']

type Step1InfoProps = {
    data: EventWizardData
    update: (partial: Partial<EventWizardData>) => void
    updateParticipants: (participants: ParticipantInput[]) => void
    groups: Group[]
    accounts: Account[]
    userTempId: string
}

function newId() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID()
    }
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function Step1Info({
    data,
    update,
    updateParticipants,
    groups,
    accounts,
    userTempId,
}: Step1InfoProps) {
    const participants = data.participants
    const selectedAccount = accounts.find((a) => a.id === data.account_id)

    function addParticipant() {
        updateParticipants([
            ...participants,
            {
                temp_id: newId(),
                display_name: '',
                is_user: false,
                contact_id: null,
            },
        ])
    }

    function updateParticipant(tempId: string, patch: Partial<ParticipantInput>) {
        updateParticipants(
            participants.map((p) =>
                p.temp_id === tempId ? { ...p, ...patch } : p
            )
        )
    }

    function removeParticipant(tempId: string) {
        if (tempId === userTempId) return

        const next = participants.filter((p) => p.temp_id !== tempId)
        updateParticipants(next)

        if (data.payer_participant_id === tempId) {
            update({ payer_participant_id: userTempId })
        }
    }

    function handleGroupChange(groupId: string) {
        if (groupId === '__none__') {
            update({ group_id: null })
            return
        }
        update({ group_id: groupId })
    }

    return (
        <div className="space-y-3 md:space-y-6">
            {/* Info Dasar */}
            <div className="rounded-xl md:rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-3.5 md:p-5 space-y-3 md:space-y-4">
                <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Info Dasar
                </p>

                <div>
                    <label className="text-xs md:text-sm font-medium mb-1 md:mb-1.5 block">
                        Nama Event <span className="text-red-500">*</span>
                    </label>
                    <Input
                        placeholder="Makan Gacoan 12 Okt, Trip Bali, dll"
                        value={data.name}
                        onChange={(e) => update({ name: e.target.value })}
                        className="h-9 md:h-10 text-sm"
                    />
                </div>

                <div>
                    <label className="text-xs md:text-sm font-medium mb-1 md:mb-1.5 block">
                        Tanggal & Waktu <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="datetime-local"
                        value={data.date}
                        onChange={(e) => update({ date: e.target.value })}
                        className="h-9 md:h-10 text-sm"
                    />
                </div>

                {groups.length > 0 && (
                    <div>
                        <label className="text-xs md:text-sm font-medium mb-1 md:mb-1.5 block">
                            Group (opsional)
                        </label>
                        <Select
                            value={data.group_id || '__none__'}
                            onValueChange={handleGroupChange}
                        >
                            <SelectTrigger className="h-9 md:h-10 text-sm">
                                <SelectValue placeholder="Pilih group" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">Tanpa group</SelectItem>
                                {groups.map((g) => (
                                    <SelectItem key={g.id} value={g.id}>
                                        {g.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {/* Peserta */}
            <div className="rounded-xl md:rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-3.5 md:p-5 space-y-3 md:space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                        <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5 md:mb-1">
                            Peserta
                        </p>
                        <p className="text-[11px] md:text-xs text-muted-foreground">
                            Minimal 2 orang (termasuk lu)
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addParticipant}
                        className="h-8 md:h-9 text-xs md:text-sm shrink-0"
                    >
                        <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        Tambah
                    </Button>
                </div>

                <div className="space-y-1.5 md:space-y-2">
                    {participants.map((p) => (
                        <div
                            key={p.temp_id}
                            className={cn(
                                'flex items-center gap-2 p-1.5 md:p-2 rounded-lg md:rounded-xl border transition-colors',
                                p.is_user
                                    ? 'bg-brand/5 border-brand/20'
                                    : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10'
                            )}
                        >
                            <div
                                className={cn(
                                    'w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center shrink-0',
                                    p.is_user
                                        ? 'bg-brand/15 text-brand'
                                        : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                                )}
                            >
                                {p.is_user ? (
                                    <UserCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                ) : (
                                    <User className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                )}
                            </div>

                            <Input
                                placeholder={p.is_user ? 'Nama lu' : 'Nama peserta'}
                                value={p.display_name}
                                onChange={(e) =>
                                    updateParticipant(p.temp_id, {
                                        display_name: e.target.value,
                                    })
                                }
                                className="flex-1 h-8 md:h-9 border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 text-sm"
                            />

                            {p.is_user && (
                                <span className="text-[10px] font-semibold text-brand shrink-0 pr-1">
                                    LU
                                </span>
                            )}

                            {!p.is_user && participants.length > 2 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => removeParticipant(p.temp_id)}
                                    className="shrink-0 text-slate-400 hover:text-red-500 h-7 w-7 md:h-8 md:w-8"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Siapa yang Bayar */}
            <div className="rounded-xl md:rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-3.5 md:p-5 space-y-3 md:space-y-4">
                <div>
                    <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5 md:mb-1">
                        Siapa yang Bayar Dulu?
                    </p>
                    <p className="text-[11px] md:text-xs text-muted-foreground">
                        Pilih siapa yang talangin bill-nya
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 md:gap-2">
                    {participants.map((p) => {
                        const isActive = data.payer_participant_id === p.temp_id
                        return (
                            <button
                                key={p.temp_id}
                                type="button"
                                onClick={() =>
                                    update({ payer_participant_id: p.temp_id })
                                }
                                className={cn(
                                    'flex items-center gap-1.5 md:gap-2 p-2 md:p-2.5 rounded-lg md:rounded-xl border transition-all cursor-pointer text-left',
                                    isActive
                                        ? 'bg-brand/10 border-brand/40 shadow-sm'
                                        : 'bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/10 hover:border-brand/30'
                                )}
                            >
                                <div
                                    className={cn(
                                        'w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center shrink-0',
                                        isActive
                                            ? 'bg-brand text-white'
                                            : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                                    )}
                                >
                                    {p.is_user ? (
                                        <UserCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    ) : (
                                        <User className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        'text-[11px] md:text-xs font-semibold truncate',
                                        isActive && 'text-brand'
                                    )}
                                >
                                    {p.display_name || 'Tanpa nama'}
                                    {p.is_user && ' (Lu)'}
                                </span>
                            </button>
                        )
                    })}
                </div>

                {!participants.find((p) => p.temp_id === data.payer_participant_id)
                    ?.is_user && (
                        <div className="rounded-lg md:rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-2.5 md:p-3 flex gap-2">
                            <Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] md:text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                                Kalau yang bayar bukan lu, sistem gak akan kurangi saldo akun lu.
                                Yang dicatat adalah <strong>utang lu</strong> ke{' '}
                                <strong>
                                    {
                                        participants.find(
                                            (p) => p.temp_id === data.payer_participant_id
                                        )?.display_name
                                    }
                                </strong>{' '}
                                sebesar share lu.
                            </p>
                        </div>
                    )}
            </div>

            {/* Pajak & Diskon */}
            <div className="rounded-xl md:rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-3.5 md:p-5 space-y-3 md:space-y-4">
                <div>
                    <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5 md:mb-1">
                        Pajak & Diskon (opsional)
                    </p>
                    <p className="text-[11px] md:text-xs text-muted-foreground">
                        Isi kalau struk ada PPN / service charge / diskon
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <div>
                        <label className="text-xs md:text-sm font-medium mb-1 md:mb-1.5 block">
                            PPN (%)
                        </label>
                        <Input
                            type="number"
                            inputMode="decimal"
                            placeholder="10"
                            value={data.ppn_rate > 0 ? data.ppn_rate * 100 : ''}
                            onChange={(e) => {
                                const v = e.target.value
                                update({ ppn_rate: v === '' ? 0 : Number(v) / 100 })
                            }}
                            className="h-9 md:h-10 text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs md:text-sm font-medium mb-1 md:mb-1.5 block">
                            Service (%)
                        </label>
                        <Input
                            type="number"
                            inputMode="decimal"
                            placeholder="5"
                            value={data.service_rate > 0 ? data.service_rate * 100 : ''}
                            onChange={(e) => {
                                const v = e.target.value
                                update({ service_rate: v === '' ? 0 : Number(v) / 100 })
                            }}
                            className="h-9 md:h-10 text-sm"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs md:text-sm font-medium mb-1 md:mb-1.5 block">
                        Diskon (Rp)
                    </label>
                    <CurrencyInput
                        value={data.discount_amount}
                        onChange={(v) => update({ discount_amount: v })}
                        placeholder="0"
                        className="h-9 md:h-10 text-sm"
                    />
                </div>
            </div>

            {/* Sumber Dana */}
            <div className="rounded-xl md:rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-3.5 md:p-5 space-y-3 md:space-y-4">
                <div>
                    <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5 md:mb-1">
                        Sumber Dana
                    </p>
                    <p className="text-[11px] md:text-xs text-muted-foreground">
                        Akun yang dipakai bayar (kalau lu yang talangin)
                    </p>
                </div>

                <Select
                    value={data.account_id || ''}
                    onValueChange={(v) => update({ account_id: v })}
                >
                    <SelectTrigger className="h-9 md:h-10 text-sm">
                        <SelectValue placeholder="Pilih akun" />
                    </SelectTrigger>
                    <SelectContent>
                        {accounts.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                                <div className="flex items-center justify-between gap-3 w-full">
                                    <span>{a.name}</span>
                                    <Amount
                                        value={Number(a.current_balance)}
                                        className="text-xs text-slate-500"
                                    />
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {selectedAccount && (
                    <div className="rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-2.5 md:p-3">
                        <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">
                            Saldo saat ini
                        </p>
                        <Amount
                            value={Number(selectedAccount.current_balance)}
                            className="text-xs md:text-sm font-bold text-slate-900 dark:text-white"
                        />
                    </div>
                )}
            </div>
        </div>
    )
}