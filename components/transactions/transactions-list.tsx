'use client'

import { useState, useMemo } from 'react'
import {
  Plus,
  Receipt,
  MoreVertical,
  Edit3,
  Trash2,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TransactionForm } from './transaction-form'
import { useTransactions } from '@/lib/hooks/use-transactions'
import { formatRupiah } from '@/lib/normalize'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Account = Database['public']['Tables']['accounts']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Transaction = Database['public']['Tables']['transactions']['Row']

type TransactionsListProps = {
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
  profileId: string
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Hari ini'
  if (date.toDateString() === yesterday.toDateString()) return 'Kemarin'

  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function groupByDate(transactions: Transaction[]) {
  const groups: Record<string, Transaction[]> = {}
  transactions.forEach((t) => {
    const key = new Date(t.date).toDateString()
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  })
  return groups
}

export function TransactionsList({
  transactions,
  accounts,
  categories,
  profileId,
}: TransactionsListProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterAccount, setFilterAccount] = useState<string>('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const { deleteTransaction } = useTransactions()

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase()))
        return false
      if (filterType !== 'all' && t.type !== filterType) return false
      if (filterAccount !== 'all' && t.account_id !== filterAccount) return false
      return true
    })
  }, [transactions, search, filterType, filterAccount])

  const grouped = useMemo(() => groupByDate(filtered), [filtered])
  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  const totalIncome = filtered
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount_idr), 0)
  const totalExpense = filtered
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount_idr), 0)

  const hasActiveFilter = filterType !== 'all' || filterAccount !== 'all'

  function openCreate() {
    setEditing(null)
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSheetOpen(true)
    } else {
      setDialogOpen(true)
    }
  }

  function openEdit(t: Transaction) {
    setEditing(t)
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSheetOpen(true)
    } else {
      setDialogOpen(true)
    }
  }

  function closeForm() {
    setSheetOpen(false)
    setDialogOpen(false)
    setEditing(null)
  }

  function resetFilters() {
    setFilterType('all')
    setFilterAccount('all')
  }

  return (
    <>
      {/* Summary + Add */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-5">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
              Income
            </p>
            <p className="text-base font-bold tabular-nums text-emerald-600">
              +{formatRupiah(totalIncome)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
              Expense
            </p>
            <p className="text-base font-bold tabular-nums text-red-600">
              -{formatRupiah(totalExpense)}
            </p>
          </div>
        </div>
        <Button onClick={openCreate} variant="primary" size="sm">
          <Plus className="w-4 h-4" />
          Tambah
        </Button>
      </div>

      {/* Compact search + filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Cari transaksi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9 h-10"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mobile: filter button + sheet */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setFilterOpen(true)}
          className="md:hidden relative shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {hasActiveFilter && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand ring-2 ring-background" />
          )}
        </Button>

        {/* Desktop: 2 dropdown langsung */}
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="hidden md:flex md:w-40 h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterAccount} onValueChange={setFilterAccount}>
          <SelectTrigger className="hidden md:flex md:w-40 h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Akun</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active filter chips */}
      {hasActiveFilter && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {filterType !== 'all' && (
            <Badge variant="default" className="gap-1">
              {filterType === 'income' ? 'Income' : filterType === 'expense' ? 'Expense' : 'Transfer'}
              <button
                onClick={() => setFilterType('all')}
                className="cursor-pointer hover:opacity-70"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filterAccount !== 'all' && (
            <Badge variant="default" className="gap-1">
              {accounts.find((a) => a.id === filterAccount)?.name}
              <button
                onClick={() => setFilterAccount('all')}
                className="cursor-pointer hover:opacity-70"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Receipt}
              title={search || hasActiveFilter ? 'Gak ada hasil' : 'Belum ada transaksi'}
              description={
                search || hasActiveFilter
                  ? 'Coba ubah filter atau search keyword.'
                  : 'Mulai catat transaksi pertama lu.'
              }
              action={
                !search && !hasActiveFilter ? (
                  <Button onClick={openCreate} variant="primary">
                    <Plus className="w-4 h-4" />
                    Tambah Transaksi
                  </Button>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {sortedDates.map((dateKey) => {
            const items = grouped[dateKey]
            const dayTotal = items.reduce((sum, t) => {
              if (t.type === 'income') return sum + Number(t.amount_idr)
              if (t.type === 'expense') return sum - Number(t.amount_idr)
              return sum
            }, 0)

            return (
              <div key={dateKey}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {formatDate(items[0].date)}
                  </p>
                  <p
                    className={cn(
                      'text-xs font-semibold tabular-nums',
                      dayTotal >= 0 ? 'text-emerald-600' : 'text-red-600'
                    )}
                  >
                    {dayTotal >= 0 ? '+' : ''}
                    {formatRupiah(Math.abs(dayTotal))}
                  </p>
                </div>

                <Card>
                  <CardContent className="p-1.5">
                    <div className="space-y-0.5">
                      {items.map((tx) => {
                        const account = accounts.find((a) => a.id === tx.account_id)
                        const toAccount = accounts.find((a) => a.id === tx.to_account_id)
                        const category = categories.find((c) => c.id === tx.category_id)
                        const isIncome = tx.type === 'income'
                        const isTransfer = tx.type === 'transfer'

                        return (
                          <div
                            key={tx.id}
                            className="group flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div
                                className={cn(
                                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                                  isIncome
                                    ? 'bg-emerald-500/10 text-emerald-600'
                                    : isTransfer
                                    ? 'bg-brand/10 text-brand'
                                    : 'bg-red-500/10 text-red-600'
                                )}
                              >
                                {isIncome ? (
                                  <TrendingUp className="w-4 h-4" />
                                ) : isTransfer ? (
                                  <ArrowLeftRight className="w-4 h-4" />
                                ) : (
                                  <TrendingDown className="w-4 h-4" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate leading-tight">
                                  {tx.name}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                  <span className="tabular-nums">
                                    {formatTime(tx.date)}
                                  </span>
                                  <span>·</span>
                                  <span className="truncate">
                                    {isTransfer
                                      ? `${account?.name} → ${toAccount?.name}`
                                      : account?.name}
                                  </span>
                                  {category && !isTransfer && (
                                    <>
                                      <span>·</span>
                                      <span className="truncate">{category.name}</span>
                                    </>
                                  )}
                                  {tx.exclude_from_daily_budget && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] px-1 py-0 ml-0.5"
                                    >
                                      no-daily
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <p
                                className={cn(
                                  'text-sm font-semibold tabular-nums',
                                  isIncome
                                    ? 'text-emerald-600'
                                    : isTransfer
                                    ? 'text-brand'
                                    : 'text-slate-900 dark:text-white'
                                )}
                              >
                                {isIncome ? '+' : isTransfer ? '' : '-'}
                                {formatRupiah(Number(tx.amount_idr))}
                              </p>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEdit(tx)}>
                                    <Edit3 className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => deleteTransaction(tx.id)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}

      {/* Filter Sheet (mobile) */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="md:hidden">
          <SheetHeader>
            <SheetTitle>Filter</SheetTitle>
            <SheetDescription>Saring transaksi sesuai kebutuhan.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tipe</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Akun</label>
              <Select value={filterAccount} onValueChange={setFilterAccount}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Akun</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  resetFilters()
                  setFilterOpen(false)
                }}
              >
                Reset
              </Button>
              <Button
                className="flex-1"
                onClick={() => setFilterOpen(false)}
              >
                Terapkan
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Form Sheet (mobile) */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="md:hidden max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? 'Edit Transaksi' : 'Tambah Transaksi'}</SheetTitle>
            <SheetDescription>
              {editing ? 'Update detail transaksi.' : 'Catat transaksi baru.'}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <TransactionForm
              profileId={profileId}
              accounts={accounts}
              categories={categories}
              transaction={editing}
              onSuccess={closeForm}
              onCancel={closeForm}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Form Dialog (desktop) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="hidden md:block sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Transaksi' : 'Tambah Transaksi'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update detail transaksi.' : 'Catat transaksi baru.'}
            </DialogDescription>
          </DialogHeader>
          <TransactionForm
            profileId={profileId}
            accounts={accounts}
            categories={categories}
            transaction={editing}
            onSuccess={closeForm}
            onCancel={closeForm}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}