import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Export semua data user sebagai JSON.
 * Pakai cookie client (RLS aktif) — data cuma punya user sendiri.
 *
 * Response: attachment JSON `synmony-export-YYYY-MM-DD.json`
 */

// ============================================================
// Tables yang punya user_id langsung
// ============================================================
const DIRECT_TABLES = [
    'profiles',
    'user_settings',
    'accounts',
    'categories',
    'tags',
    'contacts',
    'transactions',
    'audit_logs',
    'events',
    'debts',
    'budgets',
    'budget_periods',
    'envelopes',
    'daily_budget_items',
    'goals',
    'wishlists',
    'recurring',
    'subscriptions',
    'reminders',
    'notifications',
    'assets',
    'tax_records',
    'zakat_records',
    'documents',
    'trips',
    'gifts',
    'milestones',
    'receipts',
    'groups',
    'financial_freedom_settings',
    'financial_freedom_snapshots',
    'financial_freedom_insights',
    'financial_freedom_milestones',
    'financial_freedom_action_steps',
    'net_worth_snapshots',
] as const

// ============================================================
// Tables child (via parent) — RLS handle filter
// ============================================================
const CHILD_TABLES = [
    'transaction_tags',
    'event_participants',
    'event_items',
    'event_item_shares',
    'event_receipts',
    'debt_payments',
    'envelope_transactions',
    'goal_contributions',
    'wishlist_saving_plans',
    'asset_valuations',
    'investment_details',
    'investment_transactions',
    'asset_prices',
    'trip_members',
    'trip_budget_items',
    'trip_checklist_items',
    'group_members',
] as const

/**
 * Fetch semua rows dari 1 table dengan pagination loop.
 * Supabase default `max_rows = 1000`, jadi handle user dengan data besar.
 */
async function fetchAll(
    supabase: any,
    table: string,
    userColumn: 'user_id' | null,
    userId: string
): Promise<{ table: string; rows: any[]; error?: string }> {
    const PAGE_SIZE = 1000
    const allRows: any[] = []
    let from = 0

    while (true) {
        let query = supabase.from(table).select('*').range(from, from + PAGE_SIZE - 1)

        if (userColumn === 'user_id') {
            query = query.eq('user_id', userId)
        }

        const { data, error } = await query

        if (error) {
            return { table, rows: allRows, error: error.message }
        }

        if (!data || data.length === 0) break

        allRows.push(...data)

        if (data.length < PAGE_SIZE) break
        from += PAGE_SIZE

        // Safety: max 100 halaman (100k rows) — gak mungkin user personal punya lebih
        if (from > 100_000) break
    }

    return { table, rows: allRows }
}

export async function GET() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const startedAt = Date.now()

    // ============ Fetch direct tables (dengan user_id filter) ============
    const directResults = await Promise.all(
        DIRECT_TABLES.map((t) => fetchAll(supabase, t, 'user_id', user.id))
    )

    // ============ Fetch child tables (RLS handle filter) ============
    const childResults = await Promise.all(
        CHILD_TABLES.map((t) => fetchAll(supabase, t, null, user.id))
    )

    // ============ Build payload ============
    const payload = {
        _meta: {
            app: 'Synmony',
            version: '0.1.0',
            exported_at: new Date().toISOString(),
            user_id: user.id,
            user_email: user.email,
            format: 'json',
            notes:
                'Semua data user, exclude file (gambar wishlist, avatar, struk) yang tersimpan di Supabase Storage. Untuk backup lengkap, hubungi support.',
        },
        data: {} as Record<string, any[]>,
        errors: [] as Array<{ table: string; error: string }>,
    }

    for (const res of [...directResults, ...childResults]) {
        if (res.error) {
            payload.errors.push({ table: res.table, error: res.error })
            payload.data[res.table] = []
        } else {
            payload.data[res.table] = res.rows
        }
    }

    // ============ Stats ============
    const stats: Record<string, number> = {}
    let totalRows = 0
    for (const [table, rows] of Object.entries(payload.data)) {
        stats[table] = rows.length
        totalRows += rows.length
    }

    ; (payload._meta as any).stats = stats
        ; (payload._meta as any).total_rows = totalRows
        ; (payload._meta as any).duration_ms = Date.now() - startedAt

    // ============ Response ============
    const filename = `synmony-export-${new Date().toISOString().split('T')[0]}.json`

    return new NextResponse(JSON.stringify(payload, null, 2), {
        status: 200,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-store',
        },
    })
}