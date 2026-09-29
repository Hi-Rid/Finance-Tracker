import { z } from 'zod'

export const wishlistSchema = z.object({
    name: z.string().min(1, 'Nama wajib diisi').max(100),
    category: z.string().optional(),
    priority: z.enum(['urgent', 'needs', 'wants', 'impulse']).default('wants'),
    target_price: z.coerce.number().positive('Harga harus lebih dari 0'),
    currency: z.string().default('IDR'),
    link: z.string().url('Link tidak valid').optional().or(z.literal('')),
    target_date: z.string().optional(),
    reason: z.string().optional(),
    mood: z.string().optional(),
    alternatives: z.string().optional(),
    note: z.string().optional(),
})

export type WishlistInput = z.infer<typeof wishlistSchema>

export const contributeSchema = z.object({
    amount: z.coerce.number().positive('Jumlah setor harus > 0'),
    account_id: z.string().uuid('Pilih akun sumber'),
    date: z.string(),
    note: z.string().optional(),
})

export type ContributeInput = z.infer<typeof contributeSchema>

export const withdrawSchema = z.object({
    amount: z.coerce.number().positive('Jumlah tarik harus > 0'),
    account_id: z.string().uuid('Pilih akun tujuan'),
    date: z.string(),
    note: z.string().optional(),
})

export type WithdrawInput = z.infer<typeof withdrawSchema>

export const purchaseWishlistSchema = z.object({
    amount: z.coerce.number().positive('Jumlah beli harus > 0'),
    date: z.string(),
    category_id: z.string().uuid().nullable().optional(),
    note: z.string().optional(),
})

export type PurchaseWishlistInput = z.infer<typeof purchaseWishlistSchema>

// ============================================================
// DECISION FRAMEWORK
// ============================================================

export const decisionSchema = z.object({
    need: z.number().int().min(1).max(5),
    alternative: z.number().int().min(1).max(5),
    durability: z.number().int().min(1).max(5),
    consistency: z.number().int().min(1).max(5),
    finance: z.number().int().min(1).max(5),
    mood: z.number().int().min(1).max(5),
})

export type DecisionInput = z.infer<typeof decisionSchema>
export type DecisionKey = keyof DecisionInput

export type DecisionQuestion = {
    key: DecisionKey
    label: string
    help: string
    low: string
    high: string
}

export const DECISION_QUESTIONS: DecisionQuestion[] = [
    {
        key: 'need',
        label: 'Seberapa butuh barang ini?',
        help: 'Jujur ya — butuh ≠ pengen.',
        low: 'Pengen doang',
        high: 'Butuh banget',
    },
    {
        key: 'alternative',
        label: 'Ada alternatif lebih murah?',
        help: 'Cek dulu pasar, mungkin ada yang lebih worth.',
        low: 'Ada banyak',
        high: 'Gak ada',
    },
    {
        key: 'durability',
        label: 'Bakal dipake lebih dari 6 bulan?',
        help: 'Barang sekali pakai ≠ worth it.',
        low: 'Kayaknya engga',
        high: 'Pasti iya',
    },
    {
        key: 'consistency',
        label: 'Masih kepikiran besok?',
        help: 'Kalau cuma pengen sesaat, biasanya lupa besok.',
        low: 'Engga',
        high: 'Iya banget',
    },
    {
        key: 'finance',
        label: 'Punya duitnya tanpa ganggu dana darurat?',
        help: 'Jangan sampe makan tabungan darurat.',
        low: 'Engga',
        high: 'Aman banget',
    },
    {
        key: 'mood',
        label: 'Mood lu sekarang gimana?',
        help: 'Impulse buying sering muncul pas mood jelek.',
        low: 'Jelek / bosan / stress',
        high: 'Bagus / netral',
    },
]

export const DECISION_MAX_SCORE = 30

export type DecisionInterpretation = {
    label: string
    variant: 'success' | 'warning' | 'danger'
    message: string
    emoji: string
}

export function getDecisionInterpretation(
    score: number
): DecisionInterpretation {
    if (score >= 24) {
        return {
            label: 'Worth It',
            variant: 'success',
            message: 'Beli aja. Barang ini beneran worth it buat lu.',
            emoji: '🟢',
        }
    }
    if (score >= 18) {
        return {
            label: 'Pertimbangkan Lagi',
            variant: 'warning',
            message: 'Ada pro-kontra. Coba tunda sehari lagi.',
            emoji: '🟡',
        }
    }
    return {
        label: 'Skip Aja',
        variant: 'danger',
        message: 'Kemungkinan besar ini impulse buying.',
        emoji: '🔴',
    }
}

// ============================================================
// LABELS & OPTIONS (existing)
// ============================================================

export const PRIORITY_LABELS: Record<string, string> = {
    urgent: 'Urgent',
    needs: 'Needs',
    wants: 'Wants',
    impulse: 'Impulse',
}

export const PRIORITY_COLORS: Record<
    string,
    { bg: string; text: string; border: string }
> = {
    urgent: {
        bg: 'bg-red-500/10',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-500/30',
    },
    needs: {
        bg: 'bg-brand/10',
        text: 'text-brand',
        border: 'border-brand/30',
    },
    wants: {
        bg: 'bg-amber-500/10',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500/30',
    },
    impulse: {
        bg: 'bg-purple-500/10',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-500/30',
    },
}

export const STATUS_LABELS: Record<string, string> = {
    planned: 'Rencana',
    cooling_off: 'Cooling-off',
    saving: 'Nabung',
    ready: 'Siap Beli',
    purchased: 'Sudah Dibeli',
    cancelled: 'Batal',
}

export const MOOD_OPTIONS = [
    { value: 'happy', label: '😊 Senang' },
    { value: 'sad', label: '😢 Sedih' },
    { value: 'bored', label: '😑 Bosan' },
    { value: 'stressed', label: '😰 Stress' },
    { value: 'excited', label: '🤩 Excited' },
    { value: 'neutral', label: '😐 Biasa' },
]