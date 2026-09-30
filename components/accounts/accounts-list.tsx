'use client'

import { useState, useMemo } from 'react'
import {
  Wallet,
  Landmark,
  Smartphone,
  TrendingUp,
  CreditCard,
  Plus,
  MoreVertical,
  Edit3,
  Archive,
  ArrowRightLeft,
  Calculator,
  SlidersHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Amount } from '@/components/ui/amount'
import { EmptyState } from '@/components/ui/empty-state'
import { HideAmountsButton } from '@/components/shared/hide-amounts-button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AccountForm } from './account-form'
import { TopupModal } from './topup-modal'
import { TransferModal } from './transfer-modal'
import { AdjustmentModal } from './adjustment-modal'
import { useAccounts } from '@/lib/hooks/use-accounts'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Account = Database['public']['Tables']['accounts']['Row']
type Category = Database['public']['Tables']['categories']['Row']

type AccountsListProps = {
  accounts: Account[]
  profileId: string
  incomeCategories: Category[]
  accountHasTx: Record<string, boolean>
}

type DialogState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; account: Account }
  | { type: 'topup'; account: Account }
  | { type: 'transfer'; account: Account }
  | { type: 'adjust'; account: Account }

type FilterType =
  | 'all'
  | 'bank'
  | 'ewallet'
  | 'investment'
  | 'cash'
  | 'paylater'
  | 'credit'
  | 'other'

const TYPE_FILTERS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'bank', label: 'Bank' },
  { value: 'ewallet', label: 'E-Wallet' },
  { value: 'investment', label: 'Investasi' },
  { value: 'cash', label: 'Cash' },
  { value: 'paylater', label: 'Paylater' },
  { value: 'credit', label: 'Credit' },
  { value: 'other', label: 'Lainnya' },
]

function getAccountAccent(type: string): string {
  switch (type) {
    case 'bank':
      return '#334DAF'
    case 'ewallet':
      return '#10b981'
    case 'investment':
      return '#eab308'
    case 'credit':
      return '#f59e0b'
    case 'paylater':
      return '#ef4444'
    case 'cash':
      return '#64748b'
    default:
      return '#64748b'
  }
}

function getAccountIcon(type: string) {
  switch (type) {
    case 'bank':
      return Landmark
    case 'ewallet':
      return Smartphone
    case 'investment':
      return TrendingUp
    case 'credit':
      return CreditCard
    case 'paylater':
      return CreditCard
    case 'cash':
      return Wallet
    default:
      return Wallet
  }
}

function getTypeLabel(type: string): string {
  const map: Record<string, string> = {
    cash: 'Cash',
    bank: 'Bank',
    ewallet: 'E-Wallet',
    credit: 'Credit Card',
    paylater: 'Paylater',
    investment: 'Investment',
    other: 'Lainnya',
  }
  return map[type] || type
}

function getFilterLabel(filter: FilterType): string {
  if (filter === 'all') return 'Semua Tipe'
  const found = TYPE_FILTERS.find((f) => f.value === filter)
  return found?.label || 'Semua Tipe'
}

