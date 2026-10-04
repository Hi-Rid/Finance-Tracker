import Link from 'next/link'
import {
    Crown,
    Sparkles,
    Wallet,
    TrendingUp,
    Target,
    ShieldCheck,
    Zap,
    Award,
} from 'lucide-react'
import { SynmonyMark } from '@/components/brand/synmony-logo'

type AuthShellProps = {
    children: React.ReactNode
    eyebrow?: string
    title: string
    subtitle: string
    footer?: React.ReactNode
}

const FEATURES = [
    { icon: Crown, label: 'Financial Freedom', accent: '#F59E0B' },
    { icon: Wallet, label: 'Semua Akun Nyambung', accent: '#10B981' },
    { icon: TrendingUp, label: 'Portfolio Auto-Update', accent: '#8B5CF6' },
    { icon: Target, label: 'Budget yang Jalan', accent: '#0EA5E9' },
]

const TRUST = [
    { icon: ShieldCheck, label: 'Data Terenkripsi' },
    { icon: Zap, label: 'Cepat & Ringan' },
    { icon: Award, label: 'Gratis 100%' },
]

export function AuthShell({
    children,
    eyebrow,
    title,
    subtitle,
    footer,
}: AuthShellProps) {
    return (
        <div className="min-h-screen bg-background flex">
            {/* ============================================ */}
            {/* LEFT — BRAND PANEL (60%)                      */}
            {/* ============================================ */}
            <aside className="hidden lg:flex lg:w-[60%] relative overflow-hidden text-white bg-[#02050F]">
                {/* Base gradient */}
                <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-br from-[#010308] via-[#030918] to-[#050F2E]"
                />

                {/* Grid pattern */}
                <div
                    aria-hidden
                    className="absolute inset-0 opacity-[0.025]"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(168,197,232,0.6) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(168,197,232,0.6) 1px, transparent 1px)
                        `,
                        backgroundSize: '56px 56px',
                    }}
                />

                {/* Ambient blobs */}
                <div
                    aria-hidden
                    className="absolute -top-40 -right-32 w-[560px] h-[560px] rounded-full bg-[#334DAF]/20 blur-[130px] pointer-events-none"
                />
                <div
                    aria-hidden
                    className="absolute -bottom-40 -left-32 w-[560px] h-[560px] rounded-full bg-[#7096D1]/12 blur-[130px] pointer-events-none"
                />
                <div
                    aria-hidden
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-amber-500/[0.04] blur-[120px] pointer-events-none"
                />

                {/* Top edge glow */}
                <div
                    aria-hidden
                    className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#A8C5E8]/15 to-transparent"
                />

                {/* ============================================ */}
                {/* Content — CENTER di panel                     */}
                {/* ============================================ */}
                <div className="relative z-10 w-full h-full flex items-center justify-center px-10 xl:px-20 py-12">
                    <div className="w-full max-w-[580px] flex flex-col">
                        {/* ============================================ */}
                        {/* Logo                                          */}
                        {/* ============================================ */}
                        <div className="mb-12">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-3 group"
                            >
                                <SynmonyMark
                                    size="md"
                                    className="w-10 h-10 transition-transform duration-300 group-hover:scale-105"
                                />
                                <div>
                                    <div className="text-lg font-bold tracking-tight leading-none">
                                        Synmony
                                    </div>
                                    <div className="text-[9.5px] uppercase tracking-[0.22em] text-[#D0E4FE] mt-2 font-semibold">
                                        Second Brain for Your Money
                                    </div>
                                </div>
                            </Link>
                        </div>

                        {/* ============================================ */}
                        {/* Eyebrow                                       */}
                        {/* ============================================ */}
                        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-amber-500/[0.12] to-amber-500/[0.04] border border-amber-500/25 text-amber-200 text-[10px] font-bold uppercase tracking-[0.16em] mb-7 backdrop-blur-sm w-fit">
                            <Sparkles className="w-3 h-3" />
                            Financial Freedom OS
                        </div>

                        {/* ============================================ */}
                        {/* Headline                                      */}
                        {/* ============================================ */}
                        <h2 className="text-[38px] xl:text-[44px] font-bold tracking-[-0.028em] leading-[1.08] mb-6">
                            <span className="text-white">Bukan cuma catat uang.</span>
                            <br />
                            <span className="text-white">Kami bantu lu bebas</span>{' '}
                            <span className="text-amber-400">finansial.</span>
                        </h2>

                        <p className="text-[15px] text-[#C8DCF0] leading-relaxed mb-10 max-w-[500px]">
                            Semua tentang uang lu dalam satu sistem. Transaksi,
                            budget, aset, investasi, dan tujuan — terhubung dalam
                            harmoni.
                        </p>

                        {/* ============================================ */}
                        {/* Mockup                                        */}
                        {/* ============================================ */}
                        <div className="relative mb-10">
                            <div
                                aria-hidden
                                className="absolute inset-0 bg-gradient-to-br from-[#334DAF]/25 via-[#7096D1]/12 to-transparent rounded-2xl blur-xl"
                            />

                            <div className="relative rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl border border-white/[0.1] p-5 shadow-2xl">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="text-[9px] uppercase tracking-[0.18em] text-[#D0E4FE] font-semibold mb-1.5">
                                            Net Worth
                                        </p>
                                        <p className="text-2xl font-bold text-white tracking-tight tabular-nums">
                                            Rp 245.000.000
                                        </p>
                                    </div>
                                    <div className="px-2 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10.5px] font-bold tabular-nums">
                                        +12,5%
                                    </div>
                                </div>

                                {/* Sparkline */}
                                <svg
                                    viewBox="0 0 300 60"
                                    className="w-full h-12 mb-4"
                                    preserveAspectRatio="none"
                                >
                                    <defs>
                                        <linearGradient
                                            id="spark-fill"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="#10B981"
                                                stopOpacity="0.5"
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor="#10B981"
                                                stopOpacity="0"
                                            />
                                        </linearGradient>
                                    </defs>
                                    <path
                                        d="M 0 48 L 30 44 L 60 46 L 90 36 L 120 32 L 150 30 L 180 22 L 210 20 L 240 14 L 270 10 L 300 6 L 300 60 L 0 60 Z"
                                        fill="url(#spark-fill)"
                                    />
                                    <path
                                        d="M 0 48 L 30 44 L 60 46 L 90 36 L 120 32 L 150 30 L 180 22 L 210 20 L 240 14 L 270 10 L 300 6"
                                        stroke="#10B981"
                                        strokeWidth="2.2"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>

                                {/* FI Progress */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[11px] text-[#C8DCF0] font-medium">
                                            Financial Freedom
                                        </span>
                                        <span className="text-[11px] text-white font-bold tabular-nums">
                                            42%
                                        </span>
                                    </div>
                                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                                            style={{ width: '42%' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Floating badge — top right */}
                            <div className="absolute -top-3 -right-3 px-3 py-2 rounded-lg bg-white shadow-xl shadow-black/50 border border-white/20">
                                <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-500 leading-none mb-1.5">
                                    Nabung bulan ini
                                </p>
                                <p className="text-xs font-bold text-emerald-600 tabular-nums leading-none">
                                    +Rp 2.500.000
                                </p>
                            </div>

                            {/* Floating badge — bottom left */}
                            <div className="absolute -bottom-3 -left-3 px-3 py-2 rounded-lg bg-white shadow-xl shadow-black/50 border border-white/20">
                                <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-500 leading-none mb-1.5">
                                    Goal · Liburan Bali
                                </p>
                                <p className="text-xs font-bold text-emerald-600 leading-none flex items-center gap-1">
                                    <span>✓</span> Tercapai
                                </p>
                            </div>
                        </div>

                        {/* ============================================ */}
                        {/* Features grid 2x2                             */}
                        {/* ============================================ */}
                        <div className="grid grid-cols-2 gap-3 mb-8">
                            {FEATURES.map((f) => {
                                const Icon = f.icon
                                return (
                                    <div
                                        key={f.label}
                                        className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
                                    >
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                            style={{
                                                background: `${f.accent}18`,
                                                border: `1px solid ${f.accent}35`,
                                            }}
                                        >
                                            <Icon
                                                className="w-4 h-4"
                                                style={{ color: f.accent }}
                                                strokeWidth={2.4}
                                            />
                                        </div>
                                        <span className="text-[11.5px] font-semibold text-white leading-tight">
                                            {f.label}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>

                        {/* ============================================ */}
                        {/* Trust strip                                   */}
                        {/* ============================================ */}
                        <div className="flex items-center gap-6 flex-wrap pt-6 border-t border-white/[0.06]">
                            {TRUST.map((t) => {
                                const Icon = t.icon
                                return (
                                    <div
                                        key={t.label}
                                        className="flex items-center gap-2 text-[11px] font-medium text-[#C8DCF0]"
                                    >
                                        <Icon
                                            className="w-3.5 h-3.5 text-[#7096D1]"
                                            strokeWidth={2.2}
                                        />
                                        <span>{t.label}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </aside>

            {/* ============================================ */}
            {/* RIGHT — FORM PANEL (40%)                      */}
            {/* ============================================ */}
            <main className="flex-1 lg:w-[40%] flex flex-col min-h-screen">
                {/* Mobile mini-brand */}
                <div className="lg:hidden flex items-center justify-center pt-10 pb-2">
                    <Link href="/" className="inline-flex items-center gap-2.5">
                        <SynmonyMark size="md" className="w-10 h-10" />
                        <div className="text-left">
                            <div className="text-base font-bold tracking-tight leading-none">
                                Synmony
                            </div>
                            <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
                                Second Brain for Your Money
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Form content — di-center */}
                <div className="flex-1 flex items-center justify-center px-6 sm:px-8 py-8 lg:py-12">
                    <div className="w-full max-w-[420px]">
                        <div className="mb-8">
                            {eyebrow && (
                                <p className="text-[11px] font-bold uppercase tracking-widest text-brand mb-2.5">
                                    {eyebrow}
                                </p>
                            )}
                            <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight leading-tight mb-3">
                                {title}
                            </h1>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {subtitle}
                            </p>
                        </div>

                        <div>{children}</div>

                        {footer && (
                            <div className="mt-9 pt-7 border-t border-slate-200 dark:border-white/10 text-center text-sm">
                                {footer}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer legal */}
                <div className="px-6 sm:px-8 pb-6 text-center">
                    <p className="text-[11px] text-muted-foreground/70">
                        © {new Date().getFullYear()} Synmony ·{' '}
                        <Link
                            href="/privacy"
                            className="hover:text-foreground transition-colors"
                        >
                            Kebijakan Privasi
                        </Link>{' '}
                        ·{' '}
                        <Link
                            href="/terms"
                            className="hover:text-foreground transition-colors"
                        >
                            Syarat &amp; Ketentuan
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    )
}