'use client'

import { useState, useMemo, useEffect } from 'react'
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
import { AnimatedCheckbox } from '@/components/ui/animated-checkbox'
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
import { TransactionDetail } from './transaction-detail'
import { useTransactions } from '@/lib/hooks/use-transactions'
import { formatRupiah } from '@/lib/normalize'
import { DateFilter } from '@/components/shared/date-filter'
import {
  type DateRange,
  EMPTY_DATE_RANGE,
  isDateInRange,
} from '@/lib/utils/date-range'
import { usePagination } from '@/lib/hooks/use-pagination'
import { Pagination } from '@/components/shared/pagination'
import { BulkActionBar } from '@/components/shared/bulk-action-bar'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { formatDateGroupWIB, formatTimeWIB, getDateKeyWIB } from '@/lib/utils/datetime'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Account = Database['public']['Tables']['accounts']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Transaction = Database['public']['Tables']['transactions']['Row']
type DailyItem = Database['public']['Tables']['daily_budget_items']['Row']
type ReceiptRow = Database['public']['Tables']['receipts']['Row']

type TransactionsListProps = {
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
  receipts: ReceiptRow[]
  dailyItems: DailyItem[]
  profileId: string
}

function groupByDateKey(transactions: Transaction[]) {
  const groups: Record<string, Transaction[]> = {}
  transactions.forEach((t) => {
    const key = getDateKeyWIB(t.date)
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  })
  return groups
}

