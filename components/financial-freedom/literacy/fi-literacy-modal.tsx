'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Crown,
    ArrowRight,
    ArrowLeft,
    Loader2,
    Target,
    Sparkles,
    TrendingUp,
    Bot,
    Trophy,
    ListChecks,
    BarChart3,
    Lightbulb,
} from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
    onComplete: () => Promise<void>
}

const TOTAL_SLIDES = 5

// ============================================================
// ROOT
// ============================================================

export function FiLiteracyModal({ onComplete }: Props) {
    const [step, setStep] = useState(0)
    const [submitting, setSubmitting] = useState(false)

    const isLast = step === TOTAL_SLIDES - 1

    async function handleFinish() {
        setSubmitting(true)
        try {
            await onComplete()
        } finally {
            setSubmitting(false)
        }
    }

    function next() {
        if (isLast) {
            handleFinish()
        } else {
            setStep((s) => s + 1)
        }
    }

    function prev() {
        setStep((s) => Math.max(0, s - 1))
    }

    return (
        <Dialog open>
            <DialogContent
                showCloseButton={false}
                onEscapeKeyDown={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
                className={cn(
                    'p-0 gap-0 overflow-hidden',
                    'sm:max-w-3xl',
                    'max-h-[94vh] flex flex-col',
                    'bg-card border-slate-200 dark:border-white/15'
                )}
            >
                {/* ============ PROGRESS HEADER ============ */}
                <div className="relative shrink-0 pt-7 pb-5 px-6 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-center gap-2.5">
                        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    'h-2 rounded-full transition-all duration-300',
                                    i === step
                                        ? 'w-10 bg-brand'
                                        : i < step
                                            ? 'w-2 bg-brand/50'
                                            : 'w-2 bg-slate-200 dark:bg-white/10'
                                )}
                            />
                        ))}
                    </div>
                    <p className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-3">
                        Langkah {step + 1} dari {TOTAL_SLIDES}
                    </p>
                </div>

                {/* ============ SLIDES ============ */}
                <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        >
                            {step === 0 && <SlideWelcome />}
                            {step === 1 && <SlideFiNumber />}
                            {step === 2 && <SlideFiTypes />}
                            {step === 3 && <SlideCoastFi />}
                            {step === 4 && <SlideFeatures />}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* ============ NAVIGATION ============ */}
                <div className="shrink-0 p-5 md:p-6 border-t border-slate-100 dark:border-white/10 flex gap-3">
                    {step > 0 && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={prev}
                            disabled={submitting}
                            className="h-11 px-5 text-sm"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Kembali
                        </Button>
                    )}
                    <Button
                        type="button"
                        onClick={next}
                        disabled={submitting}
                        className={cn(
                            'flex-1 h-11 text-sm font-semibold',
                            isLast &&
                            'bg-gradient-to-r from-brand to-brand-hover hover:from-brand-hover hover:to-brand-active'
                        )}
                    >
                        {submitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isLast ? (
                            <>
                                <Crown className="w-4 h-4" />
                                Mulai Perjalanan Financial Freedom
                            </>
                        ) : (
                            <>
                                Lanjut
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ============================================================
// SLIDE 1 - WELCOME
// ============================================================

function SlideWelcome() {
    return (
        <div className="flex flex-col items-center text-center py-2">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05, type: 'spring', stiffness: 200 }}
                className="relative mb-7"
            >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 blur-2xl opacity-40" />
                <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/40">
                    <Crown className="w-12 h-12 text-white" strokeWidth={2.2} />
                </div>
            </motion.div>

            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-3">
                Sebelum Kita Mulai
            </span>

            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 max-w-lg leading-tight">
                Kenalan Dulu Sama
                <br />
                <span className="bg-gradient-to-r from-brand to-brand-hover bg-clip-text text-transparent">
                    Financial Freedom
                </span>
            </h2>

            {/* Badge FI */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 mb-5">
                <span className="text-base font-bold text-brand">FI</span>
                <span className="text-xs font-medium text-muted-foreground">=</span>
                <span className="text-sm font-semibold text-brand">
                    Financial Independence
                </span>
            </div>

            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-lg mb-3">
                FI itu kondisi di mana lu punya{' '}
                <strong className="text-foreground">pilihan</strong>: kerja karena mau,
                bukan karena harus.
            </p>

            <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-lg mb-8">
                Di halaman ini, lu bakal hitung angka yang bikin lu bebas, dan lihat
                jalan konkret buat nyampe ke sana.
            </p>

            <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
                <MiniStat value="25×" label="Pengeluaran Tahunan" sub="target minimal" />
                <MiniStat value="4%" label="SWR" sub="safe withdrawal" />
                <MiniStat value="∞" label="Pilihan" sub="hidup lebih bebas" />
            </div>

            <div className="mt-8 rounded-2xl bg-brand/[0.04] dark:bg-brand/[0.06] border border-brand/15 p-4 w-full max-w-lg">
                <div className="flex items-start gap-3 text-left">
                    <Lightbulb className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        Kabar baik: lu <strong>gak perlu jadi miliarder</strong> buat
                        merdeka finansial. Cukup tahu angkanya, dan disiplin ngejar.
                    </p>
                </div>
            </div>
        </div>
    )
}

function MiniStat({
    value,
    label,
    sub,
}: {
    value: string
    label: string
    sub: string
}) {
    return (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] py-4 px-2">
            <p className="text-2xl font-bold text-brand tabular-nums leading-none mb-1.5">
                {value}
            </p>
            <p className="text-xs font-bold text-foreground leading-tight mb-0.5">
                {label}
            </p>
            <p className="text-xs text-muted-foreground leading-tight">{sub}</p>
        </div>
    )
}

