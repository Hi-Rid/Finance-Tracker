'use client'

import { useState, useMemo } from 'react'
import { Plus, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SummaryBar } from './summary-bar'
import { TypeFilter } from './type-filter'
import { HoldingsTable } from './holdings-table'
import { InvestmentDialogs, type DialogState } from './investment-dialogs'
import { EmptyState } from '@/components/ui/empty-state'
import type { PortfolioData, AssetType } from '@/lib/investments/types'
import type { Database } from '@/types/database'

type FilterType = 'all' | AssetType
type Account = Database['public']['Tables']['accounts']['Row']

type PortfolioPageProps = {
    data: PortfolioData
    profileId: string
    accounts: Account[]
}

export function PortfolioPage({ data, profileId, accounts }: PortfolioPageProps) {
    const [filter, setFilter] = useState<FilterType>('all')
    const [dialog, setDialog] = useState<DialogState>({ type: 'none' })

    const filteredPositions = useMemo(() => {
        if (filter === 'all') return data.positions
        return data.positions.filter((p) => p.asset.type === filter)
    }, [data.positions, filter])

    function closeDialog() {
        setDialog({ type: 'none' })
    }

    const hasPositions = data.positions.length > 0
    const openCreate = () => setDialog({ type: 'create' })

    return (
        <>
            <div className="space-y-4 md:space-y-6">
                <SummaryBar summary={data.summary} />

                {/* Toolbar: filter + tombol sejajar (semua breakpoint) */}
                {hasPositions && (
                    <div className="flex items-center justify-between gap-2 md:gap-3">
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <TypeFilter
                                positions={data.positions}
                                totalMarketValue={data.summary.total_market_value}
                                active={filter}
                                onChange={setFilter}
                            />
                        </div>

                        <Button
                            variant="primary"
                            size="sm"
                            onClick={openCreate}
                            className="shrink-0 h-9 md:h-9"
                        >
                            <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span className="hidden sm:inline">Tambah Investasi</span>
                            <span className="sm:hidden">Tambah</span>
                        </Button>
                    </div>
                )}

                {!hasPositions ? (
                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-card p-12">
                        <EmptyState
                            icon={TrendingUp}
                            title="Belum ada investasi"
                            description="Mulai catat portfolio saham, crypto, atau reksadana lu."
                            action={
                                <Button variant="primary" onClick={openCreate}>
                                    <Plus className="w-4 h-4" />
                                    Tambah Investasi
                                </Button>
                            }
                        />
                    </div>
                ) : (
                    <HoldingsTable
                        positions={filteredPositions}
                        onSell={(p) => setDialog({ type: 'sell', position: p })}
                        onDividend={(p) => setDialog({ type: 'dividend', position: p })}
                        onBuyMore={(p) => setDialog({ type: 'buy-more', position: p })}
                    />
                )}
            </div>

            <InvestmentDialogs
                state={dialog}
                onClose={closeDialog}
                profileId={profileId}
                accounts={accounts}
            />
        </>
    )
}