'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    User,
    Shield,
    Bell,
    Palette,
    Database,
    ScrollText,
    Wallet,
    Tags,
    Settings2,
} from 'lucide-react'
import { PageWrapper, PageHeader } from '@/components/layout/page-wrapper'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

const tabs = [
    { href: '/settings', label: 'Profile', icon: User },
    { href: '/settings/security', label: 'Keamanan', icon: Shield },
    { href: '/settings/notifications', label: 'Notifikasi', icon: Bell },
    { href: '/settings/appearance', label: 'Tampilan', icon: Palette },
    { href: '/settings/accounts', label: 'Akun', icon: Wallet },
    { href: '/settings/categories', label: 'Kategori', icon: Tags },
    { href: '/settings/audit-log', label: 'Audit Log', icon: ScrollText },
    { href: '/settings/data', label: 'Data', icon: Database },
]

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()

    const activeTab =
        tabs.find(
            (t) =>
                t.href === pathname ||
                (t.href !== '/settings' && pathname.startsWith(t.href))
        ) || tabs[0]

    return (
        <PageWrapper>
            <PageHeader
                title="Settings"
                description="Kelola preferensi & data akun lu"
            />

            {/* MOBILE — Dropdown Select */}
            <div className="md:hidden mb-6">
                <Select
                    value={activeTab.href}
                    onValueChange={(href) => router.push(href)}
                >
                    <SelectTrigger className="w-full h-11">
                        <div className="flex items-center gap-2 min-w-0">
                            <activeTab.icon className="w-4 h-4 shrink-0 opacity-60" />
                            <SelectValue />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            return (
                                <SelectItem key={tab.href} value={tab.href}>
                                    <div className="flex items-center gap-2">
                                        <Icon className="w-4 h-4 opacity-60" />
                                        {tab.label}
                                    </div>
                                </SelectItem>
                            )
                        })}
                    </SelectContent>
                </Select>
            </div>

            {/* DESKTOP — Tab bar */}
            <div className="hidden md:flex flex-wrap gap-1.5 mb-6">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive =
                        pathname === tab.href ||
                        (tab.href !== '/settings' && pathname.startsWith(tab.href))

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
                                isActive
                                    ? 'bg-brand text-white shadow-sm shadow-brand/30'
                                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10'
                            )}
                        >
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            {tab.label}
                        </Link>
                    )
                })}
            </div>

            {children}
        </PageWrapper>
    )
}