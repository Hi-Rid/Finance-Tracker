'use client'

import { useState } from 'react'
import {
  Wallet,
  Plus,
  MoreVertical,
  Edit3,
  Archive,
  ArrowRightLeft,
  Calculator,
  Coins,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

  // ============ Dialog Title ============
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

  // ============ Dialog Content ============
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
          {accounts.map((account) => (
            <Card key={account.id} className="group relative overflow-hidden">
              <CardContent className="pt-6">
                {/* Header: icon + name + actions */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                      <Wallet className="w-5 h-5 text-brand" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{account.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {account.type}
                      </p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 -mt-1 -mr-1"
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

                {/* Balance + Top-up button */}
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-2xl font-bold tabular-nums mb-2 truncate">
                      {formatRupiah(Number(account.current_balance))}
                    </p>
                    {account.note && (
                      <Badge variant="default" className="text-[10px]">
                        {account.note}
                      </Badge>
                    )}
                  </div>

                  {/* Quick action: Top-up */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDialog({ type: 'topup', account })}
                    className="shrink-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Top Up
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
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
        /* Desktop Dialog */
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