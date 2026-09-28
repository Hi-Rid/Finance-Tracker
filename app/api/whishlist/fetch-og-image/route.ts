import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 30

type Body = {
    url: string
    wishlistId?: string
}

/**
 * Extract OG image dari URL, download, upload ke Supabase Storage.
 * Return public URL.
 */
export async function POST(req: Request) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: Body
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: 'Body invalid' }, { status: 400 })
    }

    const { url } = body

    if (!url || typeof url !== 'string') {
        return NextResponse.json({ error: 'URL wajib' }, { status: 400 })
    }

    // Validasi URL
    let parsedUrl: URL
    try {
        parsedUrl = new URL(url)
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            throw new Error('Protocol gak didukung')
        }
    } catch {
        return NextResponse.json({ error: 'URL gak valid' }, { status: 400 })
    }

    // ============================================================
    // 1. Fetch HTML dari URL
    // ============================================================
    let html: string
    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 12000)

        const res = await fetch(url, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                Accept:
                    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
            },
            signal: controller.signal,
            redirect: 'follow',
        })

        clearTimeout(timeout)

        if (!res.ok) {
            return NextResponse.json(
                { error: `Gagal fetch halaman (${res.status})` },
                { status: 400 }
            )
        }

        html = await res.text()
    } catch (err: any) {
        console.error('[fetch-og] page fetch failed:', err)
        return NextResponse.json(
            {
                error:
                    err?.name === 'AbortError'
                        ? 'Halaman timeout — coba lagi'
                        : 'Gak bisa akses halaman. Coba upload manual.',
            },
            { status: 400 }
        )
    }

    // ============================================================
    // 2. Extract OG image URL
    // ============================================================
    const ogImageUrl = extractOgImage(html, parsedUrl)

    if (!ogImageUrl) {
        return NextResponse.json(
            { error: 'Gak ketemu gambar di halaman ini. Upload manual aja.' },
            { status: 404 }
        )
    }

    // ============================================================
    // 3. Download image
    // ============================================================
    let imageBuffer: ArrayBuffer
    let contentType: string
    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 12000)

        const imgRes = await fetch(ogImageUrl, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                Referer: url,
            },
            signal: controller.signal,
        })

        clearTimeout(timeout)

        if (!imgRes.ok) {
            return NextResponse.json(
                { error: 'Gagal download gambar dari halaman' },
                { status: 400 }
            )
        }

        imageBuffer = await imgRes.arrayBuffer()
        contentType = imgRes.headers.get('content-type') || 'image/jpeg'
    } catch (err) {
        console.error('[fetch-og] image download failed:', err)
        return NextResponse.json(
            { error: 'Gagal download gambar' },
            { status: 400 }
        )
    }

    // ============================================================
    // 4. Validasi ukuran (max 5MB)
    // ============================================================
    if (imageBuffer.byteLength > 5 * 1024 * 1024) {
        return NextResponse.json(
            { error: 'Gambar terlalu besar (>5MB)' },
            { status: 400 }
        )
    }

    // ============================================================
    // 5. Upload ke Supabase Storage
    // ============================================================
    const ext = getExtensionFromContentType(contentType)
    const filename = `${user.id}/og-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`

    const { error: uploadErr } = await supabase.storage
        .from('wishlist-images')
        .upload(filename, imageBuffer, {
            contentType,
            cacheControl: '31536000',
            upsert: false,
        })

    if (uploadErr) {
        console.error('[fetch-og] upload failed:', uploadErr)
        return NextResponse.json(
            { error: 'Gagal upload gambar ke storage' },
            { status: 500 }
        )
    }

    // ============================================================
    // 6. Get public URL
    // ============================================================
    const {
        data: { publicUrl },
    } = supabase.storage.from('wishlist-images').getPublicUrl(filename)

    return NextResponse.json({
        success: true,
        imageUrl: publicUrl,
        imagePath: filename,
        source: 'auto',
    })
}

// ============================================================
// Helpers
// ============================================================

function extractOgImage(html: string, baseUrl: URL): string | null {
    const patterns = [
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
        /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
        /<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i,
    ]

    for (const pattern of patterns) {
        const match = html.match(pattern)
        if (match && match[1]) {
            const raw = match[1].trim()
            // Handle relative URL
            if (raw.startsWith('//')) return `https:${raw}`
            if (raw.startsWith('/')) return `${baseUrl.origin}${raw}`
            if (raw.startsWith('http')) return raw
            return `${baseUrl.origin}/${raw.replace(/^\/+/, '')}`
        }
    }

    return null
}

function getExtensionFromContentType(ct: string): string {
    if (ct.includes('png')) return 'png'
    if (ct.includes('webp')) return 'webp'
    if (ct.includes('gif')) return 'gif'
    return 'jpg'
}