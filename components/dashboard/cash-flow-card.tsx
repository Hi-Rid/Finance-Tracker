'use client'

import Link from 'next/link'
import { TrendingUp, ArrowRight } from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { CHART_COLORS } from '@/lib/colors'
import { cn } from '@/lib/utils'

type CashFlowCardProps = {
    value: number
    trend: number
    sparklineData: number[]
    sparklineLabels?: string[]
}

export function CashFlowCard({
    value,
    trend,
    sparklineData,
    sparklineLabels,
}: CashFlowCardProps) {
    // LOGIC SAMA PERSIS KAYAK INVESTMENT CARD
    const data =
        sparklineData.length > 0 && sparklineData[0] !== 0
            ? [0, ...sparklineData]
            : sparklineData

    const labels =
        data.length !== sparklineData.length
            ? ['Awal', ...(sparklineLabels || [])]
            : sparklineLabels || []

    const finalData = data.length < 2 ? [0, 0] : data
    const finalLabels = labels.length < 2 ? ['Awal', 'Sekarang'] : labels

    return (
        <StatCard
            title="Cash Flow"
            value={value}
            icon={<TrendingUp className="w-5 h-5" />}
            trend={trend}
            trendLabel="dari bulan lalu"
            accentColor={CHART_COLORS.success}
            sparklineData={finalData}
            sparklineLabels={finalLabels}
            topRightSlot={
                <Link
                    href="/cash-flow"
                    className={cn(
                        'group/link flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        'text-brand hover:bg-brand/5 dark:hover:bg-brand/10'
                    )}
                >
                    <span className="hidden sm:inline">Lihat History</span>
                    <span className="sm:hidden">History</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
                </Link>
            }
        />
    )
}