'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
    getDefaultMultiplier,
    type FiType,
    type AiAnalysis,
    type MilestoneType,
} from '@/lib/validators/financial-freedom'
import type { MilestoneTarget } from '@/lib/utils/financial-freedom'
import { formatRupiah } from '@/lib/normalize'

// ============================================================
// TYPES
// ============================================================

export type FiSettingsInputFromUI = {
    fi_type: FiType
    fi_multiplier: number
    monthly_expense_override: number | null
    monthly_income_override: number | null
    expected_return_rate: number // persen (0-100)
    inflation_rate: number       // persen (0-100)
    current_age: number | null
    target_retire_age: number | null
}

// ============================================================
// HOOK
// ============================================================

export function useFinancialFreedom() {
    const router = useRouter()
    const supabase = createClient()

    // ============================================================
    // 1. ENSURE SETTINGS ROW EXISTS
    // ============================================================
    const ensureSettings = useCallback(
        async (profileId: string): Promise<{ success: boolean; id?: string }> => {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) return { success: false }

            const { data: existing } = await supabase
                .from('financial_freedom_settings')
                .select('id')
                .eq('profile_id', profileId)
                .maybeSingle()

            if (existing) return { success: true, id: existing.id }

            const { data: created, error } = await supabase
                .from('financial_freedom_settings')
                .insert({
                    user_id: user.id,
                    profile_id: profileId,
                    fi_type: 'regular',
                    fi_multiplier: 25,
                    expected_return_rate: 0.10,
                    inflation_rate: 0.03,
                    onboarding_completed: false,
                })
                .select('id')
                .single()

            if (error || !created) {
                console.error('[ff] ensureSettings failed:', error)
                return { success: false }
            }

            return { success: true, id: created.id }
        },
        [supabase]
    )

    // ============================================================
    // 2. UPDATE SETTINGS
    // ============================================================
    const updateSettings = useCallback(
        async (
            profileId: string,
            input: FiSettingsInputFromUI
        ): Promise<{ success: boolean }> => {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) {
                toast.error('Lu belum login')
                return { success: false }
            }

            // Auto-align multiplier kalau fi_type ≠ custom & multiplier mismatch
            let multiplier = input.fi_multiplier
            if (input.fi_type !== 'custom') {
                const expected = getDefaultMultiplier(input.fi_type)
                if (multiplier !== expected) {
                    multiplier = expected
                }
            }

            // Convert % → decimal
            const payload = {
                user_id: user.id,
                profile_id: profileId,
                fi_type: input.fi_type,
                fi_multiplier: multiplier,
                monthly_expense_override: input.monthly_expense_override,
                monthly_income_override: input.monthly_income_override,
                expected_return_rate: input.expected_return_rate / 100,
                inflation_rate: input.inflation_rate / 100,
                current_age: input.current_age,
                target_retire_age: input.target_retire_age,
            }

            const { error } = await supabase
                .from('financial_freedom_settings')
                .upsert(payload, { onConflict: 'profile_id' })

            if (error) {
                console.error('[ff] updateSettings failed:', error)
                toast.error('Gagal simpan pengaturan')
                return { success: false }
            }

            toast.success('Pengaturan tersimpan')
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    // ============================================================
    // 3. COMPLETE ONBOARDING
    // ============================================================
    const completeOnboarding = useCallback(
        async (profileId: string): Promise<{ success: boolean }> => {
            const { error } = await supabase
                .from('financial_freedom_settings')
                .update({ onboarding_completed: true })
                .eq('profile_id', profileId)

            if (error) {
                console.error('[ff] completeOnboarding failed:', error)
                return { success: false }
            }

            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    // ============================================================
    // 4. SAVE SNAPSHOT
    // ============================================================
    const saveSnapshot = useCallback(
        async (params: {
            profileId: string
            snapshotMonth: string
            netWorth: number
            fiNumber: number
            fiProgress: number
            savingsRate: number
            leanFiProgress: number | null
            regularFiProgress: number | null
            fatFiProgress: number | null
            coastFiProgress: number | null
            estimatedFiDate: Date | null
            monthlyExpense: number
            monthlyIncome: number
        }): Promise<{ success: boolean }> => {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) return { success: false }

            const { error } = await supabase
                .from('financial_freedom_snapshots')
                .upsert(
                    {
                        user_id: user.id,
                        profile_id: params.profileId,
                        snapshot_month: params.snapshotMonth,
                        net_worth: params.netWorth,
                        fi_number: params.fiNumber,
                        fi_progress: params.fiProgress,
                        savings_rate: params.savingsRate / 100, // decimal
                        lean_fi_progress: params.leanFiProgress,
                        regular_fi_progress: params.regularFiProgress,
                        fat_fi_progress: params.fatFiProgress,
                        coast_fi_progress: params.coastFiProgress,
                        estimated_fi_date: params.estimatedFiDate
                            ? params.estimatedFiDate.toISOString().split('T')[0]
                            : null,
                        monthly_expense: params.monthlyExpense,
                        monthly_income: params.monthlyIncome,
                    },
                    { onConflict: 'profile_id,snapshot_month' }
                )

            if (error) {
                console.error('[ff] saveSnapshot failed:', error)
                toast.error('Gagal simpan snapshot')
                return { success: false }
            }

            toast.success('Snapshot tersimpan')
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    // ============================================================
    // 5. SAVE AI ANALYSIS + ACTION STEPS
    // ============================================================
    const saveAiAnalysis = useCallback(
        async (
            profileId: string,
            analysis: AiAnalysis
        ): Promise<{ success: boolean }> => {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) {
                toast.error('Lu belum login')
                return { success: false }
            }

            // 1. Insert insight
            const { error: insightErr } = await supabase
                .from('financial_freedom_insights')
                .insert({
                    user_id: user.id,
                    profile_id: profileId,
                    overall_status: analysis.overall_status,
                    savings_rate_analysis: analysis.savings_rate_analysis,
                    improvements: analysis.improvements,
                    next_milestone: analysis.next_milestone,
                    next_milestone_amount: analysis.next_milestone_amount,
                    next_milestone_gap: analysis.next_milestone_gap,
                    raw_ai_response: analysis as any,
                })

            if (insightErr) {
                console.error('[ff] insight insert failed:', insightErr)
                toast.error('Gagal simpan analisis')
                return { success: false }
            }

            // 2. Replace action steps (delete old, insert new)
            await supabase
                .from('financial_freedom_action_steps')
                .delete()
                .eq('profile_id', profileId)

            const stepInserts = analysis.action_steps.map((s, i) => ({
                user_id: user.id,
                profile_id: profileId,
                title: s.title,
                description: s.description,
                impact_estimate: s.impact_estimate,
                is_done: false,
                sort_order: s.sort_order ?? i,
            }))

            if (stepInserts.length > 0) {
                const { error: stepErr } = await supabase
                    .from('financial_freedom_action_steps')
                    .insert(stepInserts)

                if (stepErr) {
                    console.error('[ff] action steps insert failed:', stepErr)
                    // Gak blocking - insight udah masuk
                }
            }

            toast.success('Analisis di-refresh')
            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    // ============================================================
    // 6. TOGGLE ACTION STEP
    // ============================================================
    const toggleActionStep = useCallback(
        async (stepId: string, isDone: boolean): Promise<{ success: boolean }> => {
            const { error } = await supabase
                .from('financial_freedom_action_steps')
                .update({
                    is_done: isDone,
                    done_at: isDone ? new Date().toISOString() : null,
                })
                .eq('id', stepId)

            if (error) {
                console.error('[ff] toggle step failed:', error)
                return { success: false }
            }

            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    // ============================================================
    // 7. MILESTONE CHECK + NOTIF
    // ============================================================
    const checkAndNotifyMilestones = useCallback(
        async (
            profileId: string,
            netWorth: number,
            targets: MilestoneTarget[]
        ): Promise<{ newlyAchieved: MilestoneTarget[] }> => {
            if (targets.length === 0) return { newlyAchieved: [] }

            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) return { newlyAchieved: [] }

            // 1. Fetch existing milestones (yang udah pernah tercatat)
            const { data: existing } = await supabase
                .from('financial_freedom_milestones')
                .select('id, milestone_type, achieved_at')
                .eq('profile_id', profileId)

            const existingMap = new Map(
                (existing || []).map((m) => [m.milestone_type, m])
            )

            // 2. Upsert semua target (idempotent - biar kalau FI number berubah, target_amount sync)
            const upserts = targets.map((t) => {
                const prev = existingMap.get(t.type)
                return {
                    user_id: user.id,
                    profile_id: profileId,
                    milestone_type: t.type,
                    milestone_label: t.label,
                    target_amount: t.target_amount,
                    achieved_at:
                        prev?.achieved_at ??
                        (netWorth >= t.target_amount ? new Date().toISOString() : null),
                    is_notified: prev?.achieved_at ? true : false, // kalau udah pernah, tandai notified
                }
            })

            await supabase
                .from('financial_freedom_milestones')
                .upsert(upserts, { onConflict: 'profile_id,milestone_type' })

            // 3. Cari yang BARU tercapai
            const newlyAchieved = targets.filter((t) => {
                const prev = existingMap.get(t.type)
                const wasAchieved = !!prev?.achieved_at
                const isNowAchieved = netWorth >= t.target_amount
                return !wasAchieved && isNowAchieved
            })

            // 4. Insert notif untuk yang baru
            if (newlyAchieved.length > 0) {
                const notifInserts = newlyAchieved.map((t) => ({
                    user_id: user.id,
                    type: 'milestone_achieved' as const,
                    title: `${t.emoji} ${t.label} tercapai!`,
                    body: `Net worth lu udah lewat ${formatRupiah(t.target_amount)}. ${t.description}`,
                    link: '/financial-freedom',
                    icon: 'crown',
                    dedup_key: `ff_milestone:${profileId}:${t.type}`,
                }))

                const { error: notifErr } = await supabase
                    .from('notifications')
                    .insert(notifInserts)

                // 23505 = duplikat dedup_key, aman ignore
                if (notifErr && notifErr.code !== '23505') {
                    console.error('[ff] notif insert failed:', notifErr)
                }
            }

            return { newlyAchieved }
        },
        [supabase]
    )

    const dismissFiAchieved = useCallback(
        async (profileId: string): Promise<{ success: boolean }> => {
            const { error } = await supabase
                .from('financial_freedom_settings')
                .update({ fi_achieved_dismissed_at: new Date().toISOString() })
                .eq('profile_id', profileId)

            if (error) {
                console.error('[ff] dismiss achieved failed:', error)
                return { success: false }
            }

            router.refresh()
            return { success: true }
        },
        [supabase, router]
    )

    return {
        ensureSettings,
        updateSettings,
        completeOnboarding,
        dismissFiAchieved,
        saveSnapshot,
        saveAiAnalysis,
        toggleActionStep,
        checkAndNotifyMilestones,
    }
}