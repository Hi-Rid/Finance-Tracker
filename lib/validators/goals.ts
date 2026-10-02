import { z } from 'zod'

export const GOAL_TYPES = [
    'emergency',
    'vacation',
    'house',
    'education',
    'retirement',
    'vehicle',
    'gadget',
    'custom',
] as const

export type GoalType = (typeof GOAL_TYPES)[number]

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
    emergency: 'Dana Darurat',
    vacation: 'Liburan',
    house: 'Rumah',
    education: 'Pendidikan',
    retirement: 'Pensiun',
    vehicle: 'Kendaraan',
    gadget: 'Gadget',
    custom: 'Lainnya',
}

export const GOAL_TYPE_EMOJI: Record<GoalType, string> = {
    emergency: '🛡️',
    vacation: '🏖️',
    house: '🏠',
    education: '🎓',
    retirement: '🌅',
    vehicle: '🚗',
    gadget: '📱',
    custom: '⭐',
}

export const GOAL_TYPE_COLORS: Record<GoalType, string> = {
    emergency: '#10b981',
    vacation: '#0ea5e9',
    house: '#8b5cf6',
    education: '#334DAF',
    retirement: '#f59e0b',
    vehicle: '#ef4444',
    gadget: '#ec4899',
    custom: '#64748b',
}

export const goalSchema = z.object({
    name: z.string().min(1, 'Nama wajib diisi').max(100),
    type: z.enum(GOAL_TYPES),
    target_amount: z.coerce.number().positive('Target harus > 0'),
    target_date: z.string().optional(),
    note: z.string().optional(),
})

export type GoalInput = z.infer<typeof goalSchema>

// ============================================================
// CONTRIBUTION — sekarang butuh account_id
// ============================================================

export const contributionSchema = z.object({
    amount: z.coerce.number().positive('Jumlah harus > 0'),
    account_id: z.string().uuid('Pilih akun sumber'),
    date: z.string(),
    note: z.string().optional(),
})

export type ContributionInput = z.infer<typeof contributionSchema>

export const withdrawGoalSchema = z.object({
    amount: z.coerce.number().positive('Jumlah harus > 0'),
    account_id: z.string().uuid('Pilih akun tujuan'),
    date: z.string(),
    note: z.string().optional(),
})

export type WithdrawGoalInput = z.infer<typeof withdrawGoalSchema>