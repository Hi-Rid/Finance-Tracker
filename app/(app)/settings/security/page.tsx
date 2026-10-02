'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
    Shield,
    Lock,
    KeyRound,
    LogOut,
    Loader2,
    Info,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { lockSession, isSessionUnlocked } from '@/lib/hooks/use-pin'

export default function SecuritySettingsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [hasPin, setHasPin] = useState<boolean | null>(null)

    useEffect(() => {
        async function checkPin() {
            const supabase = createClient()
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('user_settings')
                .select('pin_hash')
                .eq('user_id', user.id)
                .maybeSingle()

            setHasPin(!!data?.pin_hash)
        }
        checkPin()
    }, [])

    function handleLock() {
        lockSession()
        toast.success('Sesi dikunci. Masuk lagi dengan PIN.')
        router.push('/unlock')
    }

    async function handleLogout() {
        setLoading(true)
        const supabase = createClient()
        await supabase.auth.signOut()
        lockSession()
        toast.success('Berhasil logout')
        router.push('/login')
        router.refresh()
    }

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Info card */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-4 md:p-6">
                <div className="flex items-start gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-brand/10 flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5 md:w-6 md:h-6 text-brand" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-sm md:text-base font-bold mb-1">
                            Keamanan Akun
                        </h2>
                        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                            Keamanan utama akun lu dipegang oleh{' '}
                            <strong>Supabase Auth</strong> + <strong>RLS</strong>.
                            PIN di Synmony cuma buat kunci tampilan di perangkat ini,
                            biar orang lain gak gampang liat saldo lu.
                        </p>
                    </div>
                </div>
            </div>

            {/* PIN status */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-4 md:p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                            <KeyRound className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-sm md:text-base font-bold">
                                PIN Unlock
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {hasPin === null
                                    ? 'Cek...'
                                    : hasPin
                                        ? 'Sudah aktif'
                                        : 'Belum di-set'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/setup-pin')}
                        className="flex-1 h-10"
                    >
                        <KeyRound className="w-4 h-4" />
                        {hasPin ? 'Ganti PIN' : 'Set PIN'}
                    </Button>
                    {isSessionUnlocked() && hasPin && (
                        <Button
                            variant="outline"
                            onClick={handleLock}
                            className="flex-1 h-10"
                        >
                            <Lock className="w-4 h-4" />
                            Kunci Sekarang
                        </Button>
                    )}
                </div>
            </div>

            {/* Info tambahan */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4 flex gap-3">
                <Info className="w-4 h-4 md:w-5 md:h-5 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    PIN disimpan sebagai hash SHA-256 di server. Buat keamanan
                    maksimal, pakai password yang kuat di akun email lu.
                </p>
            </div>

            {/* Logout */}
            <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/[0.02] p-4 md:p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm md:text-base font-bold text-red-700 dark:text-red-300 mb-1">
                            Logout dari Akun
                        </h3>
                        <p className="text-xs md:text-sm text-red-600/80 dark:text-red-400/80 leading-relaxed">
                            Keluar dari sesi ini. Lu harus login lagi buat masuk.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleLogout}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-500/20 border-red-300 dark:border-red-500/40 shrink-0"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <LogOut className="w-4 h-4" />
                        )}
                        Logout
                    </Button>
                </div>
            </div>
        </div>
    )
}