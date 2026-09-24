import { z } from 'zod'

export const categorySchema = z.object({
    name: z.string().min(1, 'Nama wajib diisi').max(50, 'Maks 50 karakter'),
    type: z.enum(['income', 'expense']),
    group_name: z.enum([
        'needs',
        'wants',
        'invest',
        'savings',
        'debt',
        'donation',
        'tax',
        'zakat',
        'income',
        'other',
    ]),
    icon: z.string().nullable().optional(),
    color: z.string().nullable().optional(),
})

export type CategoryInput = z.infer<typeof categorySchema>

export const GROUP_LABELS: Record<string, string> = {
    needs: 'Needs',
    wants: 'Wants',
    invest: 'Invest',
    savings: 'Savings',
    debt: 'Debt',
    donation: 'Donation',
    tax: 'Tax',
    zakat: 'Zakat',
    income: 'Income',
    other: 'Other',
}

export const EXPENSE_GROUPS = [
    'needs',
    'wants',
    'invest',
    'savings',
    'debt',
    'donation',
    'tax',
    'zakat',
    'other',
] as const

export const INCOME_GROUPS = ['income', 'other'] as const