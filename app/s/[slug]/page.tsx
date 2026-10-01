import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDateLongWIB, formatTimeWIB } from '@/lib/utils/datetime'
import {
    Receipt,
    Users,
    CheckCircle2,
    Clock,
    ArrowRight,
    Crown,
    AlertTriangle,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { SynmonyMark } from '@/components/brand/synmony-logo'

type PageProps = {
    params: Promise<{ slug: string }>
}

async function fetchSharedEvent(slug: string): Promise<any | null> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase.rpc('get_shared_event' as any, {
            p_slug: slug,
        })
        if (error) {
            console.error('[share] RPC error:', error)
            return null
        }
        return data
    } catch (err) {
        console.error('[share] fetch exception:', err)
        return null
    }
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    try {
        const { slug } = await params
        const result = await fetchSharedEvent(slug)

        if (!result || result.error || !result.event) {
            return {
                title: 'Split Bill - Synmony',
                description: 'Link split bill udah expired atau gak valid.',
            }
        }

        const event = result.event
        const grandTotal = Number(event.grand_total) || 0
        const formatted = `Rp ${grandTotal.toLocaleString('id-ID')}`

        const title = `${event.name || 'Split Bill'} — ${formatted}`
        const description = `Split bill untuk ${(result.participants || []).length
            } orang. Total ${formatted}. Lihat detail lengkap di Synmony.`

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                type: 'website',
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
            },
        }
    } catch (err) {
        console.error('[share] metadata exception:', err)
        return {
            title: 'Split Bill - Synmony',
        }
    }
}

