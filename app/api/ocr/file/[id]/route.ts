import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: receipt, error } = await supabase
        .from('receipts')
        .select('file_url, signed_url, signed_url_long')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (error || !receipt) {
        return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    const apiKey = process.env.NANONETS_API_KEY
    if (!apiKey) {
        return NextResponse.json(
            { error: 'NANONETS_API_KEY belum di-set' },
            { status: 500 }
        )
    }

    const authToken = Buffer.from(`${apiKey}:`).toString('base64')

    // ============================================================
    // STRATEGI:
    // 1. Coba fetch `file_url` pakai API key (paling reliable, gak expired)
    // 2. Fallback: redirect ke signed_url_long / signed_url
    // ============================================================

    const candidates: string[] = []

    if (receipt.file_url) {
        const fullUrl = receipt.file_url.startsWith('http')
            ? receipt.file_url
            : `https://app.nanonets.com/${receipt.file_url.replace(/^\/+/, '')}`
        candidates.push(fullUrl)
    }

    for (const url of candidates) {
        try {
            const fileRes = await fetch(url, {
                headers: {
                    Authorization: `Basic ${authToken}`,
                },
            })

            if (fileRes.ok) {
                const contentType =
                    fileRes.headers.get('content-type') || 'application/octet-stream'
                const buffer = await fileRes.arrayBuffer()

                return new NextResponse(buffer, {
                    status: 200,
                    headers: {
                        'Content-Type': contentType,
                        'Cache-Control': 'private, max-age=3600',
                    },
                })
            }

            console.warn(`Fetch ${url} failed with status ${fileRes.status}`)
        } catch (err) {
            console.warn(`Fetch ${url} threw error:`, err)
        }
    }

    // Fallback: redirect ke signed URL
    const signedUrl = receipt.signed_url_long || receipt.signed_url
    if (signedUrl) {
        return NextResponse.redirect(signedUrl)
    }

    return NextResponse.json({ error: 'File tidak tersedia' }, { status: 404 })
}