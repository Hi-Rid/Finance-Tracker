'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, List, Plus, Wallet, User } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/transactions', label: 'Transaksi', icon: List },
  { href: '/transactions/new', label: 'Add', icon: Plus, isCenter: true },
  { href: '/budget', label: 'Budget', icon: Wallet },
  { href: '/settings', label: 'Profil', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' &&
              !item.isCenter &&
              pathname.startsWith(item.href))

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-center w-12 h-12 -mt-6 rounded-full bg-brand hover:bg-brand-hover text-brand-foreground shadow-lg shadow-brand/30 transition-all hover:scale-105"
                aria-label={item.label}
              >
                <Icon className="w-6 h-6" strokeWidth={2.5} />
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors',
                isActive ? 'text-brand' : 'text-muted-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}