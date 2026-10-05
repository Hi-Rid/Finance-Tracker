import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * Callback handler buat:
 * 1. Email confirmation (dari register)
 * 2. Password reset (dari forgot-password)
 * 3. (Nanti) Magic link, OAuth
 *
 * Supabase verify token, lalu redirect ke sini dengan `?code=xxx`.
 * Kita exchange code → session cookie di-set.
 */

export async function GET(request: Request) {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const next = url.searchParams.get('next') || '/setup-pin'
    const error = url.searchParams.get('error')
    const errorDescription = url.searchParams.get('error_description')

    // Error dari Supabase (link expired, dll)
    if (error) {
        const params = new URLSearchParams({
            error: errorDescription || error || 'verification_failed',
        })
        return NextResponse.redirect(
            new URL(`/login?${params.toString()}`, url.origin)
        )
    }

    if (code) {
        const supabase = await createClient()
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
            code
        )

        if (exchangeError) {
            console.error('[auth/callback] exchange failed:', exchangeError)
            const params = new URLSearchParams({
                error: 'Link verifikasi kadaluwarsa atau udah pernah dipakai. Coba login atau kirim ulang email verifikasi.',
            })
            return NextResponse.redirect(
                new URL(`/login?${params.toString()}`, url.origin)
            )
        }

        // Success — redirect ke next (default /setup-pin untuk user baru)
        return NextResponse.redirect(new URL(next, url.origin))
    }

    // Gak ada code & gak ada error — kemungkinan implicit flow (hash fragment)
    // Redirect ke client page yang handle hash
    return NextResponse.redirect(new URL('/login', url.origin))
}