'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Receipt,
  ScanLine,
  Wallet,
  Target,
  Heart,
  Users,
  TrendingUp,
  Plane,
  FileText,
  Settings,
  Sparkles,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogoutButton } from '@/components/shared/logout-button'

const navItems = [
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
]

type SidebarProps = {
  userEmail?: string | null
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname()
  const initial = userEmail?.[0]?.toUpperCase() || 'U'

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 p-3">
      {/* Floating container */}
      <div className="flex flex-col h-[calc(100vh-1.5rem)] sticky top-3 rounded-3xl bg-sidebar text-sidebar-foreground shadow-xl shadow-navy/20 dark:shadow-black/50 overflow-hidden">
        {/* Gradient overlay subtle */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

        {/* Logo */}
        <div className="relative p-6 pb-4">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-brand/30 transition-transform group-hover:scale-105">
              S
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-sidebar" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight leading-none">
                Synmony
              </div>
              <div className="text-[10px] text-sidebar-muted uppercase tracking-wider mt-0.5">
                Second Brain for Money
              </div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="relative flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            let isActive =
              pathname === item.href || pathname.startsWith(item.href + '/')

            // Related sub-routes: /cash-flow dianggap bagian dari /transactions
            if (item.href === '/transactions') {
              if (
                pathname.startsWith('/cash-flow') ||
                pathname.startsWith('/receipts')
              ) {
                isActive = true
              }
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-active text-white shadow-lg shadow-sidebar-active/30'
                    : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-white'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
                <span>{item.label}</span>
                {isActive && (
                  <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white/80" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User card */}
        <div className="relative p-3 space-y-2">
          <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-3 flex items-center gap-3">
            <Avatar className="size-9 ring-2 ring-white/20">
              <AvatarFallback className="bg-gradient-to-br from-primary-400 to-primary-700 text-white font-semibold text-sm">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">
                {userEmail?.split('@')[0] || 'User'}
              </div>
              <div className="text-[10px] text-sidebar-muted truncate flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Personal Account
              </div>
            </div>
          </div>

          <LogoutButton variant="sidebar" />
          <div className="text-[10px] text-sidebar-muted text-center mt-2 opacity-60">
            Synmony v0.1.0
          </div>
        </div>
      </div>
    </aside>
  )
}