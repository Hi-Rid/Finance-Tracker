'use client'

import { useState } from 'react'
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Amount } from '@/components/ui/amount'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useEvents } from '@/lib/split-bill/use-events'
import type { Database } from '@/types/database'

type Account = Database['public']['Tables']['accounts']['Row']

type SettleModalProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    eventId: string
    eventName: string
    participant: {
        id: string
        display_name: string
        total_share: number
    }
    /** true = user yang bayar (terima duit), false = user bayar ke payer */
    isIncome: boolean
    payerName?: string
    accounts: Account[]
    defaultAccountId?: string
}

function toDateTimeInputValue(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const h = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${day}T${h}:${min}`
}

export function SettleModal({
    open,
    onOpenChange,
    eventId,
    eventName,
    participant,
    isIncome,
    payerName,
    accounts,
    defaultAccountId,
}: SettleModalProps) {
    const { settleParticipant } = useEvents()
    const [accountId, setAccountId] = useState(
        defaultAccountId || accounts[0]?.id || ''
    )
    const [date, setDate] = useState(toDateTimeInputValue(new Date()))
    const [submitting, setSubmitting] = useState(false)

    async function handleSubmit() {
        if (!accountId) return
        setSubmitting(true)
        const res = await settleParticipant(eventId, participant.id, accountId, date)
        setSubmitting(false)
        if (res.success) {
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isIncome ? (
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                        ) : (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                        {isIncome ? 'Konfirmasi Lunas' : 'Konfirmasi Bayar'}
                    </DialogTitle>
                    <DialogDescription>
                        {isIncome
                            ? `${participant.display_name} bayar share-nya ke lu`
                            : `Lu bayar share ke ${payerName || 'payer'}`}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Amount info */}
                    <div
                        className={`rounded-xl border p-4 ${isIncome
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                                : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
                            }`}
                    >
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1">
                            {isIncome ? 'Diterima dari' : 'Dibayar oleh lu'}
                        </p>
                        <p className="text-sm font-semibold mb-2">
                            {isIncome ? participant.display_name : 'Lu'}
                        </p>
                        <Amount
                            value={Number(participant.total_share)}
                            className={`text-2xl font-bold ${isIncome
                                    ? 'text-emerald-700 dark:text-emerald-300'
                                    : 'text-red-700 dark:text-red-300'
                                }`}
                        />
                    </div>

                    {/* Account */}
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">
                            {isIncome ? 'Masuk ke Akun' : 'Bayar dari Akun'}
                        </label>
                        <Select value={accountId} onValueChange={setAccountId}>
                            <SelectTrigger>
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
                    </div>

                    {/* Date */}
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Tanggal</label>
                        <Input
                            type="datetime-local"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                        Transaksi bakal dicatat dengan flag{' '}
                        <strong>exclude from reports</strong> biar gak kehitung sebagai
                        income/expense real.
                    </p>
                </div>

                <div className="flex gap-2 pt-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="flex-1"
                        disabled={submitting}
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || !accountId}
                        className="flex-1"
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isIncome ? 'Konfirmasi Lunas' : 'Konfirmasi Bayar'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}