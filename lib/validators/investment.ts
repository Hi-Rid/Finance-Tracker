import { z } from 'zod'

export const createInvestmentSchema = z
    .object({
        asset_type: z.enum(['stock', 'crypto', 'mutual_fund', 'gold']),
        name: z.string().min(1, 'Nama wajib diisi'),
        ticker: z.string().optional(),
        exchange: z.string().optional(),

        quantity: z.coerce.number().positive('Jumlah harus > 0'),
        avg_price: z.coerce.number().positive('Harga harus > 0'),

        purchase_date: z.string(),
        account_id: z.string().uuid('Pilih akun sumber'),

        broker: z.string().optional(),
        note: z.string().optional(),
    })
    .refine(
        (data) => {
            if (data.asset_type !== 'gold') {
                return !!data.ticker && data.ticker.trim().length > 0
            }
            return true
        },
        {
            message: 'Pilih aset dari hasil pencarian',
            path: ['ticker'],
        }
    )

export const buyMoreSchema = z.object({
    asset_id: z.string().uuid(),
    quantity: z.coerce.number().positive('Jumlah harus > 0'),
    price: z.coerce.number().positive('Harga harus > 0'),
    fee: z.coerce.number().min(0).default(0),
    date: z.string(),
    account_id: z.string().uuid(),
    note: z.string().optional(),
})

export const sellSchema = z.object({
    asset_id: z.string().uuid(),
    quantity: z.coerce.number().positive('Jumlah harus > 0'),
    price: z.coerce.number().positive('Harga harus > 0'),
    fee: z.coerce.number().min(0).default(0),
    date: z.string(),
    account_id: z.string().uuid(),
    note: z.string().optional(),
})

export const dividendSchema = z.object({
    asset_id: z.string().uuid(),
    amount: z.coerce.number().positive('Jumlah harus > 0'),
    date: z.string(),
    account_id: z.string().uuid(),
    note: z.string().optional(),
})

export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>
export type BuyMoreInput = z.infer<typeof buyMoreSchema>
export type SellInput = z.infer<typeof sellSchema>
export type DividendInput = z.infer<typeof dividendSchema>