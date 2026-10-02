import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAuthorizedCron } from '@/lib/utils/cron-auth'
import { resolveFiParams } from '@/lib/utils/financial-freedom'
import { fetchFinancialFreedomServerData } from '@/lib/financial-freedom/server-compute'
import { getCurrentMonth } from '@/lib/utils/month'
import type { FiType } from '@/lib/validators/financial-freedom'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Snapshot bulanan Financial Freedom.
 *
 * **GET** → Vercel Cron (Bearer auth dari CRON_SECRET).
 *          Proses SEMUA user yang onboarding_completed = true.
 *          Pakai service-role admin client (RLS bypass).
 *
 * **POST** → User manual trigger dari UI.
 *          Cuma proses profile default user sendiri.
 *          Pakai cookie client (RLS aktif).
 *
 * Idempotent: UNIQUE(profile_id, snapshot_month), re-run = update.
 *
 * Cron jadwal: `0 17 * * *` (UTC) = 00:00 WIB, HARIAN.
 * 17:00 UTC = 00:00 WIB. Vercel Hobby max 1×/hari.
 */

// ============================================================
// GET — CRON MODE
// ============================================================

export async function GET(req: Request) {
    if (!isAuthorizedCron(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { data: settingsList, error } = await supabase
        .from('financial_freedom_settings')
        .select('user_id, profile_id')
        .eq('onboarding_completed', true)

    if (error) {
        console.error('[ff/snapshot cron] fetch failed:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const results: Array<{ profileId: string; status: string }> = []

    for (const s of settingsList || []) {
        try {
            const status = await snapshotOne(
                supabase,
                s.profile_id,
                s.user_id
            )
            results.push({ profileId: s.profile_id, status })
        } catch (err: any) {
            console.error(`[ff/snapshot] ${s.profile_id} failed:`, err)
            results.push({
                profileId: s.profile_id,
                status: `error: ${err.message}`,
            })
        }
    }

    return NextResponse.json({
        success: true,
        mode: 'cron',
        total: results.length,
        results,
    })
}

// ============================================================
// POST — USER MODE (manual trigger dari UI)
// ============================================================

export async function POST() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .order('created_at', { ascending: true })
        .limit(1)

    const profile = profiles?.[0]
    if (!profile) {
        return NextResponse.json({ error: 'Profile gak ada' }, { status: 404 })
    }

    const status = await snapshotOne(supabase, profile.id, user.id)
    return NextResponse.json({ success: true, mode: 'user', status })
}

// ============================================================
// CORE: snapshot 1 profile
// ============================================================

async function snapshotOne(
    supabase: SupabaseClient<Database>,
    profileId: string,
    userId: string
): Promise<string> {
    const { data: settings } = await supabase
        .from('financial_freedom_settings')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle()

    if (!settings) return 'no_settings'

    const serverData = await fetchFinancialFreedomServerData({
        profileId,
        userId,
        supabase,
    })

    const monthlyExpense =
        settings.monthly_expense_override !== null
            ? Number(settings.monthly_expense_override)
            : serverData.avgExpense

    const monthlyIncome =
        settings.monthly_income_override !== null
            ? Number(settings.monthly_income_override)
            : serverData.income.value

    if (monthlyExpense <= 0) return 'no_expense_data'

    const resolved = resolveFiParams({
        monthlyExpense,
        monthlyIncome,
        fiType: settings.fi_type as FiType,
        fiMultiplier: Number(settings.fi_multiplier),
        expectedReturnRate: Number(settings.expected_return_rate),
        inflationRate: Number(settings.inflation_rate),
        currentAge: settings.current_age,
        targetRetireAge: settings.target_retire_age,
        currentNetWorth: serverData.netWorth.total,
    })

    // Progress per tipe FI (Lean 20×, Regular 25×, Fat 33×)
    const leanFiNumber = monthlyExpense * 12 * 20
    const regularFiNumber = monthlyExpense * 12 * 25
    const fatFiNumber = monthlyExpense * 12 * 33

    const snapshotMonth = getCurrentMonth()

    const { error } = await supabase
        .from('financial_freedom_snapshots')
        .upsert(
            {
                user_id: userId,
                profile_id: profileId,
                snapshot_month: snapshotMonth,
                net_worth: resolved.currentNetWorth,
                fi_number: resolved.fiNumber,
                fi_progress: resolved.fiProgress,
                savings_rate: resolved.savingsRate / 100,
                lean_fi_progress:
                    leanFiNumber > 0
                        ? (resolved.currentNetWorth / leanFiNumber) * 100
                        : 0,
                regular_fi_progress:
                    regularFiNumber > 0
                        ? (resolved.currentNetWorth / regularFiNumber) * 100
                        : 0,
                fat_fi_progress:
                    fatFiNumber > 0
                        ? (resolved.currentNetWorth / fatFiNumber) * 100
                        : 0,
                coast_fi_progress: resolved.coastFiProgress,
                estimated_fi_date: resolved.fiDate
                    ? resolved.fiDate.toISOString().split('T')[0]
                    : null,
                monthly_expense: monthlyExpense,
                monthly_income: monthlyIncome,
            },
            { onConflict: 'profile_id,snapshot_month' }
        )

    if (error) {
        console.error('[ff/snapshot] upsert failed:', error)
        return `error: ${error.message}`
    }

    return 'ok'
}