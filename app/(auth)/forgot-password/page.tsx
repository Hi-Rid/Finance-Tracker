'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Mail, CheckCircle2, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthShell } from '@/components/auth/auth-shell'

const schema = z.object({
    email: z.string().email('Email gak valid'),
})

type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [sentEmail, setSentEmail] = useState('')

    const form = useForm<FormValues>({
        resolver: zodResolver(schema) as any,
        defaultValues: { email: '' },
    })

    async function onSubmit(data: FormValues) {
        setLoading(true)

        const supabase = createClient()
        const origin = window.location.origin

        const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
            redirectTo: `${origin}/auth/callback?next=/reset-password`,
        })

        setLoading(false)

        // Selalu tampilkan success message (security: jangan bocorin email terdaftar atau enggak)
        if (error) {
            console.error('[forgot-password] failed:', error)
        }

        setSentEmail(data.email)
        setSent(true)
    }

    // ============================================================
    // SUCCESS STATE
    // ============================================================
    if (sent) {
        return (
            <AuthShell
                eyebrow="Cek Email"
                title="Link Reset Udah Dikirim"
                subtitle="Cek inbox (atau spam) buat link reset password."
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
                <div className="space-y-5">
                    <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-5 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-3.5">
                            <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1.5">
                            Link Dikirim Ke
                        </p>
                        <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200 break-all">
                            {sentEmail}
                        </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 px-4 py-3.5">
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            Klik link di email buat bikin password baru. Link berlaku 1 jam.
                            Kalau gak nemu, cek folder <strong>Spam</strong>.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setSent(false)
                            form.reset()
                        }}
                        className="w-full h-11 rounded-lg text-sm font-medium text-muted-foreground hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        Kirim ke email lain
                    </button>
                </div>
            </AuthShell>
        )
    }

    // ============================================================
    // FORM STATE
    // ============================================================
    return (
        <AuthShell
            eyebrow="Lupa Password"
            title="Reset Password Lu"
            subtitle="Masukin email yang lu pakai buat daftar. Kami bakal kirim link reset."
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                            autoFocus
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

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 rounded-lg bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm shadow-brand/20"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Ngirim...
                        </>
                    ) : (
                        'Kirim Link Reset'
                    )}
                </button>
            </form>
        </AuthShell>
    )
}