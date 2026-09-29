'use client'

import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, Trash2, X, Loader2 } from 'lucide-react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { NotificationRow } from '@/lib/notifications/types'

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    notifications: NotificationRow[]
    loading: boolean
    unreadCount: number
    onMarkRead: (id: string) => void
    onMarkAllRead: () => void
    onRemove: (id: string) => void
    onClearAll: () => void
}

function formatRelativeTime(dateStr: string): string {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()

    const min = Math.floor(diff / 60000)
    const hour = Math.floor(diff / 3600000)
    const day = Math.floor(diff / 86400000)

    if (min < 1) return 'Baru saja'
    if (min < 60) return `${min} menit lalu`
    if (hour < 24) return `${hour} jam lalu`
    if (day < 7) return `${day} hari lalu`

    return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
}

export function NotificationDrawer({
    open,
    onOpenChange,
    notifications,
    loading,
    unreadCount,
    onMarkRead,
    onMarkAllRead,
    onRemove,
    onClearAll,
}: Props) {
    const router = useRouter()

    function handleClick(n: NotificationRow) {
        if (!n.is_read) onMarkRead(n.id)
        if (n.link) {
            onOpenChange(false)
            router.push(n.link)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-md p-0 flex flex-col gap-0"
            >
                <SheetHeader className="p-4 pb-3 border-b border-slate-200 dark:border-white/10 shrink-0 space-y-0">
                    <div className="flex items-center gap-2 pr-8">
                        <SheetTitle className="flex items-center gap-2 text-base">
                            <Bell className="w-4 h-4" />
                            Notifikasi
                            {unreadCount > 0 && (
                                <span className="text-xs font-medium text-muted-foreground">
                                    ({unreadCount} baru)
                                </span>
                            )}
                        </SheetTitle>
                    </div>

                    {notifications.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-2">
                            {unreadCount > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onMarkAllRead}
                                    className="h-7 text-[11px] gap-1.5"
                                >
                                    <CheckCheck className="w-3 h-3" />
                                    Tandai dibaca
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClearAll}
                                className="h-7 text-[11px] gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                            >
                                <Trash2 className="w-3 h-3" />
                                Hapus semua
                            </Button>
                        </div>
                    )}
                </SheetHeader>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-5 h-5 animate-spin text-brand" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-3">
                                <Bell className="w-6 h-6 text-slate-400" />
                            </div>
                            <p className="text-sm font-medium mb-0.5">
                                Belum ada notifikasi
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Notif bakal muncul di sini
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                            {notifications.map((n) => (
                                <NotificationItem
                                    key={n.id}
                                    notification={n}
                                    onClick={() => handleClick(n)}
                                    onRemove={() => onRemove(n.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}

function NotificationItem({
    notification,
    onClick,
    onRemove,
}: {
    notification: NotificationRow
    onClick: () => void
    onRemove: () => void
}) {
    return (
        <div
            onClick={onClick}
            className={cn(
                'group relative flex items-start gap-3 p-4 transition-colors cursor-pointer',
                !notification.is_read &&
                'bg-brand/[0.03] dark:bg-brand/[0.05]',
                'hover:bg-slate-50 dark:hover:bg-white/[0.03]'
            )}
        >
            {!notification.is_read && (
                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-brand" />
            )}

            <div className="flex-1 min-w-0 pl-1">
                <p
                    className={cn(
                        'text-sm leading-tight mb-0.5',
                        !notification.is_read ? 'font-semibold' : 'font-medium'
                    )}
                >
                    {notification.title}
                </p>
                {notification.body && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">
                        {notification.body}
                    </p>
                )}
                <p className="text-[10px] text-muted-foreground/70 tabular-nums">
                    {formatRelativeTime(notification.created_at)}
                </p>
            </div>

            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    onRemove()
                }}
                className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                aria-label="Hapus notifikasi"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    )
}