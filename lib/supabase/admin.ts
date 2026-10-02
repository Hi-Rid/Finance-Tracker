// ============================================================
// ADMIN CLIENT — SERVER-ONLY
// ============================================================
// Pakai SERVICE ROLE KEY yang bypass RLS.
//
// ⚠️  JANGAN PERNAH import file ini dari:
//     - komponen 'use client'
//     - kode yang ke-bundle ke client
//
// Aman dipakai di:
//     - API route (runtime nodejs)
//     - Vercel Cron handler
//     - Server-only utility
// ============================================================

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        throw new Error(
            'Supabase admin env belum di-set. Cek NEXT_PUBLIC_SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY di .env.local'
        )
    }

    return createClient<Database>(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    })
}