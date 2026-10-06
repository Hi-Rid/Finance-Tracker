'use client'

import { useState, useTransition } from 'react'
import {
    Snowflake,
    PiggyBank,
    Wallet,
    CalendarClock,
    HandCoins,
    Trophy,
    Newspaper,
    Moon,
    BellOff,
    Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSettingsPreferences } from '@/lib/hooks/use-settings-preferences'
import { cn } from '@/lib/utils'
import type { NotificationPreferences } from '@/lib/hooks/use-settings-preferences'

type Props = {
    preferences: NotificationPreferences | null
}

type PrefKey = keyof Omit<
    NotificationPreferences,
    'user_id' | 'quiet_hours_start' | 'quiet_hours_end'
>

const NOTIF_ITEMS: Array<{
    key: PrefKey
    icon: any
    title: string
    description: string
    accent: string
}> = [
        {
            key: 'cooling_off_done',
            icon: Snowflake,
            title: 'Cooling-off selesai',
            description: 'Saat wishlist selesai masa cooling-off 3 hari.',
            accent: '#0EA5E9',
        },
        {
            key: 'saving_ready',
            icon: PiggyBank,
            title: 'Tabungan siap',
            description: 'Saat tabungan wishlist mencapai target harga.',
            accent: '#10B981',
        },
        {
            key: 'budget_alert',
            icon: Wallet,
            title: 'Peringatan anggaran',
            description: 'Saat pengeluaran mencapai 80% atau 100% dari anggaran.',
            accent: '#F59E0B',
        },
        {
            key: 'bill_reminder',
            icon: CalendarClock,
            title: 'Pengingat tagihan',
            description: 'H-3 dan H-1 sebelum tagihan berulang jatuh tempo.',
            accent: '#8B5CF6',
        },
        {
            key: 'piutang_due',
            icon: HandCoins,
            title: 'Piutang jatuh tempo',
            description: 'Saat piutang yang Anda berikan mendekati jatuh tempo.',
            accent: '#EF4444',
        },
        {
            key: 'milestone_achieved',
            icon: Trophy,
            title: 'Pencapaian FI',
            description: 'Saat Anda mencapai milestone Financial Freedom baru.',
            accent: '#F59E0B',
        },
        {
            key: 'weekly_review',
            icon: Newspaper,
            title: 'Ringkasan mingguan',
            description: 'Rangkuman keuangan mingguan setiap Senin pagi.',
            accent: '#334DAF',
        },
    ]

export function NotificationsSettingsClient({ preferences }: Props) {
    const { togglePreference, updatePreferences } = useSettingsPreferences()
    const [pendingKey, setPendingKey] = useState<PrefKey | null>(null)
    const [quietHoursSaving, setQuietHoursSaving] = useState(false)
    const [, startTransition] = useTransition()

    const prefs = preferences || {
        cooling_off_done: true,
        saving_ready: true,
        budget_alert: true,
        bill_reminder: true,
        piutang_due: true,
        milestone_achieved: true,
        weekly_review: true,
        ai_enabled: true,
        quiet_hours_enabled: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '07:00',
    } as NotificationPreferences

    const [quietStart, setQuietStart] = useState(
        prefs.quiet_hours_start?.slice(0, 5) || '22:00'
    )
    const [quietEnd, setQuietEnd] = useState(
        prefs.quiet_hours_end?.slice(0, 5) || '07:00'
    )

    async function handleToggle(key: PrefKey, value: boolean) {
        setPendingKey(key)
        await togglePreference(key, value)
        setPendingKey(null)
    }

    async function handleQuietHoursToggle(value: boolean) {
        startTransition(async () => {
            await togglePreference('quiet_hours_enabled', value)
        })
    }

    async function handleSaveQuietHours() {
        setQuietHoursSaving(true)
        await updatePreferences({
            quiet_hours_start: quietStart,
            quiet_hours_end: quietEnd,
        })
        setQuietHoursSaving(false)
    }

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Info card */}
            <Card className="py-0 gap-0 border-brand/20 bg-brand/[0.02]">
                <CardContent className="p-4 md:p-5">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                            <BellOff className="w-4 h-4 md:w-5 md:h-5 text-brand" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-bold mb-0.5">
                                Kontrol Notifikasi
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Pilih jenis notifikasi yang ingin Anda terima. Notifikasi
                                selalu muncul di dalam aplikasi (ikon lonceng).
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Notification types */}
            <Card className="py-0 gap-0 overflow-hidden">
                <div className="px-4 md:px-6 py-3.5 border-b border-slate-100 dark:border-white/5">
                    <h3 className="text-sm md:text-base font-bold">
                        Jenis Notifikasi
                    </h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {NOTIF_ITEMS.map((item) => {
                        const Icon = item.icon
                        const value = prefs[item.key] as boolean
                        const isPending = pendingKey === item.key

                        return (
                            <div
                                key={item.key}
                                className="px-4 md:px-6 py-3.5 md:py-4 flex items-start gap-3 md:gap-4"
                            >
                                <div
                                    className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                                    style={{ backgroundColor: `${item.accent}15` }}
                                >
                                    <Icon
                                        className="w-4 h-4 md:w-5 md:h-5"
                                        style={{ color: item.accent }}
                                        strokeWidth={2.2}
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold leading-tight">
                                        {item.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                                        {item.description}
                                    </p>
                                </div>
                                <div className="shrink-0 pt-0.5">
                                    {isPending ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-brand" />
                                    ) : (
                                        <Switch
                                            checked={value}
                                            onCheckedChange={(v) => handleToggle(item.key, v)}
                                        />
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Card>

            {/* Quiet hours */}
            <Card className="py-0 gap-0 overflow-hidden">
                <div className="px-4 md:px-6 py-3.5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0">
                            <Moon className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 dark:text-indigo-400" strokeWidth={2.2} />
                        </div>
                        <div>
                            <h3 className="text-sm md:text-base font-bold">
                                Jam Tenang
                            </h3>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                Tidak ada notifikasi di jam ini
                            </p>
                        </div>
                    </div>
                    <Switch
                        checked={prefs.quiet_hours_enabled}
                        onCheckedChange={handleQuietHoursToggle}
                    />
                </div>

                {prefs.quiet_hours_enabled && (
                    <div className="p-4 md:p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="quiet-start" className="text-xs">
                                    Mulai
                                </Label>
                                <Input
                                    id="quiet-start"
                                    type="time"
                                    value={quietStart}
                                    onChange={(e) => setQuietStart(e.target.value)}
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="quiet-end" className="text-xs">
                                    Selesai
                                </Label>
                                <Input
                                    id="quiet-end"
                                    type="time"
                                    value={quietEnd}
                                    onChange={(e) => setQuietEnd(e.target.value)}
                                    className="h-11"
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleSaveQuietHours}
                            disabled={
                                quietHoursSaving ||
                                (quietStart ===
                                    prefs.quiet_hours_start?.slice(0, 5) &&
                                    quietEnd === prefs.quiet_hours_end?.slice(0, 5))
                            }
                            className={cn(
                                'w-full h-10 rounded-lg text-sm font-semibold transition-all',
                                'bg-brand hover:bg-brand-hover text-white',
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                                'flex items-center justify-center gap-2'
                            )}
                        >
                            {quietHoursSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                'Simpan Jam Tenang'
                            )}
                        </button>
                    </div>
                )}
            </Card>

            {/* Info bawah */}
            <p className="text-[11px] text-muted-foreground/70 leading-relaxed px-1">
                Notifikasi push (ke HP) akan tersedia setelah aplikasi dipasang ke
                layar utama (Add to Home Screen).
            </p>
        </div>
    )
}