'use client'

import { useState } from 'react'
import {
    Mail,
    KeyRound,
    LogOut,
    Loader2,
    Calendar,
    Clock,
    ShieldCheck,
    Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useTrackedAction } from '@/lib/hooks/use-tracked-action'
import { lockSession } from '@/lib/hooks/use-pin'
import { useRouter } from 'next/navigation'

type Props = {
    email: string
    userId: string
    createdAt: string
    lastSignInAt: string | null
}

export function AccountsAuthSettingsClient({
    email,
    userId,
    createdAt,
    lastSignInAt,
}: Props) {
    const router = useRouter()
    const supabase = createClient()
    const track = useTrackedAction()
    const [resetLoading, setResetLoading] = useState(false)

    const createdDate = new Date(createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
    })

    const lastSignInDate = lastSignInAt
        ? new Date(lastSignInAt).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Jakarta',
        })
        : null

    // ============================================================
    // KIRIM LINK RESET PASSWORD
    // ============================================================
    async function handleResetPassword() {
        setResetLoading(true)

        const origin = typeof window !== 'undefined' ? window.location.origin : ''

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${origin}/auth/callback?next=/reset-password`,
        })

        setResetLoading(false)

        if (error) {
            console.error('[reset-password] failed:', error)
            toast.error(error.message || 'Gagal mengirim link reset')
            return
        }

        toast.success('Link reset password terkirim ke email Anda', {
            description: 'Cek inbox atau folder spam.',
            duration: 6000,
        })
    }

    // ============================================================
    // LOGOUT DARI SEMUA SESI
    // ============================================================
    async function handleLogoutAll() {
        await track(async () => {
            const { error } = await supabase.auth.signOut({ scope: 'global' })

            if (error) {
                console.error('[logout-all] failed:', error)
                toast.error(error.message || 'Gagal logout dari semua sesi')
                return { success: false }
            }

            lockSession()
            toast.success('Berhasil logout dari semua sesi')
            router.push('/login')
            router.refresh()
            return { success: true }
        }, 'Logout dari semua sesi...')
    }

    // ============================================================
    // LOGOUT DARI PERANGKAT INI
    // ============================================================
    async function handleLogoutThis() {
        await track(async () => {
            await supabase.auth.signOut({ scope: 'local' })
            lockSession()
            toast.success('Berhasil logout')
            router.push('/login')
            router.refresh()
            return { success: true }
        }, 'Logout...')
    }

    return (
        <div className="space-y-4 md:space-y-6">
            {/* ============================================================ */}
            {/* CARD: INFO AKUN                                                */}
            {/* ============================================================ */}
            <Card className="py-0 gap-0">
                <CardContent className="p-4 md:p-6">
                    <div className="flex items-start gap-3 md:gap-4 mb-5">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-brand/10 flex items-center justify-center shrink-0">
                            <Mail className="w-5 h-5 md:w-6 md:h-6 text-brand" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-sm md:text-base font-bold mb-0.5">
                                Akun Login
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Informasi akun autentikasi Anda
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3 md:space-y-4">
                        {/* Email */}
                        <div className="rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-3.5 md:p-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                                Email
                            </p>
                            <p className="text-sm font-semibold break-all">{email}</p>
                            <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                                Email tidak dapat diubah. Hubungi support jika perlu.
                            </p>
                        </div>

                        {/* Meta info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="rounded-xl border border-slate-200 dark:border-white/10 p-3.5">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        Bergabung
                                    </p>
                                </div>
                                <p className="text-sm font-semibold">{createdDate}</p>
                            </div>

                            {lastSignInDate && (
                                <div className="rounded-xl border border-slate-200 dark:border-white/10 p-3.5">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                            Login Terakhir
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold">{lastSignInDate}</p>
                                </div>
                            )}
                        </div>

                        {/* User ID (untuk support) */}
                        <div className="rounded-xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-3.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                                User ID (untuk bantuan)
                            </p>
                            <p className="text-xs font-mono text-muted-foreground break-all">
                                {userId}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ============================================================ */}
            {/* CARD: GANTI PASSWORD                                           */}
            {/* ============================================================ */}
            <Card className="py-0 gap-0">
                <CardContent className="p-4 md:p-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-3 md:gap-4 min-w-0 flex-1">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                                <KeyRound className="w-5 h-5 md:w-6 md:h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm md:text-base font-bold mb-1">
                                    Ganti Password
                                </h3>
                                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                                    Kami akan mengirim link reset ke email Anda. Klik link
                                    tersebut untuk membuat password baru.
                                </p>
                            </div>
                        </div>
                        <div className="shrink-0 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                onClick={handleResetPassword}
                                disabled={resetLoading}
                                className="w-full sm:w-auto h-10 gap-2"
                            >
                                {resetLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Mail className="w-4 h-4" />
                                )}
                                {resetLoading ? 'Mengirim...' : 'Kirim Link Reset'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ============================================================ */}
            {/* CARD: SESI AKTIF                                                */}
            {/* ============================================================ */}
            <Card className="py-0 gap-0">
                <CardContent className="p-4 md:p-6">
                    <div className="flex items-start gap-3 md:gap-4 mb-5">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-sm md:text-base font-bold mb-0.5">
                                Sesi Aktif
                            </h2>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Kelola sesi login Anda di berbagai perangkat
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Button
                            variant="outline"
                            onClick={handleLogoutAll}
                            className="w-full justify-start h-11 gap-2.5"
                        >
                            <LogOut className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span className="text-sm font-medium">
                                Logout dari semua perangkat
                            </span>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleLogoutThis}
                            className="w-full justify-start h-11 gap-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 border-red-200 dark:border-red-500/30"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                Logout dari perangkat ini
                            </span>
                        </Button>
                    </div>

                    {/* Info */}
                    <div className="mt-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-3.5 flex items-start gap-2.5">
                        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            <strong className="text-foreground">Tips:</strong> Kalau Anda
                            merasa akun diakses orang lain, segera ganti password dan
                            logout dari semua perangkat.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}