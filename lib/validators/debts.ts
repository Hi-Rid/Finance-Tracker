import { z } from 'zod'

export const DEBT_TYPES = ['debt', 'receivable'] as const
export type DebtType = (typeof DEBT_TYPES)[number]

export const DEBT_TYPE_LABELS: Record<DebtType, string> = {
    debt: 'Utang',
    receivable: 'Piutang',
}

export const DEBT_TYPE_LABELS_FULL: Record<DebtType, string> = {
    debt: 'Utang Gue',
    receivable: 'Piutang Gue',
}

export const DEBT_TYPE_COLORS: Record<DebtType, string> = {
    debt: '#ef4444',
    receivable: '#10b981',
}

export const DEBT_STATUS_LABELS: Record<string, string> = {
    active: 'Aktif',
    paid: 'Lunas',
    overdue: 'Telat',
    cancelled: 'Batal',
}

export const debtSchema = z.object({
    name: z.string().min(1, 'Nama wajib diisi').max(100),
    type: z.enum(DEBT_TYPES),
    principal: z.coerce.number().positive('Jumlah harus > 0'),
    outstanding: z.coerce.number().min(0).optional(),
    interest_rate: z.coerce.number().min(0).max(100).default(0),
    start_date: z.string(),
    due_date: z.string().optional(),
    note: z.string().optional(),
})

export type DebtInput = z.infer<typeof debtSchema>

export const paymentSchema = z.object({
    amount: z.coerce.number().positive('Jumlah harus > 0'),
    account_id: z.string().uuid('Pilih akun'),
    date: z.string(),
    note: z.string().optional(),
})

export type PaymentInput = z.infer<typeof paymentSchema>