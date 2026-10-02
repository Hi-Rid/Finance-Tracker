'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { AuthShell } from '@/components/auth/auth-shell'
import { PasswordInput } from '@/components/auth/password-input'
import { cn } from '@/lib/utils'

const schema = z
    .object({
        password: z
            .string()
            .min(8, 'Password minimal 8 karakter')
            .max(72, 'Password maksimal 72 karakter'),
        confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: 'Password gak sama',
        path: ['confirmPassword'],
    })

type FormValues = z.infer<typeof schema>

export default function ResetPasswordPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [checking, setChecking] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const form = useForm<FormValues>({
        resolver: zodResolver(schema) as any,
        defaultValues: { password: '', confirmPassword: '' },
    })

    const watchedPassword = form.watch('password') || ''

    // Verify session exists (user harus datang dari email link → /auth/callback → sini)
    useEffect(() => {
        async function check() {
            const supabase = createClient()
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                setError(
                    'Link reset gak valid atau udah expired. Minta link baru dari halaman "Lupa password".'
                )
                setChecking(false)
                return
            }

            setChecking(false)
        }
        check()
    }, [])

    const pwStrength = (() => {
        const len = watchedPassword.length
        if (len === 0) return { level: 0, label: '', color: 'bg-slate-200 dark:bg-white/10' }
        let score = 0
        if (len >= 8) score++
        if (len >= 12) score++
        if (/[A-Z]/.test(watchedPassword)) score++
        if (/[0-9]/.test(watchedPassword)) score++
        if (/[^A-Za-z0-9]/.test(watchedPassword)) score++

        if (score <= 2) return { level: 1, label: 'Lemah', color: 'bg-red-500' }
        if (score <= 3) return { level: 2, label: 'Sedang', color: 'bg-amber-500' }
        return { level: 3, label: 'Kuat', color: 'bg-emerald-500' }
    })()

    async function onSubmit(data: FormValues) {
        setLoading(true)
        setError(null)

        const supabase = createClient()
        const { error: updateError } = await supabase.auth.updateUser({
            password: data.password,
        })

        if (updateError) {
            const msg = updateError.message || ''
            if (msg.toLowerCase().includes('password')) {
                setError('Password terlalu lemah. Minimal 8 karakter.')
            } else {
                setError(msg || 'Gagal update password. Coba lagi.')
            }
            setLoading(false)
            return
        }

        // Sign out supaya user login fresh
        await supabase.auth.signOut()
        toast.success('Password berhasil direset. Silakan masuk dengan password baru.')
        router.push('/login')
        router.refresh()
    }

    // ============================================================
    // CHECKING STATE
    // ============================================================
    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-6 h-6 animate-spin text-brand" />
            </div>
        )
    }

    // ============================================================
    // ERROR STATE (no session)
    // ============================================================
    if (error && !form.formState.isSubmitting) {
        return (
            <AuthShell
                eyebrow="Link Bermasalah"
                title="Reset Password Gagal"
                subtitle="Link reset lu udah gak valid."
                footer={
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-1.5 font-semibold text-brand hover:underline"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Balik ke halaman masuk
                    </Link>
                }
            >
                <div className="space-y-4">
                    <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-4 py-3.5 flex items-start gap-2.5">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                            {error}
                        </p>
                    </div>
                    <Link
                        href="/forgot-password"
                        className="flex w-full h-11 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-bold transition-all items-center justify-center shadow-sm shadow-brand/20"
                    >
                        Minta Link Reset Baru
                    </Link>
                </div>
            </AuthShell>
        )
    }

    // ============================================================
    // FORM STATE
    // ============================================================
    return (
        <AuthShell
            eyebrow="Password Baru"
            title="Bikin Password Baru"
            subtitle="Masukin password baru buat akun Synmony lu."
        >
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Password baru */}
                <div className="space-y-1.5">
                    <label
                        htmlFor="password"
                        className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                        Password Baru
                    </label>
                    <PasswordInput
                        id="password"
                        autoComplete="new-password"
                        placeholder="Minimal 8 karakter"
                        autoFocus
                        {...form.register('password')}
                        error={!!form.formState.errors.password}
                    />

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

                {/* Confirm */}
                <div className="space-y-1.5">
                    <label
                        htmlFor="confirmPassword"
                        className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                        Konfirmasi Password Baru
                    </label>
                    <PasswordInput
                        id="confirmPassword"
                        autoComplete="new-password"
                        placeholder="Ulangi password baru"
                        {...form.register('confirmPassword')}
                        error={!!form.formState.errors.confirmPassword}
                    />
                    {form.formState.errors.confirmPassword && (
                        <p className="text-xs text-red-500">
                            {form.formState.errors.confirmPassword.message}
                        </p>
                    )}
                </div>

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
                            Nyimpen...
                        </>
                    ) : (
                        'Simpan Password Baru'
                    )}
                </button>
            </form>
        </AuthShell>
    )
}