// ============================================================
// SLIDE 2 - FI NUMBER
// ============================================================

function SlideFiNumber() {
    return (
        <div className="py-2 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center shrink-0">
                    <Target className="w-6 h-6 text-brand" />
                </div>
                <div>
                    <p className="text-xs font-bold text-brand uppercase tracking-widest leading-none mb-1">
                        Langkah 1
                    </p>
                    <h3 className="text-2xl font-bold tracking-tight leading-tight">
                        Apa itu FI Number?
                    </h3>
                </div>
            </div>

            <p className="text-base text-muted-foreground leading-relaxed mb-6">
                FI Number itu <strong className="text-foreground">angka ajaib</strong>{' '}
                buat lu: total aset yang lu butuhin biar bisa hidup dari passive income
                tanpa ngabisin modal. Ini target akhir lu.
            </p>

            {/* Rumus */}
            <div className="rounded-2xl bg-gradient-to-br from-brand/5 to-transparent border-2 border-brand/20 p-6 mb-6">
                <p className="text-center text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                    Rumus FI Number
                </p>
                <p className="text-center text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                    <span className="text-brand">25×</span>{' '}
                    <span className="text-muted-foreground text-xl md:text-2xl font-medium">
                        pengeluaran tahunan
                    </span>
                </p>
            </div>

            {/* Kenapa 25x */}
            <div className="mb-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                    Kenapa 25×?
                </p>
                <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                    Karena <strong>4% Safe Withdrawal Rate</strong>: riset Trinity study
                    nunjukin kalau lu tarik 4% dari aset tiap tahun, aset lu bakal tetap
                    awet 30 tahun ke atas (bahkan lebih, kalau return &gt; inflasi).
                </p>
                <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                    25× dan 4% itu <strong>kebalikan satu sama lain</strong> (1 ÷ 25 =
                    4%). Jadi FI Number = 25× pengeluaran tahunan.
                </p>
            </div>

            {/* Contoh */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-5 mb-5">
                <p className="text-xs font-bold text-brand uppercase tracking-widest mb-4">
                    Contoh Konkret
                </p>

                <div className="space-y-3.5">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-muted-foreground">
                            Pengeluaran bulanan
                        </span>
                        <span className="text-base font-bold tabular-nums">
                            Rp 10.000.000
                        </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-muted-foreground">
                            Pengeluaran tahunan (× 12)
                        </span>
                        <span className="text-base font-bold tabular-nums">
                            Rp 120.000.000
                        </span>
                    </div>

                    <div className="pt-3.5 border-t border-slate-200 dark:border-white/10">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-foreground">
                                FI Number (× 25)
                            </span>
                            <span className="text-xl md:text-2xl font-bold text-brand tabular-nums">
                                Rp 3 Miliar
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Dengan Rp 3 miliar di aset produktif, lu bisa tarik{' '}
                        <strong className="text-foreground">
                            4% per tahun = Rp 120 juta
                        </strong>
                        , sama persis dengan pengeluaran lu. Uangnya cukup buat selamanya.
                    </p>
                </div>
            </div>

            {/* Callout */}
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-4 flex gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                    <p className="text-base font-bold text-amber-900 dark:text-amber-200 mb-1">
                        Yang berubah setelah FI
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-200/90 leading-relaxed">
                        Kerja jadi <strong>opsional</strong>. Lu bisa pilih mau lanjut
                        karier, ganti profesi, mulai bisnis, atau berhenti total. Itu
                        namanya punya pilihan.
                    </p>
                </div>
            </div>
        </div>
    )
}

// ============================================================
// SLIDE 3 - TIPE FI
// ============================================================

function SlideFiTypes() {
    const types = [
        {
            emoji: '🌱',
            label: 'Lean FI',
            multiplier: '20×',
            desc: 'Hidup minimalis',
            detail:
                'Pengeluaran ketat, gaya hidup sederhana. Cocok kalau lu nyaman hidup hemat dan gak butuh banyak barang.',
            example: 'Pengeluaran 8jt/bln jadi FI Number 1.92M',
            color: '#10b981',
        },
        {
            emoji: '🏠',
            label: 'Regular FI',
            multiplier: '25×',
            desc: 'Standar 4% SWR',
            detail:
                'Keseimbangan antara bebas dan gaya hidup. Ini default dan paling banyak dipakai. Aman dan realistis.',
            example: 'Pengeluaran 10jt/bln jadi FI Number 3M',
            color: '#334DAF',
        },
        {
            emoji: '✨',
            label: 'Fat FI',
            multiplier: '33×',
            desc: 'Hidup nyaman',
            detail:
                'Buffer lebih besar buat travel, hobi, atau inflasi. Target lebih jauh, tapi jauh lebih aman dan lega.',
            example: 'Pengeluaran 15jt/bln jadi FI Number 5.94M',
            color: '#f59e0b',
        },
    ]

    return (
        <div className="py-2 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-6 h-6 text-brand" />
                </div>
                <div>
                    <p className="text-xs font-bold text-brand uppercase tracking-widest leading-none mb-1">
                        Langkah 2
                    </p>
                    <h3 className="text-2xl font-bold tracking-tight leading-tight">
                        Pilih Level Lu
                    </h3>
                </div>
            </div>

            <p className="text-base text-muted-foreground leading-relaxed mb-6">
                Ada 3 level FI, bedanya di multiplier dan gaya hidup yang lu mau. Gak
                ada yang lebih bener, pilih sesuai target dan kenyamanan lu. Bisa
                diubah kapan aja.
            </p>

            <div className="space-y-3">
                {types.map((t) => (
                    <div
                        key={t.label}
                        className="rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-5"
                    >
                        <div className="flex items-start gap-4 mb-3">
                            <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                                style={{ backgroundColor: `${t.color}15` }}
                            >
                                {t.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <p className="text-base font-bold">{t.label}</p>
                                    <div
                                        className="px-2.5 py-0.5 rounded-md text-xs font-bold tabular-nums"
                                        style={{
                                            color: t.color,
                                            backgroundColor: `${t.color}15`,
                                        }}
                                    >
                                        {t.multiplier}
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{t.desc}</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                    {t.detail}
                                </p>
                            </div>
                        </div>
                        <div className="pt-3 border-t border-slate-100 dark:border-white/5">
                            <p className="text-xs text-muted-foreground">
                                <span className="font-semibold uppercase tracking-wider">
                                    Contoh:{' '}
                                </span>
                                {t.example}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-5 rounded-2xl bg-brand/[0.04] dark:bg-brand/[0.06] border border-brand/15 p-4 flex gap-3">
                <Lightbulb className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    Semakin <strong>kecil multiplier</strong>, semakin cepet lu FI, tapi
                    gaya hidup lebih ketat. Semakin <strong>besar</strong>, target lebih
                    jauh tapi buffer lebih lega.
                </p>
            </div>
        </div>
    )
}

// ============================================================
// SLIDE 4 - COAST FI
// ============================================================

function SlideCoastFi() {
    return (
        <div className="py-2 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-brand" />
                </div>
                <div>
                    <p className="text-xs font-bold text-brand uppercase tracking-widest leading-none mb-1">
                        Konsep Kunci
                    </p>
                    <h3 className="text-2xl font-bold tracking-tight leading-tight">
                        Coast FI
                    </h3>
                </div>
            </div>

            <p className="text-base text-muted-foreground leading-relaxed mb-6">
                Bayangin lu bisa{' '}
                <strong className="text-foreground">berhenti nabung</strong> sekarang,
                dan aset yang ada bakal ngejar target FI sendiri lewat compound growth.
                Itu dia <strong className="text-foreground">Coast FI</strong>.
            </p>

            {/* Illustration */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-5 mb-5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 text-center">
                    Visualisasi
                </p>
                <svg viewBox="0 0 400 180" className="w-full h-auto">
                    <defs>
                        <linearGradient id="coast-grad2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#334DAF" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#334DAF" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="stop-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#64748b" stopOpacity="0.12" />
                            <stop offset="100%" stopColor="#64748b" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* FI line */}
                    <line
                        x1="10"
                        y1="30"
                        x2="390"
                        y2="30"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeDasharray="6 4"
                    />
                    <text x="14" y="24" fontSize="11" fill="#10b981" fontWeight="700">
                        🎯 FI TARGET
                    </text>

                    {/* Coast marker line */}
                    <line
                        x1="180"
                        y1="95"
                        x2="180"
                        y2="160"
                        stroke="#64748b"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                        opacity="0.6"
                    />

                    {/* Coast point */}
                    <circle cx="180" cy="95" r="7" fill="#334DAF" />
                    <circle cx="180" cy="95" r="13" fill="#334DAF" opacity="0.2" />
                    <text
                        x="180"
                        y="78"
                        fontSize="13"
                        fill="#334DAF"
                        fontWeight="800"
                        textAnchor="middle"
                    >
                        COAST FI
                    </text>

                    {/* Curve (compound growth) */}
                    <path
                        d="M 10 145 Q 70 138 130 120 T 180 95 T 300 50 T 390 30"
                        stroke="#334DAF"
                        strokeWidth="3"
                        fill="none"
                    />
                    <path
                        d="M 10 145 Q 70 138 130 120 T 180 95 T 300 50 T 390 30 L 390 175 L 10 175 Z"
                        fill="url(#coast-grad2)"
                    />

                    {/* Stop saving zone */}
                    <rect
                        x="180"
                        y="30"
                        width="210"
                        height="130"
                        fill="url(#stop-grad)"
                    />

                    {/* Labels */}
                    <text
                        x="180"
                        y="170"
                        fontSize="11"
                        fill="#64748b"
                        fontWeight="600"
                        textAnchor="middle"
                    >
                        ⏸️ berhenti nabung
                    </text>
                </svg>

                <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-white/10 flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-brand shrink-0" />
                        <span className="text-xs font-medium text-muted-foreground">
                            Compound growth
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-full border-2 border-dashed shrink-0"
                            style={{ borderColor: '#10b981' }}
                        />
                        <span className="text-xs font-medium text-muted-foreground">
                            FI Target
                        </span>
                    </div>
                </div>
            </div>

            {/* Konsep detail - 3 steps */}
            <div className="space-y-3 mb-5">
                <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-brand/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-brand">1</span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        Sebelum Coast FI, lu <strong>harus aktif nabung</strong> tiap bulan.
                    </p>
                </div>
                <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-brand/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-brand">2</span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        Pas udah <strong>Coast FI</strong>, lu berhenti nabung, dan aset lu{' '}
                        <strong>tetap tumbuh sendiri</strong> lewat return investasi.
                    </p>
                </div>
                <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-brand/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-brand">3</span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        Sampai akhirnya nyampe <strong>FI Number</strong> walau lu udah gak
                        nabung lagi.
                    </p>
                </div>
            </div>

            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-4 flex gap-3">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                    <p className="text-base font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                        Kenapa keren?
                    </p>
                    <p className="text-sm text-emerald-800 dark:text-emerald-200/90 leading-relaxed">
                        Setelah Coast FI, lu bisa <strong>kerja dengan tenang</strong> tanpa
                        tekanan wajib nabung. Fokus ke hidup dan pengalaman.
                    </p>
                </div>
            </div>
        </div>
    )
}

// ============================================================
// SLIDE 5 - FEATURES + CTA
// ============================================================

function SlideFeatures() {
    const features = [
        {
            icon: BarChart3,
            label: 'FI Progress',
            desc: 'Progress real-time ke target FI lu',
        },
        {
            icon: TrendingUp,
            label: 'Compound Chart',
            desc: 'Visualisasi growth aset sampai FI',
        },
        {
            icon: Target,
            label: 'Scenario Simulator',
            desc: 'Lihat efek naikin saving rate',
        },
        {
            icon: Bot,
            label: 'AI Advisor',
            desc: 'Saran personal dari AI',
        },
        {
            icon: Trophy,
            label: 'Milestones',
            desc: 'Achievement di tiap 10-25% progress',
        },
        {
            icon: ListChecks,
            label: 'Action Plan',
            desc: 'Langkah konkret 30-90 hari',
        },
    ]

    return (
        <div className="py-2 max-w-2xl mx-auto">
            <div className="text-center mb-7">
                <span className="text-xs font-bold text-brand uppercase tracking-widest">
                    Yang Bakal Lu Dapet
                </span>
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight mt-2 mb-3 leading-tight">
                    Bukan Cuma Hitung,
                    <br />
                    Tapi Plan dan Action
                </h3>
                <p className="text-base text-muted-foreground max-w-md mx-auto">
                    Semua tools yang lu butuhin buat navigasi perjalanan FI lu
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {features.map((f) => {
                    const Icon = f.icon
                    return (
                        <div
                            key={f.label}
                            className="rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-4 flex items-start gap-3.5"
                        >
                            <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                                <Icon className="w-5 h-5 text-brand" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-base font-bold leading-tight mb-1">
                                    {f.label}
                                </p>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {f.desc}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-amber-50/40 dark:from-amber-500/10 dark:to-amber-500/[0.03] border border-amber-200 dark:border-amber-500/30 p-5">
                <div className="flex items-center gap-3 mb-3">
                    <Crown className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
                    <p className="text-base font-bold text-amber-900 dark:text-amber-200">
                        Siap Mulai?
                    </p>
                </div>
                <p className="text-sm text-amber-800 dark:text-amber-200/90 leading-relaxed">
                    Klik <strong>Mulai Perjalanan Financial Freedom</strong> di bawah buat
                    masuk ke dashboard FI lu. Semua bisa diubah nanti, jadi gak ada yang
                    permanen.
                </p>
            </div>
        </div>
    )
}