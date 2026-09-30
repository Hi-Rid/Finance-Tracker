'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Crown,
    Sparkles,
    TrendingUp,
    ShieldCheck,
    Heart,
    Loader2,
    PartyPopper,
} from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Amount } from '@/components/ui/amount'
import { cn } from '@/lib/utils'
import type { ResolvedFiParams } from '@/lib/utils/financial-freedom'

type Props = {
    resolved: ResolvedFiParams
    onDismiss: () => Promise<void>
}

export function FiAchievedModal({ resolved, onDismiss }: Props) {
    const [submitting, setSubmitting] = useState(false)

    const surplus = resolved.currentNetWorth - resolved.fiNumber

    async function handleDismiss() {
        setSubmitting(true)
        try {
            await onDismiss()
        } finally {
            setSubmitting(false)
        }
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
                    'sm:max-w-xl',
                    'max-h-[92vh] flex flex-col',
                    'bg-card border-slate-200 dark:border-white/15'
                )}
            >
                {/* Confetti header */}
                <div className="relative shrink-0 pt-8 sm:pt-10 pb-5 sm:pb-6 px-5 sm:px-6 text-center overflow-hidden">
                    <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 blur-3xl opacity-25 pointer-events-none" />

                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                        className="relative inline-block mb-4 sm:mb-5"
                    >
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 blur-2xl opacity-50" />
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/50">
                            <Crown
                                className="w-10 h-10 sm:w-12 sm:h-12 text-white"
                                strokeWidth={2.2}
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ y: 12, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                            🎉 Pencapaian Luar Biasa
                        </span>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mt-3 mb-3 leading-tight">
                            Selamat,
                            <br />
                            <span className="bg-gradient-to-r from-emerald-500 to-emerald-700 dark:from-emerald-400 dark:to-emerald-600 bg-clip-text text-transparent">
                                Lu Udah Financial Independence!
                            </span>
                        </h2>
                        <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
                            Kerja sekarang jadi{' '}
                            <strong className="text-foreground">pilihan</strong>, bukan
                            kewajiban.
                        </p>
                    </motion.div>
                </div>

                {/* Stats */}
                <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-5 sm:pb-6 space-y-3">
                    <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-50/30 dark:from-emerald-500/10 dark:to-emerald-500/[0.02] border-2 border-emerald-200 dark:border-emerald-500/30 p-4 sm:p-5">
                        <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1.5">
                            Aset Produktif Lu
                        </p>
                        <Amount
                            value={resolved.currentNetWorth}
                            className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300 block break-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-3.5 sm:p-4">
                            <div className="flex items-center gap-1.5 mb-2">
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    Surplus
                                </p>
                            </div>
                            <Amount
                                value={surplus}
                                className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 block break-all"
                            />
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                dari target
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-3.5 sm:p-4">
                            <div className="flex items-center gap-1.5 mb-2">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    Progress
                                </p>
                            </div>
                            <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                {resolved.fiProgress.toFixed(0)}%
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                dari target
                            </p>
                        </div>
                    </div>

                    {/* What's next */}
                    <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-50/40 dark:from-emerald-500/10 dark:to-emerald-500/[0.02] border border-emerald-200 dark:border-emerald-500/30 p-4 sm:p-5">
                        <div className="flex items-center gap-2.5 mb-3">
                            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                                Fokus Selanjutnya: Mempertahankan
                            </p>
                        </div>
                        <ul className="space-y-2 text-sm text-emerald-800 dark:text-emerald-200/90">
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                                    •
                                </span>
                                <span>
                                    <strong>Withdrawal aman:</strong> mulai tarik 3-4% per tahun
                                    buat hidup, sisanya biarin tumbuh
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                                    •
                                </span>
                                <span>
                                    <strong>Diversifikasi:</strong> jangan taruh semua di 1
                                    instrumen, sebar ke saham-obligasi-emas
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                                    •
                                </span>
                                <span>
                                    <strong>Hindari lifestyle creep:</strong> income naik bukan
                                    berarti expense naik
                                </span>
                            </li>
                        </ul>
                    </div>

                    <div className="rounded-2xl bg-emerald-50/60 dark:bg-emerald-500/[0.06] border border-emerald-200/60 dark:border-emerald-500/20 p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                            <Heart className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-foreground mb-1">
                                    Pertanyaan buat lu
                                </p>
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                    Sekarang setelah bebas finansial, apa yang mau lu lakuin
                                    dengan waktu lu? Kerja yang lebih meaningful? Travel? Mulai
                                    bisnis? Bantu orang lain?
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="shrink-0 p-4 sm:p-5 md:p-6 border-t border-slate-100 dark:border-white/10">
                    <Button
                        type="button"
                        onClick={handleDismiss}
                        disabled={submitting}
                        size="lg"
                        className="w-full h-11 sm:h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm sm:text-base font-bold shadow-lg shadow-emerald-500/30"
                    >
                        {submitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <PartyPopper className="w-5 h-5" />
                        )}
                        Lanjut Jelajahi Dashboard
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}