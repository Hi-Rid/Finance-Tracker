'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, AlertCircle, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { lockSession } from '@/lib/hooks/use-pin'
import { AuthShell } from '@/components/auth/auth-shell'
import { PasswordInput } from '@/components/auth/password-input'

const schema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})

type FormValues = z.infer<typeof schema>

// ============================================================
// INNER (butuh Suspense karena useSearchParams)
// ============================================================

function LoginPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const presetEmail = searchParams.get('email') || ''

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: { email: presetEmail, password: '' },
  })

  useEffect(() => {
    if (searchParams.get('registered') === '1') {
      form.setFocus('email')
    }
  }, [searchParams, form])

  async function onSubmit(data: FormValues) {
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      const msg = authError.message || ''
      if (msg.toLowerCase().includes('email not confirmed')) {
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`)
        return
      }

      if (
        msg.toLowerCase().includes('invalid login credentials') ||
        msg.toLowerCase().includes('invalid_credentials')
      ) {
        setError('Email atau password salah.')
        setLoading(false)
        return
      }

      setError(msg || 'Gagal masuk. Silakan coba lagi.')
      setLoading(false)
      return
    }

    const {
      data: { user: loggedUser },
    } = await supabase.auth.getUser()

    if (!loggedUser) {
      setError('Sesi gagal dibuat. Silakan coba lagi.')
      setLoading(false)
      return
    }

    const { data: settings } = await supabase
      .from('user_settings')
      .select('pin_hash')
      .eq('user_id', loggedUser.id)
      .maybeSingle()

    lockSession()

    if (!settings?.pin_hash) {
      router.push('/setup-pin')
    } else {
      router.push('/unlock')
    }
    router.refresh()
  }

  return (
    <AuthShell
      eyebrow="Selamat Datang Kembali"
      title="Masuk ke Synmony"
      subtitle="Lanjutkan perjalanan keuangan Anda. Semua data Anda sudah menunggu di dalam."
      footer={
        <span className="text-muted-foreground">
          Belum punya akun?{' '}
          <Link
            href="/register"
            className="font-semibold text-brand hover:underline"
          >
            Daftar gratis
          </Link>
        </span>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {searchParams.get('registered') === '1' && !error && (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-4 py-3 flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
              <svg
                viewBox="0 0 20 20"
                fill="none"
                className="w-3 h-3 text-white"
              >
                <path
                  d="M5 10.5l3 3 7-7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                Akun berhasil dibuat!
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5 leading-relaxed">
                Silakan masuk dengan email dan password yang telah Anda daftarkan.
              </p>
            </div>
          </div>
        )}

        {/* Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="email@contoh.com"
              {...form.register('email')}
              className="flex h-11 w-full rounded-lg border bg-white dark:bg-white/5 border-slate-200 dark:border-white/15 pl-10 pr-3.5 text-base md:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30"
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-xs text-red-500">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] font-medium text-brand hover:underline"
            >
              Lupa password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...form.register('password')}
            error={!!form.formState.errors.password}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-red-500">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-3.5 py-3 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
              {error}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-lg bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm shadow-brand/20"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Masuk...
            </>
          ) : (
            'Masuk'
          )}
        </button>
      </form>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-brand" />
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  )
}