'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AccountForm } from './account-form'
import { TopupModal } from './topup-modal'
import { TransferModal } from './transfer-modal'
import { AdjustmentModal } from './adjustment-modal'
import { useAccounts } from '@/lib/hooks/use-accounts'
import { formatRupiah } from '@/lib/normalize'
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

export function AccountsList({
  accounts,
  profileId,
  incomeCategories,
  accountHasTx,
}: AccountsListProps) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [dialog, setDialog] = useState<DialogState>({ type: 'none' })
  const { deleteAccount } = useAccounts()

  const open = dialog.type !== 'none'
  const closeDialog = () => setDialog({ type: 'none' })

  const totalBalance = accounts.reduce(
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Total Saldo
          </p>
          <p className="text-2xl font-bold tabular-nums">
            {formatRupiah(totalBalance)}
          </p>
        </div>
        <Button onClick={openCreate} variant="primary">
          <Plus className="w-4 h-4" />
          Tambah Akun
        </Button>
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => {
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

                {/* Accent bar kiri — solid */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ backgroundColor: accent }}
                />

                <div className="relative p-5 pl-6">
                  {/* Header: icon + name + dropdown */}
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Icon container solid tint */}
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${accent}18` }}
                      >
                        <AccountIcon
                          className="w-5 h-5"
                          style={{ color: accent }}
                          strokeWidth={2.4}
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold truncate text-base leading-tight mb-1">
                          {account.name}
                        </p>
                        <span
                          className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full"
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
                          className="shrink-0 -mt-1 -mr-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                        >
                          <MoreVertical className="w-4 h-4" />
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
                  <div className="mb-5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Saldo
                    </p>
                    <p className="text-3xl font-bold tabular-nums tracking-tight truncate">
                      {formatRupiah(Number(account.current_balance))}
                    </p>
                    {account.note && (
                      <p className="text-[11px] text-muted-foreground mt-1.5 truncate">
                        {account.note}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDialog({ type: 'topup', account })}
                      className="flex-1 h-9 font-semibold"
                      style={{
                        borderColor: `${accent}40`,
                        color: accent,
                        backgroundColor: `${accent}08`,
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Top Up
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setDialog({ type: 'transfer', account })}
                      className="shrink-0 h-9 w-9 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      title="Transfer"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Mobile Sheet */}
      {isMobile ? (
        <Sheet open={open} onOpenChange={(o) => !o && closeDialog()}>
          <SheetContent
            side="bottom"
            className="max-h-[92vh] overflow-y-auto"
          >
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