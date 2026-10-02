'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Loader2, CheckCircle2, RefreshCw, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { AuthShell } from '@/components/auth/auth-shell'

function VerifyEmailInner() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get('email') || ''

    const [resending, setResending] = useState(false)
    const [resent, setResent] = useState(false)
    const [cooldown, setCooldown] = useState(0)

    // Cooldown timer (60 detik)
    useEffect(() => {
        if (cooldown <= 0) return
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
        return () => clearTimeout(t)
    }, [cooldown])

    async function handleResend() {
        if (!email) {
            toast.error('Email gak ada. Balik ke register.')
            return
        }
        if (cooldown > 0) return

        setResending(true)
        const supabase = createClient()
        const origin = window.location.origin

        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
            options: {
                emailRedirectTo: `${origin}/auth/callback`,
            },
        })

        setResending(false)

        if (error) {
            console.error('[verify-email] resend failed:', error)
            const msg = error.message || ''
            if (msg.toLowerCase().includes('rate') || msg.toLowerCase().includes('limit')) {
                toast.error('Terlalu sering. Coba lagi beberapa menit.')
                setCooldown(60)
                return
            }
            toast.error(msg || 'Gagal kirim ulang email')
            return
        }

        setResent(true)
        setCooldown(60)
        toast.success('Email verifikasi baru udah dikirim')
    }

    async function handleChangeEmail() {
        // Logout (kalau ada session parsial)
        const supabase = createClient()
        await supabase.auth.signOut().catch(() => { })
        router.push('/register')
    }

    return (
        <AuthShell
            eyebrow="Satu Langkah Lagi"
            title="Cek Email Lu"
            subtitle="Kami udah kirim link verifikasi. Klik link di email buat aktifin akun."
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
                {/* Icon + email display */}
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-5 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-3.5">
                        <Mail className="w-7 h-7 text-brand" />
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
                        Email Verifikasi Dikirim Ke
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white break-all">
                        {email || '(email gak diketahui)'}
                    </p>
                </div>

                {/* Info box */}
                <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-4 py-3.5 flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-white text-[10px] font-bold">!</span>
                    </div>
                    <div className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed space-y-1">
                        <p className="font-bold">Gak nemu emailnya?</p>
                        <ul className="space-y-0.5 text-amber-700 dark:text-amber-300">
                            <li>• Cek folder <strong>Spam</strong> atau <strong>Promotions</strong></li>
                            <li>• Tunggu 1-2 menit, kadang delay</li>
                            <li>• Pastiin emailnya bener</li>
                        </ul>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending || cooldown > 0 || resent && cooldown > 0}
                        className="w-full h-11 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 dark:text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    >
                        {resending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Kirim ulang...
                            </>
                        ) : cooldown > 0 ? (
                            <>
                                <RefreshCw className="w-4 h-4 opacity-50" />
                                Kirim ulang dalam {cooldown}s
                            </>
                        ) : resent ? (
                            <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                Terkirim! Kirim lagi
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4" />
                                Kirim ulang email
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={handleChangeEmail}
                        className="w-full h-11 rounded-lg text-sm font-medium text-muted-foreground hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        Salah email? Daftar ulang
                    </button>
                </div>

                {/* Bottom hint */}
                <p className="text-[11px] text-center text-muted-foreground/70 leading-relaxed">
                    Setelah klik link di email, akun lu bakal aktif dan siap dipakai.
                </p>
            </div>
        </AuthShell>
    )
}

export default function VerifyEmailPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-brand" />
                </div>
            }
        >
            <VerifyEmailInner />
        </Suspense>
    )
}