'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Download,
    Trash2,
    ShieldCheck,
    CheckCircle2,
    AlertTriangle,
    Bot,
    Loader2,
    FileJson,
    KeyRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useSettingsPreferences } from '@/lib/hooks/use-settings-preferences'
import { createClient } from '@/lib/supabase/client'
import type { NotificationPreferences } from '@/lib/hooks/use-settings-preferences'

type Props = {
    consent: {
        consentedAt: string | null
        consentVersion: string | null
    }
    preferences: NotificationPreferences | null
    userEmail: string
}

export function DataSettingsClient({ consent, preferences, userEmail }: Props) {
    const router = useRouter()
    const { updatePreferences } = useSettingsPreferences()

    const [exporting, setExporting] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [aiToggleLoading, setAiToggleLoading] = useState(false)

    const aiEnabled = preferences?.ai_enabled ?? true

    // ============================================================
    // EXPORT
    // ============================================================
    async function handleExport() {
        setExporting(true)
        try {
            const res = await fetch('/api/account/export')
            if (!res.ok) {
                throw new Error('Gagal export data')
            }

            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `synmony-export-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            toast.success('File export berhasil diunduh')
        } catch (err: any) {
            console.error('[export] failed:', err)
            toast.error(err?.message || 'Gagal export data')
        } finally {
            setExporting(false)
        }
    }

    // ============================================================
    // AI TOGGLE
    // ============================================================
    async function handleAiToggle(value: boolean) {
        setAiToggleLoading(true)
        await updatePreferences({ ai_enabled: value })
        setAiToggleLoading(false)
    }

    // ============================================================
    // CONSENT STATUS
    // ============================================================
    const consentDate = consent.consentedAt
        ? new Date(consent.consentedAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'Asia/Jakarta',
        })
        : null

    const hasConsent = !!consent.consentedAt

    return (
        <div className="space-y-4 md:space-y-6">
            {/* ============================================================ */}
            {/* CARD: STATUS PERSETUJUAN                                        */}
            {/* ============================================================ */}
            <Card className="py-0 gap-0">
                <CardContent className="p-4 md:p-6">
                    <div className="flex items-start gap-3 md:gap-4">
                        <div
                            className={cn(
                                'w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0',
                                hasConsent
                                    ? 'bg-emerald-500/10'
                                    : 'bg-amber-500/10'
                            )}
                        >
                            {hasConsent ? (
                                <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                                <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-amber-600 dark:text-amber-400" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-sm md:text-base font-bold mb-1">
                                Persetujuan Data
                            </h3>
                            {hasConsent ? (
                                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                                    Anda telah menyetujui{' '}
                                    <a
                                        href="/terms"
                                        target="_blank"
                                        className="font-semibold text-brand hover:underline"
                                    >
                                        Syarat &amp; Ketentuan
                                    </a>{' '}
                                    dan{' '}
                                    <a
                                        href="/privacy"
                                        target="_blank"
                                        className="font-semibold text-brand hover:underline"
                                    >
                                        Kebijakan Privasi
                                    </a>{' '}
                                    pada <strong className="text-foreground">{consentDate}</strong>{' '}
                                    (versi {consent.consentVersion}).
                                </p>
                            ) : (
                                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                                    Anda belum menyetujui Kebijakan Privasi. Hubungi admin
                                    untuk bantuan.
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ============================================================ */}
            {/* CARD: AI TOGGLE                                                 */}
            {/* ============================================================ */}
            <Card className="py-0 gap-0">
                <CardContent className="p-4 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 md:gap-4 min-w-0 flex-1">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-brand/10 flex items-center justify-center shrink-0">
                                <Bot className="w-5 h-5 md:w-6 md:h-6 text-brand" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm md:text-base font-bold mb-1">
                                    Fitur AI
                                </h3>
                                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                                    Mengaktifkan AI Auto-Budgeting dan AI Financial Advisor.
                                    Data agregat (bukan detail transaksi) akan dikirim ke
                                    penyedia layanan AI untuk dianalisis. Nonaktifkan kalau
                                    Anda tidak ingin data dikirim ke pihak ketiga.
                                </p>
                            </div>
                        </div>
                        <div className="shrink-0 pt-1">
                            {aiToggleLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-brand" />
                            ) : (
                                <Switch
                                    checked={aiEnabled}
                                    onCheckedChange={handleAiToggle}
                                />
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ============================================================ */}
            {/* CARD: EXPORT DATA                                                */}
            {/* ============================================================ */}
            <Card className="py-0 gap-0">
                <CardContent className="p-4 md:p-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-3 md:gap-4 min-w-0 flex-1">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-brand/10 flex items-center justify-center shrink-0">
                                <FileJson className="w-5 h-5 md:w-6 md:h-6 text-brand" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm md:text-base font-bold mb-1">
                                    Ekspor Data
                                </h3>
                                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                                    Unduh seluruh data Anda dalam format JSON — transaksi,
                                    akun, kategori, anggaran, tujuan, investasi, wishlist,
                                    dan lain-lain.
                                </p>
                            </div>
                        </div>
                        <div className="shrink-0 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                onClick={handleExport}
                                disabled={exporting}
                                className="w-full sm:w-auto h-10 gap-2"
                            >
                                {exporting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4" />
                                )}
                                {exporting ? 'Menyiapkan...' : 'Unduh Data'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ============================================================ */}
            {/* CARD: HAPUS AKUN (DANGER ZONE)                                   */}
            {/* ============================================================ */}
            <Card className="py-0 gap-0 border-red-200 dark:border-red-500/30 bg-red-50/30 dark:bg-red-500/[0.02]">
                <CardContent className="p-4 md:p-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-3 md:gap-4 min-w-0 flex-1">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
                                <Trash2 className="w-5 h-5 md:w-6 md:h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm md:text-base font-bold text-red-700 dark:text-red-300 mb-1">
                                    Hapus Akun
                                </h3>
                                <p className="text-xs md:text-sm text-red-600/80 dark:text-red-400/80 leading-relaxed">
                                    Hapus akun beserta <strong>seluruh data</strong> secara
                                    permanen. Tindakan ini tidak dapat dibatalkan. Sebaiknya
                                    unduh dulu data Anda sebelum melanjutkan.
                                </p>
                            </div>
                        </div>
                        <div className="shrink-0 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteOpen(true)}
                                className="w-full sm:w-auto h-10 gap-2 text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-500/20 border-red-300 dark:border-red-500/40"
                            >
                                <Trash2 className="w-4 h-4" />
                                Hapus Akun
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Delete confirmation dialog */}
            <DeleteAccountDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                userEmail={userEmail}
            />
        </div>
    )
}

// ============================================================
// DELETE ACCOUNT DIALOG
// ============================================================

function DeleteAccountDialog({
    open,
    onOpenChange,
    userEmail,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    userEmail: string
}) {
    const router = useRouter()
    const [confirmText, setConfirmText] = useState('')
    const [pin, setPin] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const isConfirmValid = confirmText === 'HAPUS'
    const isPinValid = /^\d{6}$/.test(pin)
    const canSubmit = isConfirmValid && isPinValid && !submitting

    function handleClose() {
        if (submitting) return
        setConfirmText('')
        setPin('')
        setError(null)
        onOpenChange(false)
    }

    async function handleSubmit() {
        if (!canSubmit) return

        setSubmitting(true)
        setError(null)

        try {
            const res = await fetch('/api/account/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirm: confirmText, pin }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Gagal menghapus akun')
                setSubmitting(false)
                return
            }

            toast.success('Akun berhasil dihapus')

            // Sign out lokal & redirect
            const supabase = createClient()
            await supabase.auth.signOut().catch(() => { })
            router.push('/login')
            router.refresh()
        } catch (err: any) {
            setError(err?.message || 'Terjadi kesalahan')
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <Trash2 className="w-5 h-5" />
                        Hapus Akun Permanen
                    </DialogTitle>
                    <DialogDescription>
                        Tindakan ini tidak dapat dibatalkan. Semua data akan hilang
                        permanen.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 pt-2">
                    {/* Warning */}
                    <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-3.5 flex gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
                            <p className="font-bold mb-1">Yang akan dihapus:</p>
                            <ul className="list-disc pl-4 space-y-0.5">
                                <li>Akun login: <strong>{userEmail}</strong></li>
                                <li>Semua transaksi, akun, dan kategori</li>
                                <li>Semua goals, wishlist, utang, dan investasi</li>
                                <li>Semua foto profil dan gambar yang tersimpan</li>
                                <li>Seluruh pengaturan dan riwayat</li>
                            </ul>
                        </div>
                    </div>

                    {/* Confirm text */}
                    <div className="space-y-2">
                        <Label htmlFor="confirm-text" className="text-sm">
                            Ketik <code className="font-mono font-bold text-red-600 dark:text-red-400">HAPUS</code> untuk konfirmasi
                        </Label>
                        <Input
                            id="confirm-text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                            placeholder="HAPUS"
                            autoComplete="off"
                            disabled={submitting}
                            className={cn(
                                'font-mono',
                                isConfirmValid &&
                                'border-emerald-400 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20'
                            )}
                        />
                    </div>

                    {/* PIN */}
                    <div className="space-y-2">
                        <Label htmlFor="delete-pin" className="text-sm flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5" />
                            Masukkan PIN 6 digit
                        </Label>
                        <Input
                            id="delete-pin"
                            type="password"
                            inputMode="numeric"
                            maxLength={6}
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="••••••"
                            autoComplete="off"
                            disabled={submitting}
                            className={cn(
                                'text-center text-lg tracking-[0.5em] font-mono',
                                isPinValid &&
                                'border-emerald-400 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20'
                            )}
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-3.5 py-3 flex items-start gap-2.5">
                            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={submitting}
                            className="flex-1 h-11"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className={cn(
                                'flex-1 h-11 bg-red-500 hover:bg-red-600 text-white',
                                !canSubmit && 'opacity-50'
                            )}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Menghapus...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4" />
                                    Hapus Permanen
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}