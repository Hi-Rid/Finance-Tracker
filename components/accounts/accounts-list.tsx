'use client'

import { useState } from 'react'
import { Wallet, Plus, MoreVertical, Edit3, Archive } from 'lucide-react'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AccountForm } from './account-form'
import { useAccounts } from '@/lib/hooks/use-accounts'
import { formatRupiah } from '@/lib/normalize'
import type { Database } from '@/types/database'

type Account = Database['public']['Tables']['accounts']['Row']

type AccountsListProps = {
  accounts: Account[]
  profileId: string
}

export function AccountsList({ accounts, profileId }: AccountsListProps) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const { deleteAccount } = useAccounts()

  function openCreate() {
    setEditing(null)
    setOpen(true)
  }

  function openEdit(account: Account) {
    setEditing(account)
    setOpen(true)
  }

  function closeForm() {
    setOpen(false)
    setEditing(null)
  }

  const totalBalance = accounts.reduce(
    (sum, a) => sum + Number(a.current_balance),
    0
  )

  return (
    <>
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
            <Card key={account.id} className="group">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                      <p className="font-semibold">{account.name}</p>
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
                        className="opacity-100"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(account)}>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteAccount(account.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        Arsipkan
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <p className="text-2xl font-bold tabular-nums mb-2">
                  {formatRupiah(Number(account.current_balance))}
                </p>

                {account.note && (
                  <Badge variant="default" className="text-[10px]">
                    {account.note}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Sheet mobile */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="md:hidden max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? 'Edit Akun' : 'Tambah Akun'}</SheetTitle>
            <SheetDescription>
              {editing ? 'Update detail akun.' : 'Bikin akun baru.'}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <AccountForm
              profileId={profileId}
              account={editing}
              onSuccess={closeForm}
              onCancel={closeForm}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog desktop */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="hidden md:block sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Akun' : 'Tambah Akun'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update detail akun.' : 'Bikin akun baru.'}
            </DialogDescription>
          </DialogHeader>
          <AccountForm
            profileId={profileId}
            account={editing}
            onSuccess={closeForm}
            onCancel={closeForm}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}