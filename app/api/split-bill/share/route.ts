import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

export const runtime = 'nodejs'
export const maxDuration = 30

const BUCKET = 'share-images'
const EXPIRES_DAYS = 5

function generateSlug(): string {
    // 9 bytes → 12 chars base64url. ~72 bits entropy.
    return randomBytes(9).toString('base64url')
}

export async function POST(req: Request) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let formData: FormData
    try {
        formData = await req.formData()
    } catch {
        return NextResponse.json(
            { error: 'Format request tidak valid' },
            { status: 400 }
        )
    }

    const eventId = formData.get('eventId') as string | null
    const file = formData.get('image') as File | null

    if (!eventId || !file) {
        return NextResponse.json(
            { error: 'eventId dan image wajib' },
            { status: 400 }
        )
    }

    // Validasi file
    if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
            { error: 'Image terlalu besar (max 5MB)' },
            { status: 400 }
        )
    }

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        return NextResponse.json(
            { error: 'Format image tidak didukung' },
            { status: 400 }
        )
    }

    // Verify event ownership + get old image
    const { data: event } = await supabase
        .from('events')
        .select('id, user_id, share_image_url')
        .eq('id', eventId)
        .eq('user_id', user.id)
        .maybeSingle()

    if (!event) {
        return NextResponse.json(
            { error: 'Event tidak ditemukan' },
            { status: 404 }
        )
    }

    // Delete old image (kalau re-share)
    if (event.share_image_url) {
        try {
            const oldUrl = new URL(event.share_image_url)
            const match = oldUrl.pathname.match(/\/share-images\/(.+)$/)
            if (match?.[1]) {
                await supabase.storage
                    .from(BUCKET)
                    .remove([decodeURIComponent(match[1])])
            }
        } catch (err) {
            console.warn('[share] old image cleanup failed:', err)
        }
    }

    // Generate slug + upload
    const slug = generateSlug()
    const ext = file.type === 'image/png' ? 'png' : 'jpg'
    const path = `${user.id}/${eventId}-${slug}.${ext}`

    const arrayBuffer = await file.arrayBuffer()

    const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, arrayBuffer, {
            contentType: file.type,
            cacheControl: '300',
            upsert: false,
        })

    if (uploadErr) {
        console.error('[share] upload failed:', uploadErr)
        return NextResponse.json(
            { error: 'Gagal upload image' },
            { status: 500 }
        )
    }

    const {
        data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path)

    // Update event row
    const now = new Date()
    const expiresAt = new Date(
        now.getTime() + EXPIRES_DAYS * 24 * 60 * 60 * 1000
    )

    const { error: updateErr } = await supabase
        .from('events')
        .update({
            share_slug: slug,
            share_image_url: publicUrl,
            share_created_at: now.toISOString(),
            share_expires_at: expiresAt.toISOString(),
        })
        .eq('id', eventId)

    if (updateErr) {
        console.error('[share] update failed:', updateErr)
        // Rollback image upload
        await supabase.storage.from(BUCKET).remove([path])
        return NextResponse.json(
            { error: 'Gagal simpan share link' },
            { status: 500 }
        )
    }

    const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const shareUrl = `${baseUrl}/s/${slug}`

    return NextResponse.json({
        success: true,
        slug,
        shareUrl,
        expiresAt: expiresAt.toISOString(),
        imageUrl: publicUrl,
    })
}