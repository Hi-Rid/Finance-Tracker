'use client'

import { useEffect, useState } from 'react'
import { Loader2, Sparkles, RotateCcw } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useWishlists } from '@/lib/hooks/use-wishlists'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import {
    DECISION_QUESTIONS,
    DECISION_MAX_SCORE,
    getDecisionInterpretation,
    type DecisionInput,
    type DecisionKey,
} from '@/lib/validators/wishlist'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Wishlist = Database['public']['Tables']['wishlists']['Row']

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    wishlist: Wishlist
}

const EMPTY_ANSWERS: Partial<Record<DecisionKey, number>> = {}

export function WishlistDecisionModal({
    open,
    onOpenChange,
    wishlist,
}: Props) {
    const isMobile = useMediaQuery('(max-width: 767px)')
    const { saveDecision } = useWishlists()
    const [answers, setAnswers] =
        useState<Partial<Record<DecisionKey, number>>>(EMPTY_ANSWERS)
    const [submitting, setSubmitting] = useState(false)

    // Load existing answers saat open
    useEffect(() => {
        if (!open) return

        const existing = wishlist.decision_answers as DecisionInput | null
        if (existing && typeof existing === 'object') {
            setAnswers(existing)
        } else {
            setAnswers(EMPTY_ANSWERS)
        }
    }, [open, wishlist.id, wishlist.decision_answers])

    const filledCount = Object.keys(answers).length
    const totalQuestions = DECISION_QUESTIONS.length
    const canSubmit = filledCount === totalQuestions

    const score = Object.values(answers).reduce<number>(
        (sum, v) => sum + (v || 0),
        0
    )

    const interpretation = canSubmit
        ? getDecisionInterpretation(score)
        : null

    function setAnswer(key: DecisionKey, value: number) {
        setAnswers((prev) => ({ ...prev, [key]: value }))
    }

    function handleReset() {
        setAnswers(EMPTY_ANSWERS)
    }

    async function handleSubmit() {
        if (!canSubmit) return
        setSubmitting(true)
        const result = await saveDecision(
            wishlist.id,
            answers as DecisionInput
        )
        setSubmitting(false)
        if (result.success) {
            onOpenChange(false)
        }
    }

    const formContent = (
        <div className="space-y-5">
            {/* Progress */}
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                        {filledCount}
                    </span>{' '}
                    / {totalQuestions} terjawab
                </p>
                {filledCount > 0 && (
                    <button
                        type="button"
                        onClick={handleReset}
                        className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                    </button>
                )}
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-brand to-brand-hover transition-all duration-300"
                    style={{
                        width: `${(filledCount / totalQuestions) * 100}%`,
                    }}
                />
            </div>

            {/* Questions */}
            <div className="space-y-5">
                {DECISION_QUESTIONS.map((q, idx) => {
                    const selected = answers[q.key]
                    return (
                        <div key={q.key}>
                            <div className="flex items-start gap-2.5 mb-3">
                                <div
                                    className={cn(
                                        'w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold transition-colors',
                                        selected
                                            ? 'bg-brand text-white'
                                            : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                                    )}
                                >
                                    {idx + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium leading-snug">
                                        {q.label}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                                        {q.help}
                                    </p>
                                </div>
                            </div>

                            {/* Options 1-5 */}
                            <div className="grid grid-cols-5 gap-1.5 md:gap-2 ml-0 md:ml-8">
                                {[1, 2, 3, 4, 5].map((v) => {
                                    const isActive = selected === v
                                    return (
                                        <button
                                            key={v}
                                            type="button"
                                            onClick={() =>
                                                setAnswer(q.key, v)
                                            }
                                            className={cn(
                                                'h-10 rounded-lg font-bold text-sm transition-all cursor-pointer',
                                                isActive
                                                    ? 'bg-brand text-white shadow-sm shadow-brand/30 scale-[1.02]'
                                                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                                            )}
                                        >
                                            {v}
                                        </button>
                                    )
                                })}
                            </div>

                            <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 ml-0 md:ml-8">
                                <span>{q.low}</span>
                                <span>{q.high}</span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Live score preview */}
            {canSubmit && interpretation && (
                <div
                    className={cn(
                        'rounded-xl border p-4 space-y-2',
                        interpretation.variant === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/30'
                            : interpretation.variant === 'warning'
                                ? 'bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/30'
                                : 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/30'
                    )}
                >
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Skor
                        </span>
                        <span
                            className={cn(
                                'text-2xl font-bold tabular-nums leading-none',
                                interpretation.variant === 'success'
                                    ? 'text-emerald-700 dark:text-emerald-300'
                                    : interpretation.variant === 'warning'
                                        ? 'text-amber-700 dark:text-amber-300'
                                        : 'text-red-700 dark:text-red-300'
                            )}
                        >
                            {score}
                            <span className="text-xs font-medium opacity-60 ml-0.5">
                                /{DECISION_MAX_SCORE}
                            </span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-base">
                            {interpretation.emoji}
                        </span>
                        <span
                            className={cn(
                                'text-sm font-bold',
                                interpretation.variant === 'success'
                                    ? 'text-emerald-700 dark:text-emerald-300'
                                    : interpretation.variant === 'warning'
                                        ? 'text-amber-700 dark:text-amber-300'
                                        : 'text-red-700 dark:text-red-300'
                            )}
                        >
                            {interpretation.label}
                        </span>
                    </div>
                    <p
                        className={cn(
                            'text-[11px] leading-relaxed',
                            interpretation.variant === 'success'
                                ? 'text-emerald-700/80 dark:text-emerald-300/80'
                                : interpretation.variant === 'warning'
                                    ? 'text-amber-700/80 dark:text-amber-300/80'
                                    : 'text-red-700/80 dark:text-red-300/80'
                        )}
                    >
                        {interpretation.message}
                    </p>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={submitting}
                    className="flex-1"
                >
                    Batal
                </Button>
                <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || !canSubmit}
                    className="flex-1"
                >
                    {submitting && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    Simpan
                </Button>
            </div>
        </div>
    )

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent
                    side="bottom"
                    className="max-h-[92vh] overflow-y-auto"
                >
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-brand" />
                            Decision Check
                        </SheetTitle>
                        <SheetDescription>
                            Jujur jawab 6 pertanyaan ini - biar keputusan lu
                            lebih rasional, bukan impulsif.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="px-4 pb-6 pt-2">{formContent}</div>
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-brand" />
                        Decision Check
                    </DialogTitle>
                    <DialogDescription>
                        Jujur jawab 6 pertanyaan ini - biar keputusan lu lebih
                        rasional, bukan impulsif.
                    </DialogDescription>
                </DialogHeader>
                {formContent}
            </DialogContent>
        </Dialog>
    )
}