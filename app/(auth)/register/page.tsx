'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, AlertCircle, Mail, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthShell } from '@/components/auth/auth-shell'
import { PasswordInput } from '@/components/auth/password-input'
import { cn } from '@/lib/utils'

const CONSENT_VERSION = 'v1.0-2026-10'

const schema = z
    .object({
        email: z.string().email('Email gak valid'),
        password: z
            .string()
            .min(8, 'Password minimal 8 karakter')
            .max(72, 'Password maksimal 72 karakter'),
        confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
        consent: z
            .boolean()
            .refine((v) => v === true, 'Lu harus setuju dulu buat lanjut'),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: 'Password gak sama',
        path: ['confirmPassword'],
    })

type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const form = useForm<FormValues>({
        resolver: zodResolver(schema) as any,
        defaultValues: {
            email: '',
            password: '',
            confirmPassword: '',
            consent: false,
        },
        mode: 'onTouched',
    })

    const watchedPassword = form.watch('password') || ''
    const watchedConsent = form.watch('consent')

    // Password strength heuristic
    const pwStrength = (() => {
        const len = watchedPassword.length
        if (len === 0) return { level: 0, label: '', color: 'bg-slate-200 dark:bg-white/10' }
        let score = 0
        if (len >= 8) score++
        if (len >= 12) score++
        if (/[A-Z]/.test(watchedPassword)) score++
        if (/[0-9]/.test(watchedPassword)) score++
        if (/[^A-Za-z0-9]/.test(watchedPassword)) score++

        if (score <= 2)
            return { level: 1, label: 'Lemah', color: 'bg-red-500' }
        if (score <= 3)
            return { level: 2, label: 'Sedang', color: 'bg-amber-500' }
        return { level: 3, label: 'Kuat', color: 'bg-emerald-500' }
    })()

    async function onSubmit(data: FormValues) {
        setLoading(true)
        setError(null)

        const supabase = createClient()
        const origin =
            typeof window !== 'undefined'
                ? window.location.origin
                : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                emailRedirectTo: `${origin}/auth/callback`,
                data: {
                    consented_at: new Date().toISOString(),
                    consent_version: CONSENT_VERSION,
                },
            },
        })

        if (signUpError) {
            const msg = signUpError.message || ''

            if (
                msg.toLowerCase().includes('already registered') ||
                msg.toLowerCase().includes('already been registered') ||
                msg.toLowerCase().includes('user already exists')
            ) {
                setError('Email ini udah terdaftar. Coba masuk atau reset password.')
                setLoading(false)
                return
            }

            if (msg.toLowerCase().includes('password')) {
                setError('Password terlalu lemah. Minimal 8 karakter.')
                setLoading(false)
                return
            }

            setError(msg || 'Gagal daftar. Coba lagi.')
            setLoading(false)
            return
        }

        // Supabase bisa return 200 dengan identities kosong kalau email udah ada
        // (edge case di beberapa config)
        if (
            signUpData?.user &&
            Array.isArray(signUpData.user.identities) &&
            signUpData.user.identities.length === 0
        ) {
            setError('Email ini udah terdaftar. Coba masuk atau reset password.')
            setLoading(false)
            return
        }

        // Success — arahkan ke halaman verify-email
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`)
    }

    return (
        <AuthShell
            eyebrow="Mulai Gratis"
            title="Bikin Akun Synmony"
            subtitle="Satu akun buat semua. Gak perlu kartu kredit, gak ada biaya tersembunyi."
            footer={
                <span className="text-muted-foreground">
                    Udah punya akun?{' '}
                    <Link
                        href="/login"
                        className="font-semibold text-brand hover:underline"
                    >
                        Masuk
                    </Link>
                </span>
            }
        >
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <label
                        htmlFor="password"
                        className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                        Password
                    </label>
                    <PasswordInput
                        id="password"
                        autoComplete="new-password"
                        placeholder="Minimal 8 karakter"
                        {...form.register('password')}
                        error={!!form.formState.errors.password}
                    />

                    {/* Strength bar */}
                    {watchedPassword.length > 0 && (
                        <div className="flex items-center gap-2 pt-0.5">
                            <div className="flex-1 flex gap-1">
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            'h-1 flex-1 rounded-full transition-colors',
                                            i <= pwStrength.level
                                                ? pwStrength.color
                                                : 'bg-slate-200 dark:bg-white/10'
                                        )}
                                    />
                                ))}
                            </div>
                            <span
                                className={cn(
                                    'text-[10px] font-bold tabular-nums',
                                    pwStrength.level === 1 && 'text-red-500',
                                    pwStrength.level === 2 && 'text-amber-500',
                                    pwStrength.level === 3 && 'text-emerald-500'
                                )}
                            >
                                {pwStrength.label}
                            </span>
                        </div>
                    )}

                    {form.formState.errors.password && (
                        <p className="text-xs text-red-500">
                            {form.formState.errors.password.message}
                        </p>
                    )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                    <label
                        htmlFor="confirmPassword"
                        className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                        Konfirmasi Password
                    </label>
                    <PasswordInput
                        id="confirmPassword"
                        autoComplete="new-password"
                        placeholder="Ulangi password"
                        {...form.register('confirmPassword')}
                        error={!!form.formState.errors.confirmPassword}
                    />
                    {form.formState.errors.confirmPassword && (
                        <p className="text-xs text-red-500">
                            {form.formState.errors.confirmPassword.message}
                        </p>
                    )}
                </div>

                {/* Consent checkbox */}
                <div className="pt-1">
                    <label
                        htmlFor="consent"
                        className={cn(
                            'flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none',
                            watchedConsent
                                ? 'bg-brand/5 border-brand/40'
                                : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 hover:border-brand/30'
                        )}
                    >
                        <div className="pt-0.5 shrink-0">
                            <input
                                id="consent"
                                type="checkbox"
                                className="sr-only"
                                {...form.register('consent')}
                            />
                            <div
                                className={cn(
                                    'w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center transition-all',
                                    watchedConsent
                                        ? 'bg-brand border-brand'
                                        : 'border-slate-300 dark:border-white/20'
                                )}
                            >
                                {watchedConsent && (
                                    <Check className="w-3 h-3 text-white" strokeWidth={3.5} />
                                )}
                            </div>
                        </div>
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                            Saya udah baca & setuju dengan{' '}
                            <Link
                                href="/terms"
                                target="_blank"
                                className="font-semibold text-brand hover:underline"
                            >
                                Syarat & Ketentuan
                            </Link>{' '}
                            dan{' '}
                            <Link
                                href="/privacy"
                                target="_blank"
                                className="font-semibold text-brand hover:underline"
                            >
                                Kebijakan Privasi
                            </Link>{' '}
                            Synmony.
                        </span>
                    </label>
                    {form.formState.errors.consent && (
                        <p className="text-xs text-red-500 mt-1.5">
                            {form.formState.errors.consent.message}
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

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 rounded-lg bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm shadow-brand/20"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Bikin akun...
                        </>
                    ) : (
                        'Daftar Gratis'
                    )}
                </button>

                {/* Info bawah */}
                <p className="text-[10px] text-center text-muted-foreground/70 leading-relaxed pt-1">
                    Setelah daftar, lu bakal dapet email verifikasi. Klik link di email
                    buat aktifin akun.
                </p>
            </form>
        </AuthShell>
    )
}