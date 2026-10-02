// ============================================================
// AI QUOTA — Rate limit per user per hari
// ============================================================
// Batas di-guard di DB (RPC `consume_ai_quota`), function ini cuma wrapper.
// Kalau quota habis, return ok=false — caller harus kirim 429.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export const AI_QUOTA = {
    'budget-allocate': 10,
    'ff-analyze': 5,
    'ocr-scan': 20,
} as const

export type AiFeature = keyof typeof AI_QUOTA

export type QuotaResult =
    | { ok: true; limit: number }
    | { ok: false; limit: number; reason: 'exhausted' | 'error' }

/**
 * Konsumsi 1 slot quota untuk feature. Return ok=false kalau habis/error.
 *
 * Catatan: quota terhitung walau request setelahnya gagal.
 * Ini disengaja biar gak bisa di-spam.
 */
export async function consumeQuota(
    supabase: SupabaseClient<Database>,
    feature: AiFeature
): Promise<QuotaResult> {
    const limit = AI_QUOTA[feature]

    const { data, error } = await supabase.rpc('consume_ai_quota' as any, {
        p_feature: feature,
        p_limit: limit,
    })

    if (error) {
        console.error('[quota] rpc failed:', error)
        return { ok: false, limit, reason: 'error' }
    }

    if (data !== true) {
        return { ok: false, limit, reason: 'exhausted' }
    }

    return { ok: true, limit }
}

/**
 * Helper: bikin response 429 yang konsisten.
 */
export function quotaExceededResponse(limit: number, feature: AiFeature) {
    const featureLabel: Record<AiFeature, string> = {
        'budget-allocate': 'AI Auto-Budgeting',
        'ff-analyze': 'AI Financial Advisor',
        'ocr-scan': 'Scan struk OCR',
    }

    return {
        error: 'Kuota harian habis',
        detail: `${featureLabel[feature]} cuma bisa dipakai ${limit}× per hari. Coba lagi besok ya.`,
    }
}