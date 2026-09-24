import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scanReceiptWithNanonets } from '@/lib/ocr/nanonets'
import { parseReceiptResponse } from '@/lib/ocr/parse-receipt'
import { matchCategoryByName } from '@/lib/ocr/match-category'

export const runtime = 'nodejs'
export const maxDuration = 60 // 60 detik max (Vercel hobby limit)

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'application/pdf',
]

export async function POST(req: Request) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ambil profile default
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .limit(1)

    const profileId = profiles?.[0]?.id || null

    // Fetch categories untuk auto-match
    const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)

    let formData: FormData
    try {
        formData = await req.formData()
    } catch {
        return NextResponse.json(
            { error: 'Format request tidak valid' },
            { status: 400 }
        )
    }

    const file = formData.get('file') as File | null

    if (!file) {
        return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })
    }

    // Validasi ukuran
    if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
            { error: `File terlalu besar (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` },
            { status: 400 }
        )
    }

    // Validasi tipe
    if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
            { error: `Tipe file tidak didukung: ${file.type}` },
            { status: 400 }
        )
    }

    try {
        // 1. Kirim ke Nanonets
        const rawResponse = await scanReceiptWithNanonets(file)

        // 2. Parse hasil
        const parsed = parseReceiptResponse(rawResponse)

        // 3. Auto-match kategori dari field Category (pocket Jago)
        const matchedCategory = matchCategoryByName(
            parsed.category,
            categories || []
        )

        // 3. Simpan ke DB
        const { data: receipt, error: dbError } = await supabase
            .from('receipts')
            .insert({
                user_id: user.id,
                profile_id: profileId,
                request_file_id: parsed.requestFileId,
                file_url: parsed.fileUrl,           // ← BARU
                signed_url: parsed.signedUrl,
                signed_url_long: parsed.signedUrlLong,
                raw_ocr_response: rawResponse,
                parsed_data: parsed,
                confidence: parsed.confidence,
                provider: 'nanonets',
                status: 'success',
            })
            .select()
            .single()

        if (dbError) {
            console.error('Failed to save receipt to DB:', dbError)
            // Gak block return — user tetep dapet hasil OCR
        }

        return NextResponse.json({
            success: true,
            receiptId: receipt?.id || null,
            parsed,
            suggestedCategoryId: matchedCategory?.id || null,
            suggestedCategoryName: matchedCategory?.name || null,
        })
    } catch (err: any) {
        console.error('OCR scan error:', err)

        // Log failed attempt
        try {
            await supabase.from('receipts').insert({
                user_id: user.id,
                profile_id: profileId,
                provider: 'nanonets',
                status: 'failed',
                error_message: err?.message || String(err),
            })
        } catch (logErr) {
            console.error('Failed to log error:', logErr)
        }

        return NextResponse.json(
            { error: err?.message || 'Gagal scan struk' },
            { status: 500 }
        )
    }
}