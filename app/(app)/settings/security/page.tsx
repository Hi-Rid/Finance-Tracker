'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
    Shield,
    Lock,
    KeyRound,
    Loader2,
    Info,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { lockSession, isSessionUnlocked } from '@/lib/hooks/use-pin'
import { useTrackedAction } from '@/lib/hooks/use-tracked-action'
import { cn } from '@/lib/utils'

export default function SecuritySettingsPage() {
    const router = useRouter()
    const track = useTrackedAction()
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

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Info card */}
            <Card className="py-0 gap-0 border-brand/20 bg-brand/[0.02]">
                <CardContent className="p-4 md:p-5">
                    <div className="flex items-start gap-3 md:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-brand/10 flex items-center justify-center shrink-0">
                            <Shield className="w-5 h-5 md:w-6 md:h-6 text-brand" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-sm md:text-base font-bold mb-1">
                                Keamanan Akun
                            </h3>
                            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                                Keamanan utama akun Anda dipegang oleh{' '}
                                <strong>Supabase Auth</strong> + <strong>Row Level Security</strong>.
                                PIN di Synmony hanya untuk mengunci tampilan di perangkat ini.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* PIN status */}
            <Card className="py-0 gap-0">
                <CardContent className="p-4 md:p-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
                        <div className="flex items-start gap-3 md:gap-4 min-w-0 flex-1">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                                <KeyRound className="w-5 h-5 md:w-6 md:h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm md:text-base font-bold mb-1">
                                    PIN Unlock
                                </h3>
                                <div className="flex items-center gap-2">
                                    {hasPin === null ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                                    ) : hasPin ? (
                                        <>
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                Aktif
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                                                Belum di-set
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/setup-pin')}
                            className="flex-1 h-10 gap-2"
                            disabled={hasPin === null}
                        >
                            <KeyRound className="w-4 h-4" />
                            {hasPin ? 'Ganti PIN' : 'Set PIN'}
                        </Button>
                        {isSessionUnlocked() && hasPin && (
                            <Button
                                variant="outline"
                                onClick={handleLock}
                                className="flex-1 h-10 gap-2"
                            >
                                <Lock className="w-4 h-4" />
                                Kunci Sekarang
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Info tambahan */}
            <Card className="py-0 gap-0 border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                <CardContent className="p-4 md:p-5">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                            <Info className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold mb-0.5">
                                Tentang PIN
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                PIN disimpan sebagai hash SHA-256 di server — server tidak
                                dapat membaca PIN asli Anda. PIN hanya untuk mencegah orang
                                lain membuka aplikasi di perangkat ini. Untuk keamanan
                                akun, gunakan password email yang kuat.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}