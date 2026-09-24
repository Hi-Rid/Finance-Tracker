'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
    LayoutDashboard,
    Receipt,
    Wallet,
    Target,
    Heart,
    Users,
    TrendingUp,
    Plane,
    ScanLine,
    FileText,
    Settings,
    Plus,
    Camera,
    LogOut,
    ScrollText,
    Loader2,
    CornerDownLeft,
} from 'lucide-react'
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah } from '@/lib/normalize'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Account = Database['public']['Tables']['accounts']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Transaction = Database['public']['Tables']['transactions']['Row']

const PAGES = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/transactions', label: 'Transaksi', icon: Receipt },
    { href: '/accounts', label: 'Akun', icon: Wallet },
    { href: '/budget', label: 'Budget', icon: Target },
    { href: '/wishlist', label: 'Wishlist', icon: Heart },
    { href: '/split-bill', label: 'Split Bill', icon: Users },
    { href: '/investments', label: 'Investasi', icon: TrendingUp },
    { href: '/trips', label: 'Travel', icon: Plane },
    { href: '/receipts', label: 'Struk', icon: ScanLine },
    { href: '/reports', label: 'Laporan', icon: FileText },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/settings/audit-log', label: 'Audit Log', icon: ScrollText },
]

const ACTIONS = [
    { label: 'Tambah Transaksi', href: '/transactions?new=1', icon: Plus },
    { label: 'Scan Struk', href: '/transactions?new=1&scan=1', icon: Camera },
    { label: 'Tambah Akun', href: '/accounts?new=1', icon: Plus },
]

