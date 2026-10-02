'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetClose,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogoutButton } from '@/components/shared/logout-button'
import { Button } from '@/components/ui/button'
import { SynmonyMark } from '@/components/brand/synmony-logo'
import {
    LayoutDashboard,
    Receipt,
    Wallet,
    Target,
    Crown,
    Heart,
    Users,
    TrendingUp,
    ScanLine,
    FileText,
    Settings,
    Trophy,
} from 'lucide-react'

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/transactions', label: 'Transaksi', icon: Receipt },
    { href: '/accounts', label: 'Akun', icon: Wallet },
    { href: '/budget', label: 'Budget', icon: Target },
    { href: '/goals', label: 'Goals', icon: Trophy },
    { href: '/financial-freedom', label: 'Financial Freedom', icon: Crown },
    { href: '/wishlist', label: 'Wishlist', icon: Heart },
    { href: '/split-bill', label: 'Split Bill', icon: Users },
    { href: '/investments', label: 'Investasi', icon: TrendingUp },
    { href: '/receipts', label: 'Struk', icon: ScanLine },
    { href: '/reports', label: 'Laporan', icon: FileText },
    { href: '/settings', label: 'Settings', icon: Settings },
]

type MobileSidebarProfile = {
    name?: string | null
    avatar_url?: string | null
}

type MobileSidebarProps = {
    userEmail?: string | null
    profile?: MobileSidebarProfile | null
}

export function MobileSidebar({ userEmail, profile }: MobileSidebarProps) {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()
    const displayName = profile?.name || userEmail?.split('@')[0] || 'User'
    const initial = displayName.charAt(0).toUpperCase()

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden shrink-0"
                    aria-label="Buka menu"
                >
                    <Menu className="w-5 h-5" />
                </Button>
            </SheetTrigger>
            <SheetContent
                side="left"
                className="w-[85vw] max-w-[300px] p-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-active/30 flex flex-col"
            >
                {/* Header — compact */}
                <div className="p-3.5 border-b border-white/10 shrink-0">
                    <Link
                        href="/dashboard"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5"
                    >
                        <SynmonyMark size="lg" showDot className="w-9 h-9" />
                        <div className="min-w-0">
                            <div className="text-sm font-bold tracking-tight leading-none">
                                Synmony
                            </div>
                            <div className="text-[9px] text-sidebar-muted uppercase tracking-wider mt-1 truncate">
                                Second Brain for Your Money
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Nav — scrollable, compact */}
                <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
                    {navItems.map((item) => {
                        const Icon = item.icon

                        // FIX: match hanya exact atau sub-route
                        let isActive = false
                        if (item.href === '/transactions') {
                            isActive =
                                pathname === '/transactions' ||
                                pathname.startsWith('/transactions/')
                        } else {
                            isActive =
                                pathname === item.href ||
                                pathname.startsWith(item.href + '/')
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setOpen(false)}
                                className={cn(
                                    'relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all',
                                    isActive
                                        ? 'bg-sidebar-active text-white shadow-sm shadow-sidebar-active/30'
                                        : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-white'
                                )}
                            >
                                <Icon
                                    className="w-3.5 h-3.5 shrink-0"
                                    strokeWidth={2}
                                />
                                <span className="truncate">{item.label}</span>
                                {isActive && (
                                    <div className="absolute right-2.5 w-1 h-1 rounded-full bg-white/80" />
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* User card — compact */}
                <div className="p-2.5 border-t border-white/10 space-y-1.5 shrink-0">
                    <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 flex items-center gap-2.5">
                        <Avatar className="size-8 ring-2 ring-white/20 shrink-0">
                            {profile?.avatar_url && (
                                <AvatarImage
                                    src={profile.avatar_url}
                                    alt={displayName}
                                />
                            )}
                            <AvatarFallback className="bg-gradient-to-br from-primary-400 to-primary-700 text-white font-semibold text-xs">
                                {initial}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold truncate">
                                {displayName}
                            </div>
                            <div className="text-[9px] text-sidebar-muted truncate flex items-center gap-1">
                                <Sparkles className="w-2 h-2" />
                                Personal Account
                            </div>
                        </div>
                    </div>

                    <LogoutButton variant="sidebar" />
                </div>
            </SheetContent>
        </Sheet>
    )
}