import { z } from 'zod'

// ============ CREATE ACCOUNT ============
export const createAccountSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  type: z.enum([
    'cash',
    'bank',
    'ewallet',
    'credit',
    'paylater',
    'investment',
    'other',
  ]),
  initial_balance: z.coerce.number(),
  note: z.string().optional(),
})

export type CreateAccountInput = z.infer<typeof createAccountSchema>

// ============ TOP-UP (tambah saldo dari luar) ============
export const topupSchema = z.object({
  account_id: z.string().uuid('Pilih akun'),
  amount: z.coerce.number().positive('Jumlah harus > 0'),
  category_id: z.string().uuid().nullable().optional(),
  date: z.string(),
  note: z.string().optional(),
})

export type TopupInput = z.infer<typeof topupSchema>

// ============ TRANSFER ============
export const transferSchema = z
  .object({
    from_account_id: z.string().uuid('Pilih akun sumber'),
    to_account_id: z.string().uuid('Pilih akun tujuan'),
    amount: z.coerce.number().positive('Jumlah harus > 0'),
    fee: z.coerce.number().min(0).default(0),
    date: z.string(),
    note: z.string().optional(),
  })
  .refine((data) => data.from_account_id !== data.to_account_id, {
    message: 'Akun asal dan tujuan harus berbeda',
    path: ['to_account_id'],
  })

export type TransferInput = z.infer<typeof transferSchema>

// ============ ADJUSTMENT (koreksi saldo) ============
export const adjustmentSchema = z.object({
  account_id: z.string().uuid(),
  current_balance: z.coerce.number(),
  actual_balance: z.coerce.number().min(0, 'Saldo tidak boleh negatif'),
  date: z.string(),
  note: z.string().min(1, 'Catatan wajib diisi untuk audit trail'),
})

export type AdjustmentInput = z.infer<typeof adjustmentSchema>