export default async function SharedEventPage({ params }: PageProps) {
    const { slug } = await params
    const result = await fetchSharedEvent(slug)

    if (!result || typeof result !== 'object') {
        return <ErrorScreen type="not_found" />
    }

    if (result.error === 'not_found') {
        return <ErrorScreen type="not_found" />
    }

    if (result.error === 'expired') {
        return <ErrorScreen type="expired" />
    }

    if (!result.event) {
        return <ErrorScreen type="not_found" />
    }

    const event = result.event
    const participants = Array.isArray(result.participants)
        ? result.participants
        : []
    const items = Array.isArray(result.items) ? result.items : []
    const itemShares = Array.isArray(result.item_shares)
        ? result.item_shares
        : []

    const grandTotal = Number(event.grand_total) || 0
    const expiresAt = event.share_expires_at
        ? new Date(event.share_expires_at)
        : null

    const totalPaid = participants.filter((p: any) => p.paid).length
    const allSettled =
        participants.length > 0 && totalPaid === participants.length

    const daysLeft = expiresAt
        ? Math.max(
            0,
            Math.ceil(
                (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
        )
        : 0

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-[#050F2E] dark:to-[#0A1A40]">
            {/* Header */}
            <header className="sticky top-0 z-10 backdrop-blur-xl bg-background/70 border-b border-border/60">
                <div className="max-w-2xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5">
                        <SynmonyMark size="md" showDot className="w-8 h-8" />
                        <span className="text-sm font-bold tracking-tight">
                            Synmony
                        </span>
                    </Link>
                    <div className="flex items-center gap-1">
                        <ThemeToggle />
                        <Link
                            href="/"
                            className="text-xs font-semibold text-brand hover:underline px-2"
                        >
                            Coba Gratis
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-10">
                {expiresAt && (
                    <div className="mb-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-3 flex items-start gap-2.5">
                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-xs md:text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                            <strong>Link aktif {daysLeft} hari lagi.</strong>{' '}
                            Setelah{' '}
                            {expiresAt.toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                timeZone: 'Asia/Jakarta',
                            })}
                            , link ini bakal otomatis kehapus.
                        </div>
                    </div>
                )}

                {/* Hero */}
                <div className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-card overflow-hidden shadow-sm">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500" />
                    <div className="p-5 md:p-6 pl-6">
                        <div className="flex items-start gap-3 mb-4">
                            <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${allSettled
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                                    }`}
                            >
                                {allSettled ? (
                                    <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                    <Clock className="w-5 h-5" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                                    {event.name}
                                </h1>
                                <div className="flex items-center gap-2 mt-1 text-xs md:text-sm text-muted-foreground flex-wrap">
                                    <span>{formatDateLongWIB(event.date)}</span>
                                    <span>·</span>
                                    <span>{formatTimeWIB(event.date)}</span>
                                </div>
                            </div>
                            <span
                                className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold ${allSettled
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                    }`}
                            >
                                {allSettled
                                    ? 'Settled'
                                    : `${participants.length - totalPaid} belum`}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                                    Grand Total
                                </p>
                                <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                                    Rp {grandTotal.toLocaleString('id-ID')}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                                    Jumlah Peserta
                                </p>
                                <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                                    {participants.length}{' '}
                                    <span className="text-sm font-medium text-muted-foreground">
                                        orang
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Breakdown per orang */}
                {participants.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-card overflow-hidden shadow-sm">
                        <div className="px-5 py-3 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-400" />
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Breakdown Per Orang
                            </p>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                            {participants.map((p: any) => (
                                <div
                                    key={p.id}
                                    className="px-5 py-3.5 flex items-center gap-3"
                                >
                                    <div
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-[11px] font-bold ${p.is_user
                                            ? 'bg-brand/15 text-brand'
                                            : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                                            }`}
                                    >
                                        {(p.display_name || 'XX')
                                            .split(' ')
                                            .map((s: string) => s[0])
                                            .slice(0, 2)
                                            .join('')
                                            .toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold truncate">
                                            {p.display_name}
                                            {p.is_user && (
                                                <span className="ml-1.5 text-[10px] font-bold text-brand">
                                                    (Bikin)
                                                </span>
                                            )}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {p.paid ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Lunas
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                                    <Clock className="w-3 h-3" />
                                                    Belum
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-base md:text-lg font-bold tabular-nums text-slate-900 dark:text-white shrink-0">
                                        Rp{' '}
                                        {Number(
                                            p.total_share || 0
                                        ).toLocaleString('id-ID')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Detail Item */}
                {items.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-card overflow-hidden shadow-sm">
                        <div className="px-5 py-3 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-slate-400" />
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    Detail Item
                                </p>
                            </div>
                            <span className="text-xs md:text-sm font-bold tabular-nums text-slate-700 dark:text-slate-300">
                                Rp{' '}
                                {Number(event.subtotal || 0).toLocaleString(
                                    'id-ID'
                                )}
                            </span>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                            {items.map((item: any, idx: number) => (
                                <div
                                    key={item.id}
                                    className="px-5 py-2.5 md:py-3 flex items-center gap-3"
                                >
                                    <span className="w-5 text-[10px] font-bold tabular-nums text-slate-400 shrink-0">
                                        {String(idx + 1).padStart(2, '0')}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs md:text-sm font-medium truncate">
                                            {item.name}
                                        </p>
                                        <p className="text-[10px] md:text-[11px] text-muted-foreground tabular-nums mt-0.5">
                                            {item.quantity} × Rp{' '}
                                            {Number(
                                                item.unit_price || 0
                                            ).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    <span className="text-xs md:text-sm font-semibold tabular-nums text-slate-900 dark:text-white shrink-0">
                                        Rp{' '}
                                        {Number(item.subtotal || 0).toLocaleString(
                                            'id-ID'
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* CTA */}
                <div className="mt-4 rounded-2xl bg-gradient-to-br from-brand/5 to-brand/[0.02] border border-brand/20 p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-brand/15 flex items-center justify-center shrink-0">
                        <Crown className="w-5 h-5 text-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold mb-0.5">
                            Mau catat split bill sendiri?
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Synmony bantu tracking keuangan, budget, & split
                            bill otomatis.
                        </p>
                    </div>
                    <Link
                        href="/"
                        className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors"
                    >
                        Coba
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                <p className="mt-6 text-center text-[11px] text-muted-foreground">
                    Dibuat dengan{' '}
                    <span className="font-semibold text-brand">Synmony</span> —
                    Your Second Brain for Your Money
                </p>
            </main>
        </div>
    )
}

function ErrorScreen({ type }: { type: 'not_found' | 'expired' }) {
    const config =
        type === 'expired'
            ? {
                icon: AlertTriangle,
                title: 'Link Udah Expired',
                desc: 'Link share ini udah lewat masa aktif 5 hari. Minta yang bikin split bill buat share ulang ya.',
                color: 'amber',
            }
            : {
                icon: Receipt,
                title: 'Link Gak Ditemukan',
                desc: 'Link ini gak valid atau udah dihapus. Cek ulang URL-nya ya.',
                color: 'slate',
            }

    const Icon = config.icon

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-slate-50 to-white dark:from-[#050F2E] dark:to-[#0A1A40]">
            <div className="max-w-md w-full text-center">
                <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${config.color === 'amber'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        : 'bg-slate-500/15 text-slate-600 dark:text-slate-400'
                        }`}
                >
                    <Icon className="w-7 h-7" />
                </div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight mb-2">
                    {config.title}
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {config.desc}
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors"
                >
                    <Crown className="w-4 h-4" />
                    Ke Synmony
                </Link>
            </div>
        </div>
    )
}