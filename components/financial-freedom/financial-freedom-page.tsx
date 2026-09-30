'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Crown } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-wrapper'
import { resolveFiParams } from '@/lib/utils/financial-freedom'
import { useFinancialFreedom } from '@/lib/hooks/use-financial-freedom'
import { FiLiteracyModal } from './literacy/fi-literacy-modal'
import { FiAchievedModal } from './fi-achieved-modal'
import { FiHero } from './fi-hero'
import { FiParameters } from './fi-parameters'
import { FiGrowthChart } from './fi-growth-chart'
import { FiScenarioSimulator } from './fi-scenario-simulator'
import { FiAiAdvisor } from './fi-ai-advisor'
import { FiMilestones } from './fi-milestones'
import { FiActionPlan } from './fi-action-plan'
import type {
    FiSettings,
    FiSnapshot,
    FiInsight,
    FiMilestoneRow,
    FiActionStep,
    FiServerData,
} from '@/lib/financial-freedom/types'
import type { FiType } from '@/lib/validators/financial-freedom'

type Props = {
    profileId: string
    profileName: string
    settings: FiSettings
    serverData: FiServerData
    snapshots: FiSnapshot[]
    latestInsight: FiInsight | null
    actionSteps: FiActionStep[]
    milestones: FiMilestoneRow[]
}

export function FinancialFreedomPage({
    profileId,
    profileName,
    settings,
    serverData,
    snapshots,
    latestInsight,
    actionSteps,
    milestones,
}: Props) {
    const router = useRouter()
    const { completeOnboarding, dismissFiAchieved } = useFinancialFreedom()
    const [, startTransition] = useTransition()

    const [showLiteracy, setShowLiteracy] = useState(
        !settings.onboarding_completed
    )

    const monthlyExpense =
        settings.monthly_expense_override !== null
            ? Number(settings.monthly_expense_override)
            : serverData.avgExpense

    const monthlyIncome =
        settings.monthly_income_override !== null
            ? Number(settings.monthly_income_override)
            : serverData.income.value

    const resolved = useMemo(
        () =>
            resolveFiParams({
                monthlyExpense,
                monthlyIncome,
                fiType: settings.fi_type as FiType,
                fiMultiplier: Number(settings.fi_multiplier),
                expectedReturnRate: Number(settings.expected_return_rate),
                inflationRate: Number(settings.inflation_rate),
                currentAge: settings.current_age,
                targetRetireAge: settings.target_retire_age,
                currentNetWorth: serverData.netWorth.total,
            }),
        [monthlyExpense, monthlyIncome, settings, serverData.netWorth.total]
    )

    // Show modal FI achieved kalau progress >= 100 & belum pernah dismiss
    const isAchieved = resolved.fiProgress >= 100 && resolved.fiNumber > 0
    const hasDismissed = !!settings.fi_achieved_dismissed_at
    const [showAchieved, setShowAchieved] = useState(
        settings.onboarding_completed && isAchieved && !hasDismissed
    )

    // Milestone check fallback (realtime udah handle via trigger, ini buat safety)
    useEffect(() => {
        if (showLiteracy || showAchieved) return
        if (resolved.allMilestones.length === 0) return
        if (resolved.fiNumber <= 0) return
    }, [
        profileId,
        resolved.currentNetWorth,
        resolved.fiNumber,
        resolved.allMilestones.length,
        showLiteracy,
        showAchieved,
    ])

    async function handleOnboardingComplete() {
        const result = await completeOnboarding(profileId)
        if (result.success) {
            setShowLiteracy(false)
            // Setelah onboarding, cek apakah langsung achieved
            if (isAchieved && !hasDismissed) {
                setShowAchieved(true)
            }
        }
    }

    async function handleAchievedDismiss() {
        const result = await dismissFiAchieved(profileId)
        if (result.success) {
            setShowAchieved(false)
        }
    }

    const blockingModal = showLiteracy || showAchieved

    return (
        <>
            {showLiteracy && (
                <FiLiteracyModal onComplete={handleOnboardingComplete} />
            )}

            {showAchieved && !showLiteracy && (
                <FiAchievedModal
                    resolved={resolved}
                    onDismiss={handleAchievedDismiss}
                />
            )}

            <div
                className={blockingModal ? 'pointer-events-none select-none' : ''}
                aria-hidden={blockingModal}
            >
                <PageHeader
                    title="Financial Freedom"
                    description="Jalan lu menuju merdeka finansial"
                />

                <div className="space-y-4 md:space-y-5">
                    <FiHero
                        resolved={resolved}
                        profileName={profileName}
                        serverData={serverData}
                    />

                    <FiParameters
                        profileId={profileId}
                        settings={settings}
                        serverData={serverData}
                    />

                    <FiGrowthChart resolved={resolved} snapshots={snapshots} />

                    <FiScenarioSimulator resolved={resolved} />

                    <FiAiAdvisor
                        profileId={profileId}
                        latestInsight={latestInsight}
                        isFiAchieved={isAchieved}
                    />

                    <FiMilestones resolved={resolved} milestones={milestones} />

                    <FiActionPlan steps={actionSteps} />
                </div>
            </div>
        </>
    )
}