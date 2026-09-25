'use client'

import Link from 'next/link'
import { TrendingUp, ArrowRight } from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { CHART_COLORS } from '@/lib/colors'
import { cn } from '@/lib/utils'

type InvestmentCardProps = {
    value: number
    trend: number
    sparklineData: number[]
    sparklineLabels?: string[]
}

export function InvestmentCard({
    value,
    trend,
    sparklineData,
    sparklineLabels,
}: InvestmentCardProps) {
    // Jangan trim leading zeros — kita mau liat growth dari 0 → sekarang
    // Cuma pastiin minimal ada 2 titik biar chart render
    let displayData = sparklineData
    let displayLabels = sparklineLabels || []

    if (displayData.length < 2) {
        const v = displayData[0] || 0
        displayData = [0, v]
        displayLabels = ['Awal', 'Sekarang']
    }

    return (
        <StatCard
            title="Investasi"
            value={value}
            icon={<TrendingUp className="w-5 h-5" />}
            trend={trend}
            trendLabel="pertumbuhan modal"
            accentColor={CHART_COLORS.warning}
            sparklineData={displayData}
            sparklineLabels={displayLabels}
            sparklineYAxisPadding={0.15}
            topRightSlot={
                <Link
                    href="/investments"
                    className={cn(
                        'group/link flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        'text-brand hover:bg-brand/5 dark:hover:bg-brand/10'
                    )}
                >
                    <span className="hidden sm:inline">Lihat Portfolio</span>
                    <span className="sm:hidden">Portfolio</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
                </Link>
            }
        />
    )
}