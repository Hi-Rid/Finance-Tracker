import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveFiParams } from '@/lib/utils/financial-freedom'
import { fetchFinancialFreedomServerData } from '@/lib/financial-freedom/server-compute'
import { getCurrentMonth } from '@/lib/utils/month'
import type { FiType } from '@/lib/validators/financial-freedom'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Snapshot bulanan FF.
 *
 * 2 mode:
 * - **Cron mode**: Header `x-cron-secret` match `CRON_SECRET` → proses SEMUA user
 * - **User mode**: auth user → snapshot 1 profile user sendiri (manual trigger)
 *
 * Idempotent: pakai UNIQUE(profile_id, snapshot_month), re-run same month = update.
 *
 * Setup Vercel Cron (vercel.json):
 *   { "crons": [{ "path": "/api/financial-freedom/snapshot", "schedule": "0 17 * * *" }] }
 *   → 17:00 UTC = 00:00 WIB tanggal 1 tiap bulan
 */
export async function POST(req: Request) {
    const cronSecret = req.headers.get('x-cron-secret')
    const isCron = cronSecret && cronSecret === process.env.CRON_SECRET

    if (isCron) {
        return handleCronMode()
    }
    return handleUserMode()
}

// ============================================================
// CRON MODE - proses semua user
// ============================================================

async function handleCronMode() {
    const supabase = await createClient()

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
            const result = await snapshotOne(s.profile_id)
            results.push({ profileId: s.profile_id, status: result })
        } catch (err: any) {
            console.error(`[ff/snapshot] ${s.profile_id} failed:`, err)
            results.push({ profileId: s.profile_id, status: `error: ${err.message}` })
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
// USER MODE - manual trigger dari UI
// ============================================================

async function handleUserMode() {
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

    const status = await snapshotOne(profile.id)
    return NextResponse.json({ success: true, mode: 'user', status })
}

// ============================================================
// CORE: snapshot 1 profile
// ============================================================

async function snapshotOne(profileId: string): Promise<string> {
    const supabase = await createClient()

    const { data: settings } = await supabase
        .from('financial_freedom_settings')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle()

    if (!settings) return 'no_settings'

    // Ambil user_id dari profile untuk fetch server data
    const { data: profileRow } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', profileId)
        .single()

    if (!profileRow) return 'no_profile'

    const serverData = await fetchFinancialFreedomServerData({
        profileId,
        userId: profileRow.user_id,
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
                user_id: profileRow.user_id,
                profile_id: profileId,
                snapshot_month: snapshotMonth,
                net_worth: resolved.currentNetWorth,
                fi_number: resolved.fiNumber,
                fi_progress: resolved.fiProgress,
                savings_rate: resolved.savingsRate / 100,
                lean_fi_progress:
                    leanFiNumber > 0 ? (resolved.currentNetWorth / leanFiNumber) * 100 : 0,
                regular_fi_progress:
                    regularFiNumber > 0
                        ? (resolved.currentNetWorth / regularFiNumber) * 100
                        : 0,
                fat_fi_progress:
                    fatFiNumber > 0 ? (resolved.currentNetWorth / fatFiNumber) * 100 : 0,
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