import { z } from 'zod'

export const transactionSchema = z
  .object({
    name: z.string().min(1, 'Nama transaksi wajib diisi'),
    date: z.string(),
    type: z.enum(['income', 'expense', 'transfer', 'refund', 'adjustment']),
    account_id: z.string().uuid('Pilih akun'),
    to_account_id: z.string().uuid().nullable().optional(),
    category_id: z.string().uuid().nullable().optional(),
    daily_item_id: z.string().uuid().nullable().optional(),
    amount: z.coerce
      .number()
      .positive('Jumlah harus lebih dari 0'),
    merchant: z.string().optional(),
    note: z.string().optional(),
    ppn_amount: z.coerce.number().min(0).default(0),
    pph_amount: z.coerce.number().min(0).default(0),
    status: z.enum(['cleared', 'pending']).default('cleared'),
    exclude_from_budget: z.boolean().default(false),
    exclude_from_daily_budget: z.boolean().default(false),
    exclude_from_reports: z.boolean().default(false),
  })
  .refine(
    (data) =>
      data.type !== 'transfer' ||
      (data.to_account_id && data.to_account_id !== data.account_id),
    {
      message: 'Akun tujuan harus berbeda dari akun asal',
      path: ['to_account_id'],
    }
  )

export type TransactionInput = z.infer<typeof transactionSchema>