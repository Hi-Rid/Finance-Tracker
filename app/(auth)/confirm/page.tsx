'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthShell } from '@/components/auth/auth-shell'

function ConfirmInner() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type') || 'recovery'
    const next = searchParams.get('next') || '/reset-password'
    const errorParam = searchParams.get('error')

    const [verifying, setVerifying] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [checked, setChecked] = useState(false)

    // Validasi param — jangan auto-verify, tunggu user klik tombol
    useEffect(() => {
        if (errorParam) {
            setError('Link verifikasi tidak valid atau sudah kadaluarsa.')
            setChecked(true)
            return
        }
        if (!tokenHash) {
            setError('Link verifikasi tidak lengkap. Minta link baru.')
            setChecked(true)
            return
        }
        setChecked(true)
    }, [tokenHash, errorParam])

    async function handleVerify() {
        if (!tokenHash) return

        setVerifying(true)
        setError(null)

        const supabase = createClient()

        const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any,
        })

        if (verifyError) {
            console.error('[auth/confirm] verify failed:', verifyError)
            setError(
                'Link verifikasi tidak valid atau sudah kadaluarsa. Minta link baru.'
            )
            setVerifying(false)
            return
        }

        setSuccess(true)

        // Redirect ke next setelah 1 detik
        setTimeout(() => {
            router.push(next)
            router.refresh()
        }, 1000)
    }

    // ============================================================
    // LOADING
    // ============================================================
    if (!checked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-6 h-6 animate-spin text-brand" />
            </div>
        )
    }

    // ============================================================
    // ERROR STATE
    // ============================================================
    if (error && !verifying) {
        return (
            <AuthShell
                eyebrow="Link Bermasalah"
                title="Verifikasi Gagal"
                subtitle="Link verifikasi tidak valid atau sudah kadaluarsa."
                footer={
                    <Link
                        href="/forgot-password"
                        className="font-semibold text-brand hover:underline"
                    >
                        Minta link reset baru
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
    // SUCCESS STATE
    // ============================================================
    if (success) {
        return (
            <AuthShell
                eyebrow="Berhasil"
                title="Verifikasi Berhasil"
                subtitle="Mengarahkan Anda ke halaman reset password..."
            >
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-4 py-6 flex flex-col items-center gap-3 text-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                        Verifikasi berhasil!
                    </p>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                </div>
            </AuthShell>
        )
    }

    // ============================================================
    // CONFIRM STATE — user harus klik tombol manual
    // ============================================================
    return (
        <AuthShell
            eyebrow="Verifikasi"
            title="Konfirmasi Reset Password"
            subtitle="Klik tombol di bawah buat lanjut reset password akun Anda."
        >
            <div className="space-y-5">
                {/* Info box */}
                <div className="rounded-xl bg-brand/5 border border-brand/20 px-4 py-4 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                            Kenapa harus klik manual?
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                            Beberapa email client otomatis "klik" link buat scanning. Kami
                            minta Anda klik manual biar token resetnya tetap aman & valid.
                        </p>
                    </div>
                </div>

                {/* Confirm button */}
                <button
                    type="button"
                    onClick={handleVerify}
                    disabled={verifying}
                    className="w-full h-11 rounded-lg bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm shadow-brand/20"
                >
                    {verifying ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Memverifikasi...
                        </>
                    ) : (
                        <>
                            <ShieldCheck className="w-4 h-4" />
                            Konfirmasi Reset Password
                        </>
                    )}
                </button>

                {/* Cancel */}
                <Link
                    href="/login"
                    className="block w-full h-11 rounded-lg text-sm font-medium text-muted-foreground hover:text-slate-900 dark:hover:text-white transition-colors text-center leading-[44px]"
                >
                    Batal
                </Link>
            </div>
        </AuthShell>
    )
}

export default function ConfirmPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-brand" />
                </div>
            }
        >
            <ConfirmInner />
        </Suspense>
    )
}