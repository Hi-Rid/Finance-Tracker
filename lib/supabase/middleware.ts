import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname

  // ============================================================
  // Public routes: skip auth check
  // ============================================================
  // - /s/*                     → landing share instan
  // - /api/financial-freedom/snapshot (cron, Bearer auth)
  // - /api/networth/snapshot          (cron, Bearer auth)
  if (
    pathname.startsWith('/s/') ||
    pathname === '/api/financial-freedom/snapshot' ||
    pathname === '/api/networth/snapshot'
  ) {
    return supabaseResponse
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public paths (gak butuh login)
  const isPublicPath =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/setup-pin') ||
    pathname.startsWith('/unlock') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'

  // Belum login & bukan public path → redirect ke login
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // Simpan path asli biar bisa balik setelah login (opsional)
    if (pathname !== '/') {
      url.searchParams.set('next', pathname)
    }
    return NextResponse.redirect(url)
  }

  // Udah login tapi akses /login, /register → redirect ke dashboard
  if (
    user &&
    (pathname === '/login' || pathname === '/register')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}