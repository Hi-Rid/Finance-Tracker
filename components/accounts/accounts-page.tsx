'use client'

import { useState } from 'react'
import { Wallet, HandCoins } from 'lucide-react'
import { AccountsList } from './accounts-list'
import { DebtsTab } from '@/components/debts/debts-tab'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Account = Database['public']['Tables']['accounts']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Debt = Database['public']['Tables']['debts']['Row']

type Props = {
    accounts: Account[]
    incomeCategories: Category[]
    accountHasTx: Record<string, boolean>
    debts: Debt[]
    profileId: string
}

type Tab = 'accounts' | 'debts'

export function AccountsPage({
    accounts,
    incomeCategories,
    accountHasTx,
    debts,
    profileId,
}: Props) {
    const [tab, setTab] = useState<Tab>('accounts')

    const activeDebtCount = debts.filter(
        (d) => d.status === 'active' || d.status === 'overdue'
    ).length

    return (
        <div className="space-y-3 md:space-y-4">
            {/* TABS */}
            <div className="flex items-center gap-1 p-0.5 md:p-1 rounded-lg md:rounded-xl bg-slate-100 dark:bg-white/5 w-fit">
                <button
                    type="button"
                    onClick={() => setTab('accounts')}
                    className={cn(
                        'flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg text-[11px] md:text-xs font-semibold transition-all cursor-pointer',
                        tab === 'accounts'
                            ? 'bg-white dark:bg-white/10 text-brand shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    )}
                >
                    <Wallet className="w-3.5 h-3.5" />
                    Akun
                    <span
                        className={cn(
                            'text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full leading-none',
                            tab === 'accounts'
                                ? 'bg-brand/10 text-brand'
                                : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                        )}
                    >
                        {accounts.length}
                    </span>
                </button>
                <button
                    type="button"
                    onClick={() => setTab('debts')}
                    className={cn(
                        'flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg text-[11px] md:text-xs font-semibold transition-all cursor-pointer',
                        tab === 'debts'
                            ? 'bg-white dark:bg-white/10 text-brand shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    )}
                >
                    <HandCoins className="w-3.5 h-3.5" />
                    Utang & Piutang
                    <span
                        className={cn(
                            'text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full leading-none',
                            tab === 'debts'
                                ? 'bg-brand/10 text-brand'
                                : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                        )}
                    >
                        {activeDebtCount}
                    </span>
                </button>
            </div>

            {/* CONTENT */}
            {tab === 'accounts' ? (
                <AccountsList
                    accounts={accounts}
                    profileId={profileId}
                    incomeCategories={incomeCategories}
                    accountHasTx={accountHasTx}
                />
            ) : (
                <DebtsTab
                    debts={debts}
                    accounts={accounts}
                    profileId={profileId}
                />
            )}
        </div>
    )
}