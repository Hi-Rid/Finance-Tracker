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
                    <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
                        {isIncome ? (
                            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                        ) : (
                            <TrendingDown className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                        )}
                        {isIncome ? 'Konfirmasi Lunas' : 'Konfirmasi Bayar'}
                    </DialogTitle>
                    <DialogDescription className="text-xs md:text-sm">
                        {isIncome
                            ? `${participant.display_name} bayar share-nya ke lu`
                            : `Lu bayar share ke ${payerName || 'payer'}`}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 md:space-y-4">
                    <div
                        className={`rounded-lg md:rounded-xl border p-3 md:p-4 ${isIncome
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
                            }`}
                    >
                        <p className="text-[9px] md:text-[10px] font-semibold uppercase tracking-wider mb-0.5 md:mb-1">
                            {isIncome ? 'Diterima dari' : 'Dibayar oleh lu'}
                        </p>
                        <p className="text-xs md:text-sm font-semibold mb-1.5 md:mb-2">
                            {isIncome ? participant.display_name : 'Lu'}
                        </p>
                        <Amount
                            value={Number(participant.total_share)}
                            className={`text-xl md:text-2xl font-bold ${isIncome
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : 'text-red-700 dark:text-red-300'
                                }`}
                        />
                    </div>

                    <div>
                        <label className="text-xs md:text-sm font-medium mb-1 md:mb-1.5 block">
                            {isIncome ? 'Masuk ke Akun' : 'Bayar dari Akun'}
                        </label>
                        <Select value={accountId} onValueChange={setAccountId}>
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
                    </div>

                    <div>
                        <label className="text-xs md:text-sm font-medium mb-1 md:mb-1.5 block">
                            Tanggal
                        </label>
                        <Input
                            type="datetime-local"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="h-9 md:h-10 text-sm"
                        />
                    </div>

                    <p className="text-[10px] md:text-[11px] text-muted-foreground leading-relaxed">
                        Transaksi bakal dicatat dengan flag{' '}
                        <strong>exclude from reports</strong> biar gak kehitung sebagai
                        income/expense real.
                    </p>
                </div>

                <div className="flex gap-2 pt-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 h-10 md:h-11"
                        disabled={submitting}
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || !accountId}
                        className="flex-1 h-10 md:h-11"
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isIncome ? 'Konfirmasi Lunas' : 'Konfirmasi Bayar'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}