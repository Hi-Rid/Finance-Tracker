'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, Check, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type ThemeOption = {
    value: 'light' | 'dark' | 'system'
    label: string
    description: string
    icon: any
}

const THEME_OPTIONS: ThemeOption[] = [
    {
        value: 'light',
        label: 'Terang',
        description: 'Selalu pakai tema terang',
        icon: Sun,
    },
    {
        value: 'dark',
        label: 'Gelap',
        description: 'Selalu pakai tema gelap',
        icon: Moon,
    },
    {
        value: 'system',
        label: 'Ikuti Sistem',
        description: 'Otomatis mengikuti preferensi perangkat',
        icon: Monitor,
    },
]

export function AppearanceSettingsClient() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-brand" />
            </div>
        )
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <Card className="py-0 gap-0">
                <CardContent className="p-4 md:p-6">
                    <div className="mb-5">
                        <h2 className="text-sm md:text-base font-bold mb-1">
                            Tema Tampilan
                        </h2>
                        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                            Pilih tema yang paling nyaman untuk mata Anda. Perubahan
                            langsung diterapkan.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {THEME_OPTIONS.map((opt) => {
                            const Icon = opt.icon
                            const isActive = theme === opt.value

                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setTheme(opt.value)}
                                    className={cn(
                                        'relative text-left rounded-xl border-2 p-4 transition-all cursor-pointer',
                                        'hover:border-brand/40',
                                        isActive
                                            ? 'border-brand bg-brand/5'
                                            : 'border-slate-200 dark:border-white/10 bg-card'
                                    )}
                                >
                                    {/* Check indicator */}
                                    <div
                                        className={cn(
                                            'absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                                            isActive
                                                ? 'bg-brand border-brand'
                                                : 'border-slate-300 dark:border-white/20'
                                        )}
                                    >
                                        {isActive && (
                                            <Check
                                                className="w-3 h-3 text-white"
                                                strokeWidth={3}
                                            />
                                        )}
                                    </div>

                                    {/* Preview mockup */}
                                    <div
                                        className={cn(
                                            'w-full aspect-[4/3] rounded-lg mb-3 border overflow-hidden',
                                            opt.value === 'light' &&
                                            'bg-gradient-to-br from-white to-slate-100 border-slate-200',
                                            opt.value === 'dark' &&
                                            'bg-gradient-to-br from-[#050F2E] to-[#0E2148] border-white/10',
                                            opt.value === 'system' &&
                                            'bg-gradient-to-br from-white via-slate-200 to-[#050F2E] border-slate-300'
                                        )}
                                    >
                                        <div className="p-2 space-y-1.5">
                                            <div
                                                className={cn(
                                                    'h-2 w-3/4 rounded',
                                                    opt.value === 'light'
                                                        ? 'bg-slate-300'
                                                        : opt.value === 'dark'
                                                            ? 'bg-white/20'
                                                            : 'bg-slate-400'
                                                )}
                                            />
                                            <div
                                                className={cn(
                                                    'h-2 w-1/2 rounded',
                                                    opt.value === 'light'
                                                        ? 'bg-slate-200'
                                                        : opt.value === 'dark'
                                                            ? 'bg-white/10'
                                                            : 'bg-slate-300'
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* Icon + Label */}
                                    <div className="flex items-center gap-2 mb-1">
                                        <Icon
                                            className={cn(
                                                'w-4 h-4',
                                                isActive ? 'text-brand' : 'text-muted-foreground'
                                            )}
                                        />
                                        <span
                                            className={cn(
                                                'text-sm font-bold',
                                                isActive && 'text-brand'
                                            )}
                                        >
                                            {opt.label}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-tight">
                                        {opt.description}
                                    </p>
                                </button>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Info tambahan */}
            <Card className="py-0 gap-0 border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                <CardContent className="p-4 md:p-5">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                            <Monitor className="w-4 h-4 text-brand" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold mb-0.5">
                                Tentang "Ikuti Sistem"
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Jika dipilih, Synmony akan otomatis menyesuaikan tema dengan
                                pengaturan perangkat atau browser Anda. Berguna jika Anda
                                memakai mode gelap otomatis di malam hari.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}