import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Hapus akun user beserta SEMUA data.
 *
 * Alur:
 *  1. Verifikasi sesi user (cookie)
 *  2. Verifikasi konfirmasi: input HAPUS + PIN cocok
 *  3. Hapus semua file Storage milik user (wishlist, avatar, share)
 *  4. Hapus auth.users via admin API
 *     → DB cascade hapus semua row di semua tabel
 *
 * Body: { confirm: string, pin: string }
 * Response: { success: true } atau error
 */

const CONFIRM_TEXT = 'HAPUS'
const STORAGE_BUCKETS = ['wishlist-images', 'avatars', 'share-images'] as const

type Body = {
    confirm: string
    pin: string
}

// ============================================================
// Helpers
// ============================================================

/**
 * Hash PIN — mirror logic di `lib/hooks/use-pin.ts`.
 * (SHA-256 + salt statis, hex string)
 */
async function hashPin(pin: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(pin + 'synmony_salt_v1')
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Hapus semua file user di bucket.
 * Struktur path: {user_id}/{filename} — flat.
 */
async function deleteStorageFolder(
    admin: ReturnType<typeof createAdminClient>,
    bucket: string,
    userId: string
): Promise<{ bucket: string; deleted: number; errors: string[] }> {
    const errors: string[] = []
    let deleted = 0

    try {
        // List files di folder user
        const { data: files, error: listErr } = await admin.storage
            .from(bucket)
            .list(userId, { limit: 1000 })

        if (listErr) {
            // Bucket mungkin gak ada — skip aja, bukan error fatal
            if (listErr.message?.includes('not found')) {
                return { bucket, deleted: 0, errors: [] }
            }
            return { bucket, deleted: 0, errors: [listErr.message] }
        }

        if (!files || files.length === 0) {
            return { bucket, deleted: 0, errors: [] }
        }

        // Filter: cuma files (bukan folder). Folder punya id === null di Supabase API.
        const paths = files
            .filter((f) => f.id !== null)
            .map((f) => `${userId}/${f.name}`)

        if (paths.length === 0) {
            return { bucket, deleted: 0, errors: [] }
        }

        const { error: removeErr } = await admin.storage.from(bucket).remove(paths)

        if (removeErr) {
            errors.push(removeErr.message)
        } else {
            deleted = paths.length
        }
    } catch (err: any) {
        errors.push(err?.message || String(err))
    }

    return { bucket, deleted, errors }
}

// ============================================================
// Handler
// ============================================================

export async function POST(req: Request) {
    // 1. Verify session
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse body
    let body: Body
    try {
        body = await req.json()
    } catch {
        return NextResponse.json(
            { error: 'Format request tidak valid' },
            { status: 400 }
        )
    }

    if (body.confirm !== CONFIRM_TEXT) {
        return NextResponse.json(
            { error: `Ketik "${CONFIRM_TEXT}" untuk konfirmasi` },
            { status: 400 }
        )
    }

    if (!body.pin || body.pin.length !== 6) {
        return NextResponse.json({ error: 'PIN wajib 6 digit' }, { status: 400 })
    }

    // 3. Verify PIN
    const { data: settings } = await supabase
        .from('user_settings')
        .select('pin_hash')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!settings?.pin_hash) {
        return NextResponse.json(
            { error: 'PIN belum di-set di akun ini' },
            { status: 400 }
        )
    }

    const inputHash = await hashPin(body.pin)
    if (inputHash !== settings.pin_hash) {
        return NextResponse.json({ error: 'PIN salah' }, { status: 400 })
    }

    // 4. Delete Storage files (before user delete, biar user_id masih valid)
    const admin = createAdminClient()

    const storageResults = await Promise.all(
        STORAGE_BUCKETS.map((b) => deleteStorageFolder(admin, b, user.id))
    )

    const storageErrors = storageResults.flatMap((r) =>
        r.errors.map((e) => `${r.bucket}: ${e}`)
    )

    // Kalau storage gagal semua, lanjut aja — DB delete tetap priority.
    // Storage orphan lebih baik daripada user stuck gak bisa hapus akun.
    if (storageErrors.length > 0) {
        console.warn('[account/delete] storage cleanup warnings:', storageErrors)
    }

    // 5. Delete auth user (cascade hapus semua DB rows via FK)
    const { error: deleteErr } = await admin.auth.admin.deleteUser(user.id)

    if (deleteErr) {
        console.error('[account/delete] auth delete failed:', deleteErr)
        return NextResponse.json(
            {
                error: 'Gagal hapus akun',
                detail: deleteErr.message,
            },
            { status: 500 }
        )
    }

    // 6. Success
    return NextResponse.json({
        success: true,
        storage_deleted: storageResults.reduce((sum, r) => sum + r.deleted, 0),
        storage_warnings: storageErrors.length > 0 ? storageErrors : undefined,
    })
}