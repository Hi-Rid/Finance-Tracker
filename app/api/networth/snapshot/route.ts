import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAuthorizedCron } from '@/lib/utils/cron-auth'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Snapshot net worth bulanan.
 *
 * **GET** → Vercel Cron (Bearer auth).
 *          Proses SEMUA profile default.
 *          Pakai service-role admin client.
 *
 * **POST** → User manual trigger.
 *          Cuma profile default user sendiri.
 *          Pakai cookie client.
 *
 * Cron jadwal: `5 17 * * *` (UTC) = 00:05 WIB, HARIAN.
 * 5 menit setelah FF snapshot biar gak overlap.
 */

// ============================================================
// GET — CRON MODE
// ============================================================

export async function GET(req: Request) {
    if (!isAuthorizedCron(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_default', true)

    if (error) {
        console.error('[nw/snapshot cron] fetch failed:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const results: Array<{ profileId: string; status: string }> = []

    for (const p of profiles || []) {
        try {
            const { error: rpcErr } = await supabase.rpc(
                'upsert_net_worth_snapshot' as any,
                { p_profile_id: p.id }
            )
            results.push({
                profileId: p.id,
                status: rpcErr ? `error: ${rpcErr.message}` : 'ok',
            })
        } catch (err: any) {
            results.push({ profileId: p.id, status: `error: ${err.message}` })
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
// POST — USER MODE
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

    const { error: rpcErr } = await supabase.rpc(
        'upsert_net_worth_snapshot' as any,
        { p_profile_id: profile.id }
    )

    if (rpcErr) {
        console.error('[nw/snapshot user] failed:', rpcErr)
        return NextResponse.json({ error: rpcErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, mode: 'user', status: 'ok' })
}