export function CommandPalette() {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [accounts, setAccounts] = useState<Account[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [hasLoadedInitial, setHasLoadedInitial] = useState(false)

    const fetchData = useCallback(async () => {
        if (hasLoadedInitial) return
        setLoading(true)
        const supabase = createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const [accountsRes, categoriesRes, transactionsRes] = await Promise.all([
            supabase
                .from('accounts')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_archived', false)
                .order('name')
                .limit(50),
            supabase
                .from('categories')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_archived', false)
                .order('name')
                .limit(100),
            supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_deleted', false)
                .order('date', { ascending: false })
                .limit(50),
        ])

        setAccounts(accountsRes.data || [])
        setCategories(categoriesRes.data || [])
        setTransactions(transactionsRes.data || [])
        setHasLoadedInitial(true)
        setLoading(false)
    }, [hasLoadedInitial])

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((o) => !o)
            }
        }
        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [])

    useEffect(() => {
        if (!open) {
            setTimeout(() => setQuery(''), 200)
        } else {
            fetchData()
        }
    }, [open, fetchData])

    const filteredAccounts = useMemo(() => {
        if (!query) return accounts.slice(0, 5)
        const q = query.toLowerCase()
        return accounts.filter((a) => a.name.toLowerCase().includes(q)).slice(0, 5)
    }, [accounts, query])

    const filteredCategories = useMemo(() => {
        if (!query) return []
        const q = query.toLowerCase()
        return categories.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 5)
    }, [categories, query])

    const filteredTransactions = useMemo(() => {
        if (!query) return []
        const q = query.toLowerCase()
        return transactions.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 5)
    }, [transactions, query])

    function handleSelect(href: string) {
        setOpen(false)
        router.push(href)
    }

    async function handleLogout() {
        setOpen(false)
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput
                placeholder="Cari halaman, akun, transaksi, aksi..."
                value={query}
                onValueChange={setQuery}
            />
            <CommandList>
                <CommandEmpty>
                    {loading ? (
                        <div className="flex items-center justify-center gap-2 py-6">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Loading...</span>
                        </div>
                    ) : (
                        <div className="py-6 text-center">
                            <p className="text-sm font-medium mb-1">Gak ada hasil</p>
                            <p className="text-xs text-muted-foreground">
                                Gak nemu &quot;{query}&quot;. Coba keyword lain.
                            </p>
                        </div>
                    )}
                </CommandEmpty>

                {/* Actions */}
                {(!query || query.length < 3) && (
                    <CommandGroup heading="Aksi Cepat">
                        {ACTIONS.map((action) => {
                            const Icon = action.icon
                            return (
                                <CommandItem
                                    key={action.label}
                                    value={action.label}
                                    onSelect={() => handleSelect(action.href)}
                                >
                                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand/10 shrink-0">
                                        <Icon className="w-3.5 h-3.5 text-brand!" />
                                    </div>
                                    <span className="font-medium">{action.label}</span>
                                </CommandItem>
                            )
                        })}
                    </CommandGroup>
                )}

                {/* Pages */}
                {PAGES.filter(
                    (p) => !query || p.label.toLowerCase().includes(query.toLowerCase())
                ).length > 0 && (
                        <>
                            {(!query || query.length < 3) && <CommandSeparator />}
                            <CommandGroup heading="Halaman">
                                {PAGES.filter(
                                    (p) => !query || p.label.toLowerCase().includes(query.toLowerCase())
                                ).map((page) => {
                                    const Icon = page.icon
                                    return (
                                        <CommandItem
                                            key={page.href}
                                            value={page.label}
                                            onSelect={() => handleSelect(page.href)}
                                        >
                                            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 shrink-0">
                                                <Icon className="w-3.5 h-3.5" />
                                            </div>
                                            <span>{page.label}</span>
                                            <span className="ml-auto text-[10px] text-muted-foreground/60 font-mono">
                                                {page.href}
                                            </span>
                                        </CommandItem>
                                    )
                                })}
                            </CommandGroup>
                        </>
                    )}

                {/* Accounts */}
                {filteredAccounts.length > 0 && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading="Akun">
                            {filteredAccounts.map((acc) => (
                                <CommandItem
                                    key={acc.id}
                                    value={`account-${acc.id}-${acc.name}`}
                                    onSelect={() => handleSelect('/accounts')}
                                >
                                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 shrink-0">
                                        <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400!" />
                                    </div>
                                    <span className="font-medium">{acc.name}</span>
                                    <span className="ml-auto text-xs text-muted-foreground tabular-nums shrink-0">
                                        {formatRupiah(Number(acc.current_balance))}
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </>
                )}

                {/* Categories */}
                {filteredCategories.length > 0 && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading="Kategori">
                            {filteredCategories.map((cat) => (
                                <CommandItem
                                    key={cat.id}
                                    value={`category-${cat.id}-${cat.name}`}
                                    onSelect={() => handleSelect('/transactions')}
                                >
                                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/10 shrink-0">
                                        <Target className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400!" />
                                    </div>
                                    <span>{cat.name}</span>
                                    <span
                                        className={cn(
                                            'ml-auto text-[10px] uppercase font-medium shrink-0',
                                            cat.type === 'income'
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-red-600 dark:text-red-400'
                                        )}
                                    >
                                        {cat.type === 'income' ? 'Masuk' : 'Keluar'}
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </>
                )}

                {/* Transactions */}
                {filteredTransactions.length > 0 && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading="Transaksi">
                            {filteredTransactions.map((tx) => (
                                <CommandItem
                                    key={tx.id}
                                    value={`tx-${tx.id}-${tx.name}`}
                                    onSelect={() => handleSelect('/transactions')}
                                >
                                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 shrink-0">
                                        <Receipt className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="truncate text-sm">{tx.name}</span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {new Date(tx.date).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                    <span
                                        className={cn(
                                            'text-xs font-medium tabular-nums shrink-0',
                                            tx.type === 'income'
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-red-600 dark:text-red-400'
                                        )}
                                    >
                                        {tx.type === 'income' ? '+' : '-'}
                                        {formatRupiah(Number(tx.amount_idr))}
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </>
                )}

                {/* Logout */}
                <CommandSeparator />
                <CommandGroup heading="Lainnya">
                    <CommandItem
                        value="logout keluar sign out"
                        onSelect={handleLogout}
                        className="text-red-600 dark:text-red-400 data-[selected=true]:bg-red-50 dark:data-[selected=true]:bg-red-500/10"
                    >
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/10 shrink-0">
                            <LogOut className="w-3.5 h-3.5 text-red-600 dark:text-red-400!" />
                        </div>
                        <span>Logout</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>

            {/* Footer hint */}
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/10 px-4 py-2 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                        <kbd className="bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 font-mono">
                            ↑↓
                        </kbd>
                        Navigasi
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 font-mono">
                            <CornerDownLeft className="w-2.5 h-2.5" />
                        </kbd>
                        Pilih
                    </span>
                </div>
                <span className="flex items-center gap-1">
                    <kbd className="bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 font-mono">
                        Esc
                    </kbd>
                    Tutup
                </span>
            </div>
        </CommandDialog>
    )
}