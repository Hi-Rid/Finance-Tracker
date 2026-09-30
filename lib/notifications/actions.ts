import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { CreateNotificationInput } from './types'

/**
 * Insert notif dengan dedup_key. Kalau udah ada, gak di-insert.
 * Idempotent - aman dipanggil berkali-kali.
 */
export async function createNotification(input: CreateNotificationInput) {
    const supabase = await createClient()

    const { error } = await supabase.from('notifications').insert({
        user_id: input.userId,
        type: input.type,
        title: input.title,
        body: input.body || null,
        link: input.link || null,
        icon: input.icon || null,
        dedup_key: input.dedupKey || null,
    })

    // 23505 = unique_violation → berarti udah ada, aman ignore
    if (error && error.code !== '23505') {
        console.error('[notif] insert failed:', error)
    }
}

/**
 * Cek semua wishlist yang cooling-off-nya udah selesai.
 * Kalau ada:
 *   1. Update status → planned
 *   2. Bikin notif (dedup: cuma 1x per wishlist)
 *
 * Dipanggil dari app layout setiap kali user buka page baru.
 * Idempotent - aman dipanggil berkali-kali.
 */
export async function syncCoolingOffNotifications(userId: string) {
    const supabase = await createClient()
    const now = new Date().toISOString()

    const { data: expired } = await supabase
        .from('wishlists')
        .select('id, name')
        .eq('user_id', userId)
        .eq('status', 'cooling_off')
        .lt('cooling_off_until', now)

    if (!expired || expired.length === 0) return

    // 1. Update semua status → planned
    const ids = expired.map((w) => w.id)
    await supabase
        .from('wishlists')
        .update({ status: 'planned' })
        .in('id', ids)

    // 2. Bikin notif per wishlist
    for (const w of expired) {
        await createNotification({
            userId,
            type: 'cooling_off_done',
            title: '🧊 Cooling-off selesai!',
            body: `${w.name} udah siap diputuskan. Masih mau beli?`,
            link: '/wishlist',
            icon: 'snowflake',
            dedupKey: `cooling_off_done:${w.id}`,
        })
    }
}