'use client'

import { Search, Bell } from 'lucide-react'
import { MobileSidebar } from './mobile-sidebar'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transaksi',
  '/receipts': 'Struk',
  '/accounts': 'Akun',
  '/budget': 'Budget',
  '/wishlist': 'Wishlist',
  '/split-bill': 'Split Bill',
  '/investments': 'Investasi',
  '/trips': 'Travel',
  '/reports': 'Laporan',
  '/settings': 'Settings',
}

function getPageTitle(pathname: string): string {
  for (const [path, title] of Object.entries(pageTitles)) {
    if (pathname === path || pathname.startsWith(path + '/')) {
      return title
    }
  }
  return 'Finance'
}

type HeaderProps = {
  userEmail?: string | null
}

export function Header({ userEmail }: HeaderProps) {
  const pathname = usePathname()
  const initial = userEmail?.[0]?.toUpperCase() || 'U'
  const pageTitle = getPageTitle(pathname)

  function triggerCommandPalette() {
    // Trigger via keyboard event biar CommandPalette handle
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: isMac,
      ctrlKey: !isMac,
      bubbles: true,
    })
    document.dispatchEvent(event)
  }

  return (
    <header className="sticky top-0 z-30 bg-background/70 backdrop-blur-xl border-b border-border/60">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Page title + mobile brand */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          {/* Mobile menu hamburger */}
          <MobileSidebar userEmail={userEmail} />

          <div className="md:hidden flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-brand/30">
              S
            </div>
          </div>
          <div className="min-w-0">
            <h1 className="text-base md:text-lg font-semibold tracking-tight truncate">
              {pageTitle}
            </h1>
            <p className="hidden md:block text-xs text-muted-foreground truncate">
              {userEmail || 'Welcome back'}
            </p>
          </div>
        </div>

        {/* Search (desktop only) */}
        <div className="hidden md:flex items-center flex-1 max-w-sm mx-6">
          <button
            type="button"
            onClick={triggerCommandPalette}
            className="group flex items-center gap-2 w-full h-9 px-3 rounded-xl border border-border/60 bg-card/50 hover:bg-card transition-all text-sm text-muted-foreground hover:border-primary-400/40 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left">Cari apapun...</span>
            <kbd className="text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border/60 font-mono">
              {typeof navigator !== 'undefined' &&
                navigator.platform.toUpperCase().indexOf('MAC') >= 0
                ? '⌘K'
                : 'Ctrl+K'}
            </kbd>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search"
            className="md:hidden"
            onClick={triggerCommandPalette}
          >
            <Search className="w-5 h-5" />
          </Button>

          <ThemeToggle />

          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            className="relative"
          >
            <Bell className="w-5 h-5" />
            {/* TODO: uncomment setelah notification system jadi
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-background" />
            )}
            */}
          </Button>

          <Avatar className="size-8 ml-1 ring-2 ring-primary-400/30">
            <AvatarFallback className="bg-brand text-brand-foreground font-semibold text-xs">
              {initial}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}