export function TransactionsList({
  transactions,
  accounts,
  categories,
  receipts,
  dailyItems,
  profileId,
}: TransactionsListProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [detailTx, setDetailTx] = useState<Transaction | null>(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterAccount, setFilterAccount] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange>(EMPTY_DATE_RANGE)
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { deleteTransaction, bulkDeleteTransactions } = useTransactions()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing(null)
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setSheetOpen(true)
      } else {
        setDialogOpen(true)
      }
      router.replace(pathname, { scroll: false })
    }
  }, [searchParams, router, pathname])

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase()))
        return false
      if (filterType !== 'all' && t.type !== filterType) return false
      if (filterAccount !== 'all' && t.account_id !== filterAccount) return false
      if (!isDateInRange(t.date, dateRange)) return false
      return true
    })
  }, [transactions, search, filterType, filterAccount, dateRange])

  // Pagination
  const pagination = usePagination(filtered, 20)
  const {
    page,
    perPage,
    totalItems,
    totalPages,
    paginatedItems,
    setPage,
    setPerPage,
    canNext,
    canPrev,
    nextPage,
    prevPage,
    from,
    to,
    reset: resetPage,
  } = pagination

  // Group paginated items
  const grouped = useMemo(() => groupByDateKey(paginatedItems), [paginatedItems])
  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  // Selection state
  const pageIds = paginatedItems.map((t) => t.id)
  const allOnPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id))
  const someOnPageSelected =
    !allOnPageSelected && pageIds.some((id) => selectedIds.has(id))

  function toggleSelectAllOnPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allOnPageSelected) {
        pageIds.forEach((id) => next.delete(id))
      } else {
        pageIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  // Reset page kalau filter berubah
  useEffect(() => {
    resetPage()
  }, [search, filterType, filterAccount, dateRange])

  const totalIncome = filtered
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount_idr), 0)
  const totalExpense = filtered
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount_idr), 0)

  const hasActiveFilter =
    filterType !== 'all' ||
    filterAccount !== 'all' ||
    dateRange.preset !== 'all'

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
    setDateRange(EMPTY_DATE_RANGE)
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return
    const count = selectedIds.size
    if (!confirm(`Hapus ${count} transaksi? Bisa di-restore dari Trash.`)) return

    const result = await bulkDeleteTransactions(Array.from(selectedIds))
    if (result.success) {
      clearSelection()
    }
  }

  return (
    <>
      {/* Summary */}
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

      {/* Search + filter */}
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

        <div className="hidden md:block">
          <DateFilter value={dateRange} onChange={setDateRange} />
        </div>

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

      {/* Active chips */}
      {hasActiveFilter && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {filterType !== 'all' && (
            <Badge variant="default" className="gap-1">
              {filterType === 'income'
                ? 'Income'
                : filterType === 'expense'
                  ? 'Expense'
                  : 'Transfer'}
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
          {dateRange.preset !== 'all' && (
            <Badge variant="default" className="gap-1">
              {dateRange.preset === 'today'
                ? 'Hari ini'
                : dateRange.preset === '7days'
                  ? '7 hari'
                  : dateRange.preset === '30days'
                    ? '30 hari'
                    : dateRange.preset === 'thisMonth'
                      ? 'Bulan ini'
                      : dateRange.preset === 'lastMonth'
                        ? 'Bulan lalu'
                        : 'Custom'}
              <button
                onClick={() => setDateRange(EMPTY_DATE_RANGE)}
                className="cursor-pointer hover:opacity-70"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Select-all bar */}
      {paginatedItems.length > 0 && (
        <div className="flex items-center justify-between gap-3 mb-3 px-1">
          <div
            onClick={toggleSelectAllOnPage}
            className="flex items-center gap-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer select-none group"
          >
            <AnimatedCheckbox
              checked={allOnPageSelected}
              indeterminate={someOnPageSelected && !allOnPageSelected}
              onCheckedChange={toggleSelectAllOnPage}
              ariaLabel="Pilih semua di halaman ini"
            />
            <span>
              {allOnPageSelected
                ? `Semua di halaman ini (${pageIds.length})`
                : 'Pilih semua di halaman'}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground tabular-nums">
            {from}–{to} dari {totalItems}
          </p>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Receipt}
              title={
                search || hasActiveFilter ? 'Gak ada hasil' : 'Belum ada transaksi'
              }
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
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {formatDateGroupWIB(items[0].date)}
                  </p>
                  <p
                    className={cn(
                      'text-[10px] sm:text-xs font-semibold tabular-nums',
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
                        const toAccount = accounts.find(
                          (a) => a.id === tx.to_account_id
                        )
                        const category = categories.find(
                          (c) => c.id === tx.category_id
                        )
                        const isIncome = tx.type === 'income'
                        const isTransfer = tx.type === 'transfer'
                        const isSelected = selectedIds.has(tx.id)

                        return (
                          <div
                            key={tx.id}
                            className={cn(
                              'group flex items-center gap-2 py-2.5 px-2 rounded-xl transition-colors',
                              isSelected
                                ? 'bg-brand/5 dark:bg-brand/10'
                                : 'hover:bg-slate-50 dark:hover:bg-white/5'
                            )}
                          >
                            {/* Checkbox */}
                            <AnimatedCheckbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelect(tx.id)}
                              ariaLabel={`Pilih ${tx.name}`}
                            />

                            {/* Clickable content */}
                            <div
                              onClick={() => setDetailTx(tx)}
                              className="flex items-center justify-between flex-1 min-w-0 cursor-pointer gap-2"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div
                                  className={cn(
                                    'w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0',
                                    isIncome
                                      ? 'bg-emerald-500/10 text-emerald-600'
                                      : isTransfer
                                        ? 'bg-brand/10 text-brand'
                                        : 'bg-red-500/10 text-red-600'
                                  )}
                                >
                                  {isIncome ? (
                                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  ) : isTransfer ? (
                                    <ArrowLeftRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  ) : (
                                    <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="text-xs sm:text-sm font-medium truncate leading-tight">
                                    {tx.name}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                                    <span className="tabular-nums">
                                      {formatTimeWIB(tx.date)}
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
                                        <span className="truncate">
                                          {category.name}
                                        </span>
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

                              <p
                                className={cn(
                                  'text-xs sm:text-sm font-semibold tabular-nums shrink-0',
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
                            </div>

                            {/* Actions */}
                            <div
                              className="shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
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
                                <DropdownMenuContent
                                  align="end"
                                  className="min-w-[160px]"
                                >
                                  <DropdownMenuItem
                                    onSelect={() => openEdit(tx)}
                                    className="whitespace-nowrap"
                                  >
                                    <Edit3 className="w-4 h-4 mr-2 shrink-0" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={() => deleteTransaction(tx.id)}
                                    className="text-red-600 focus:text-red-600 whitespace-nowrap"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2 shrink-0" />
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

          {/* Pagination */}
          <Pagination
            page={page}
            perPage={perPage}
            totalItems={totalItems}
            totalPages={totalPages}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
          />
        </div>
      )}

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        totalOnPage={pageIds.length}
        onClearSelection={clearSelection}
        actions={[
          {
            label: 'Hapus',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: handleBulkDelete,
            variant: 'destructive',
          },
        ]}
      />

      {/* Filter Sheet mobile */}
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
            <div>
              <label className="text-sm font-medium mb-2 block">Tanggal</label>
              <DateFilter value={dateRange} onChange={setDateRange} fullWidth />
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
              <Button className="flex-1" onClick={() => setFilterOpen(false)}>
                Terapkan
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Detail Sheet mobile */}
      <Sheet
        open={
          !!detailTx &&
          typeof window !== 'undefined' &&
          window.innerWidth < 768
        }
        onOpenChange={(o) => !o && setDetailTx(null)}
      >
        <SheetContent
          side="bottom"
          className="md:hidden p-0 max-h-[92vh] flex flex-col gap-0 overflow-hidden rounded-t-3xl"
        >
          <div className="pt-3 pb-1 flex justify-center shrink-0">
            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-white/20" />
          </div>
          {detailTx && (
            <TransactionDetail
              transaction={detailTx}
              account={accounts.find((a) => a.id === detailTx.account_id)}
              toAccount={accounts.find((a) => a.id === detailTx.to_account_id)}
              category={categories.find((c) => c.id === detailTx.category_id)}
              receipt={
                receipts.find((r) => r.transaction_id === detailTx.id) || null
              }
              onEdit={() => {
                const tx = detailTx
                setDetailTx(null)
                setTimeout(() => openEdit(tx), 200)
              }}
              onDelete={() => {
                if (confirm('Yakin hapus transaksi ini?')) {
                  deleteTransaction(detailTx.id)
                  setDetailTx(null)
                }
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Detail Dialog desktop */}
      <Dialog
        open={
          !!detailTx &&
          typeof window !== 'undefined' &&
          window.innerWidth >= 768
        }
        onOpenChange={(o) => !o && setDetailTx(null)}
      >
        <DialogContent className="hidden md:flex sm:max-w-2xl p-0 max-h-[90vh] flex-col gap-0 overflow-hidden">
          {detailTx && (
            <TransactionDetail
              transaction={detailTx}
              account={accounts.find((a) => a.id === detailTx.account_id)}
              toAccount={accounts.find((a) => a.id === detailTx.to_account_id)}
              category={categories.find((c) => c.id === detailTx.category_id)}
              receipt={
                receipts.find((r) => r.transaction_id === detailTx.id) || null
              }
              onEdit={() => {
                const tx = detailTx
                setDetailTx(null)
                setTimeout(() => openEdit(tx), 200)
              }}
              onDelete={() => {
                if (confirm('Yakin hapus transaksi ini?')) {
                  deleteTransaction(detailTx.id)
                  setDetailTx(null)
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Form Sheet mobile */}
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
              dailyItems={dailyItems}
              transaction={editing}
              onSuccess={closeForm}
              onCancel={closeForm}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Form Dialog desktop */}
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
            dailyItems={dailyItems}
            transaction={editing}
            onSuccess={closeForm}
            onCancel={closeForm}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}