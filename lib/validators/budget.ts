import { z } from 'zod'

export const dailyBudgetItemSchema = z.object({
    name: z.string().min(1, 'Nama wajib diisi'),
    category_id: z.string().uuid().nullable().optional(),
    amount: z.coerce.number().positive('Jumlah harus lebih dari 0'),
    sort_order: z.coerce.number().default(0),
    is_active: z.boolean().default(true),
})

export type DailyBudgetItemInput = z.infer<typeof dailyBudgetItemSchema>

export const budgetPeriodSchema = z.object({
    income: z.coerce.number().min(0, 'Income tidak boleh negatif'),
    note: z.string().optional(),
})

export type BudgetPeriodInput = z.infer<typeof budgetPeriodSchema>

export const monthlyBudgetSchema = z.object({
    category_id: z.string().uuid('Pilih kategori'),
    amount: z.coerce.number().positive('Jumlah harus lebih dari 0'),
    note: z.string().optional(),
})

export type MonthlyBudgetInput = z.infer<typeof monthlyBudgetSchema>