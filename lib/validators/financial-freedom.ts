import { z } from 'zod'

// ============================================================
// CONSTANTS
// ============================================================

export const FI_TYPES = ['lean', 'regular', 'fat', 'custom'] as const
export type FiType = (typeof FI_TYPES)[number]

export const MILESTONE_TYPES = [
    'fi_10',
    'fi_25',
    'fi_50',
    'fi_75',
    'coast_fi',
    'fi_100',
] as const
export type MilestoneType = (typeof MILESTONE_TYPES)[number]

export const DEFAULT_FI_MULTIPLIERS: Record<Exclude<FiType, 'custom'>, number> = {
    lean: 20,
    regular: 25,
    fat: 33,
}

export const FI_TYPE_LABELS: Record<FiType, string> = {
    lean: 'Lean FI',
    regular: 'Regular FI',
    fat: 'Fat FI',
    custom: 'Custom',
}

export const FI_TYPE_DESCRIPTIONS: Record<FiType, string> = {
    lean: 'Hidup minimalis. 20× pengeluaran tahunan.',
    regular: 'Standar 4% SWR. 25× pengeluaran tahunan.',
    fat: 'Hidup nyaman. 33× pengeluaran tahunan.',
    custom: 'Atur multiplier sendiri sesuai kebutuhan.',
}

export const FI_TYPE_EMOJI: Record<FiType, string> = {
    lean: '🌱',
    regular: '🏠',
    fat: '✨',
    custom: '🎯',
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Preprocess angka dari form input (yang selalu string).
 * - `''` / `null` / `undefined` → `null`
 * - numeric string → number
 */
function nullableNumber(
    opts: { int?: boolean; min?: number; max?: number } = {}
) {
    let base = z.number()
    if (opts.int) base = base.int()
    if (opts.min !== undefined) base = base.min(opts.min)
    if (opts.max !== undefined) base = base.max(opts.max)

    return z.preprocess(
        (v) => {
            if (v === '' || v === null || v === undefined) return null
            const n = Number(v)
            return isNaN(n) ? null : n
        },
        base.nullable()
    )
}

// ============================================================
// SETTINGS
// ============================================================

/**
 * Settings FF.
 *
 * Catatan unit:
 * - `expected_return_rate` & `inflation_rate` dalam **persen (0-100)** dari UI.
 *   Hook yang convert ke decimal (÷100) sebelum simpan ke DB.
 * - `monthly_expense_override` & `monthly_income_override`:
 *   `null` = auto compute dari avg 3 bulan transactions/budget_periods.
 */
export const fiSettingsSchema = z
    .object({
        fi_type: z.enum(FI_TYPES),

        fi_multiplier: z.coerce
            .number()
            .min(1, 'Minimal 1×')
            .max(100, 'Maksimal 100×'),

        monthly_expense_override: nullableNumber({ min: 0 }).optional(),
        monthly_income_override: nullableNumber({ min: 0 }).optional(),

        expected_return_rate: z.coerce
            .number()
            .min(0, 'Minimal 0%')
            .max(100, 'Maksimal 100%'),

        inflation_rate: z.coerce
            .number()
            .min(0, 'Minimal 0%')
            .max(100, 'Maksimal 100%'),

        current_age: nullableNumber({ int: true, min: 0, max: 120 }).optional(),
        target_retire_age: nullableNumber({ int: true, min: 0, max: 120 }).optional(),
    })
    .refine(
        (data) => {
            const { current_age, target_retire_age } = data
            if (
                current_age !== null &&
                current_age !== undefined &&
                target_retire_age !== null &&
                target_retire_age !== undefined
            ) {
                return target_retire_age > current_age
            }
            return true
        },
        {
            message: 'Target retire harus lebih besar dari usia sekarang',
            path: ['target_retire_age'],
        }
    )

export type FiSettingsInput = z.infer<typeof fiSettingsSchema>

// ============================================================
// AI RESPONSE
// ============================================================

export const aiImprovementSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    impact_estimate: z.string().min(1),
})

export const aiActionStepSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    impact_estimate: z.string().min(1),
    sort_order: z.coerce.number().int().min(0),
})

export const aiAnalysisSchema = z.object({
    overall_status: z.string().min(1),
    savings_rate_analysis: z.string().min(1),
    improvements: z.array(aiImprovementSchema).max(5),
    next_milestone: z.string().min(1),
    next_milestone_amount: z.coerce.number().min(0),
    next_milestone_gap: z.coerce.number().min(0),
    action_steps: z.array(aiActionStepSchema).min(3).max(7),
})

export type AiAnalysis = z.infer<typeof aiAnalysisSchema>
export type AiImprovement = z.infer<typeof aiImprovementSchema>
export type AiActionStep = z.infer<typeof aiActionStepSchema>

// ============================================================
// HELPERS (runtime)
// ============================================================

/** Ambil multiplier default dari fi_type. */
export function getDefaultMultiplier(fi_type: FiType): number {
    if (fi_type === 'custom') return 25
    return DEFAULT_FI_MULTIPLIERS[fi_type]
}

/** Format milestone label untuk display. */
export const MILESTONE_LABELS: Record<MilestoneType, string> = {
    fi_10: '10% FI',
    fi_25: '25% FI',
    fi_50: '50% FI',
    fi_75: '75% FI',
    coast_fi: 'Coast FI',
    fi_100: 'Financial Independence',
}

export const MILESTONE_EMOJI: Record<MilestoneType, string> = {
    fi_10: '🌱',
    fi_25: '🌿',
    fi_50: '🌳',
    fi_75: '🏔️',
    coast_fi: '⛵',
    fi_100: '👑',
}

export const MILESTONE_DESCRIPTIONS: Record<MilestoneType, string> = {
    fi_10: 'Langkah pertama. 10% dari target FI.',
    fi_25: 'Seperempat jalan. Mulai kelihatan.',
    fi_50: 'Setengah jalan! Momentum udah kuat.',
    fi_75: 'Tinggal 25% lagi. Hampir sampai.',
    coast_fi: 'Udah cukup. Compounding yang kerja, bukan lu.',
    fi_100: 'Selamat! Lu udah financially independent.',
}