export function AccountsList({
  accounts,
  profileId,
  incomeCategories,
  accountHasTx,
}: AccountsListProps) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [dialog, setDialog] = useState<DialogState>({ type: 'none' })
  const [filter, setFilter] = useState<FilterType>('all')
  const { deleteAccount } = useAccounts()

  const open = dialog.type !== 'none'
  const closeDialog = () => setDialog({ type: 'none' })

  // Available filters - cuma tampil tipe yang ada isinya
  const availableFilters = useMemo(() => {
    return TYPE_FILTERS.filter((f) => {
      if (f.value === 'all') return true
      return accounts.some((a) => a.type === f.value)
    })
  }, [accounts])

  const filteredAccounts = useMemo(() => {
    if (filter === 'all') return accounts
    return accounts.filter((a) => a.type === filter)
  }, [accounts, filter])

  function getCount(type: FilterType): number {
    if (type === 'all') return accounts.length
    return accounts.filter((a) => a.type === type).length
  }

  const totalBalance = filteredAccounts.reduce(
    (sum, a) => sum + Number(a.current_balance),
    0
  )

  function openCreate() {
    setDialog({ type: 'create' })
  }

  const title =
    dialog.type === 'create'
      ? 'Tambah Akun'
      : dialog.type === 'edit'
        ? 'Edit Akun'
        : dialog.type === 'topup'
          ? 'Tambah Saldo'
          : dialog.type === 'transfer'
            ? 'Transfer'
            : dialog.type === 'adjust'
              ? 'Koreksi Saldo'
              : ''

  const description =
    dialog.type === 'create'
      ? 'Bikin akun baru.'
      : dialog.type === 'edit'
        ? 'Update detail akun.'
        : dialog.type === 'topup'
          ? 'Tambah saldo dari sumber luar.'
          : dialog.type === 'transfer'
            ? 'Pindah saldo antar akun.'
            : dialog.type === 'adjust'
              ? 'Sesuaikan saldo dengan kondisi real.'
              : ''

  const content = (
    <>
      {dialog.type === 'create' && (
        <AccountForm
          profileId={profileId}
          onSuccess={closeDialog}
          onCancel={closeDialog}
        />
      )}
      {dialog.type === 'edit' && (
        <AccountForm
          profileId={profileId}
          account={dialog.account}
          hasTransactions={!!accountHasTx[dialog.account.id]}
          onSuccess={closeDialog}
          onCancel={closeDialog}
        />
      )}
      {dialog.type === 'topup' && (
        <TopupModal
          account={dialog.account}
          profileId={profileId}
          incomeCategories={incomeCategories}
          onSuccess={closeDialog}
          onCancel={closeDialog}
        />
      )}
      {dialog.type === 'transfer' && (
        <TransferModal
          sourceAccount={dialog.account}
          allAccounts={accounts}
          profileId={profileId}
          onSuccess={closeDialog}
          onCancel={closeDialog}
        />
      )}
      {dialog.type === 'adjust' && (
        <AdjustmentModal
          account={dialog.account}
          profileId={profileId}
          onSuccess={closeDialog}
          onCancel={closeDialog}
        />
      )}
    </>
  )

  return (
    <>
      {/* Header: Total + actions */}
      <div className="flex items-end justify-between gap-3 mb-4 flex-wrap">
        <div className="min-w-0">
          <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider mb-0.5 md:mb-1">
            Total {filter === 'all' ? 'Saldo' : getFilterLabel(filter)}
          </p>
          <Amount
            value={totalBalance}
            className="text-lg md:text-2xl font-bold truncate block leading-none"
          />
        </div>

        <div className="flex items-end gap-1.5 shrink-0 pb-0.5 flex-wrap">
          <HideAmountsButton size="icon-sm" />

          {/* Filter - desktop: chips, mobile: dropdown icon */}
          {accounts.length > 0 && (
            <>
              {/* Desktop - chip buttons */}
              <div className="hidden md:flex items-center gap-1">
                {availableFilters.map((f) => {
                  const count = getCount(f.value)
                  const isActive = filter === f.value
                  return (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setFilter(f.value)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer',
                        isActive
                          ? 'bg-brand text-white shadow-sm shadow-brand/20'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                      )}
                    >
                      <span>{f.label}</span>
                      <span
                        className={cn(
                          'text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full leading-none',
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Mobile - dropdown icon */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="h-8 w-8 relative"
                      aria-label="Filter tipe akun"
                      title="Filter tipe akun"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      {filter !== 'all' && (
                        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-brand text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-background tabular-nums">
                          {getCount(filter)}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[180px]">
                    <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Filter Tipe
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {availableFilters.map((f) => {
                      const count = getCount(f.value)
                      const isActive = filter === f.value
                      return (
                        <DropdownMenuItem
                          key={f.value}
                          onSelect={() => setFilter(f.value)}
                          className={cn(
                            'whitespace-nowrap flex items-center justify-between gap-3',
                            isActive && 'bg-brand/5 dark:bg-brand/10'
                          )}
                        >
                          <span
                            className={cn(
                              'text-sm',
                              isActive && 'font-semibold text-brand'
                            )}
                          >
                            {f.label}
                          </span>
                          <span
                            className={cn(
                              'text-xs tabular-nums font-medium',
                              isActive
                                ? 'text-brand'
                                : 'text-slate-500 dark:text-slate-400'
                            )}
                          >
                            {count}
                          </span>
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}

          <Button onClick={openCreate} variant="primary" size="sm" className="h-8">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah</span>
          </Button>
        </div>
      </div>

      {/* List */}
      {accounts.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Wallet}
              title="Belum ada akun"
              description="Tambahkan akun pertama lu (BCA, Jago, GoPay, dll)."
              action={
                <Button onClick={openCreate} variant="primary">
                  <Plus className="w-4 h-4" />
                  Tambah Akun
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : filteredAccounts.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Wallet}
              title="Gak ada akun di kategori ini"
              description="Coba pilih filter lain."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-4">
          {filteredAccounts.map((account) => {
            const accent = getAccountAccent(account.type)
            const AccountIcon = getAccountIcon(account.type)

            return (
              <div
                key={account.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-card transition-all duration-300 hover:border-transparent"
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    boxShadow: `0 0 0 1.5px ${accent}40, 0 12px 32px -8px ${accent}30`,
                  }}
                />

                {/* Accent bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ backgroundColor: accent }}
                />

                <div className="relative p-3 md:p-5 pl-3.5 md:pl-6">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-1 mb-2.5 md:mb-5">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                      <div
                        className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${accent}18` }}
                      >
                        <AccountIcon
                          className="w-3.5 h-3.5 md:w-5 md:h-5"
                          style={{ color: accent }}
                          strokeWidth={2.4}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-bold truncate text-xs md:text-base leading-tight">
                          {account.name}
                        </p>
                        <span
                          className="inline-flex items-center text-[9px] md:text-[10px] font-semibold px-1.5 md:px-2 py-0.5 rounded-full mt-0.5 truncate"
                          style={{
                            backgroundColor: `${accent}12`,
                            color: accent,
                          }}
                        >
                          {getTypeLabel(account.type)}
                        </span>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0 -mt-1 -mr-1 h-6 w-6 md:h-8 md:w-8 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                        >
                          <MoreVertical className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[180px]">
                        <DropdownMenuItem
                          onSelect={() =>
                            setDialog({ type: 'transfer', account })
                          }
                          className="whitespace-nowrap"
                        >
                          <ArrowRightLeft className="w-4 h-4 mr-2 shrink-0" />
                          Transfer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            setDialog({ type: 'adjust', account })
                          }
                          className="whitespace-nowrap"
                        >
                          <Calculator className="w-4 h-4 mr-2 shrink-0" />
                          Koreksi Saldo
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => setDialog({ type: 'edit', account })}
                          className="whitespace-nowrap"
                        >
                          <Edit3 className="w-4 h-4 mr-2 shrink-0" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => deleteAccount(account.id)}
                          className="text-red-600 focus:text-red-600 whitespace-nowrap"
                        >
                          <Archive className="w-4 h-4 mr-2 shrink-0" />
                          Arsipkan
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Balance */}
                  <div className="mb-2.5 md:mb-5">
                    <p className="text-[9px] md:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 md:mb-1.5">
                      Saldo
                    </p>
                    <Amount
                      value={Number(account.current_balance)}
                      className="text-sm md:text-3xl font-bold tracking-tight truncate block"
                    />
                    {account.note && (
                      <p className="hidden md:block text-[11px] text-muted-foreground mt-1.5 truncate">
                        {account.note}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDialog({ type: 'topup', account })}
                      className="flex-1 h-8 md:h-9 font-semibold text-[11px] md:text-xs"
                      style={{
                        borderColor: `${accent}40`,
                        color: accent,
                        backgroundColor: `${accent}08`,
                      }}
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      Top Up
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setDialog({ type: 'transfer', account })}
                      className="shrink-0 h-8 w-8 md:h-9 md:w-9 text-slate-500 dark:text-slate-400"
                      title="Transfer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Mobile Sheet / Desktop Dialog */}
      {isMobile ? (
        <Sheet open={open} onOpenChange={(o) => !o && closeDialog()}>
          <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>{description}</SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-6 pt-2">{content}</div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={(o) => !o && closeDialog()}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            {content}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}