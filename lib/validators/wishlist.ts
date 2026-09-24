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