'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/lib/hooks/use-notifications'
import { NotificationDrawer } from './notification-drawer'

export function NotificationBell() {
    const [open, setOpen] = useState(false)
    const {
        notifications,
        loading,
        unreadCount,
        markRead,
        markAllRead,
        remove,
        clearAll,
        refresh,
    } = useNotifications()

    function handleOpen() {
        setOpen(true)
        refresh()
    }

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={handleOpen}
                className="relative"
                aria-label="Notifikasi"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-background tabular-nums leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </Button>

            <NotificationDrawer
                open={open}
                onOpenChange={setOpen}
                notifications={notifications}
                loading={loading}
                unreadCount={unreadCount}
                onMarkRead={markRead}
                onMarkAllRead={markAllRead}
                onRemove={remove}
                onClearAll={clearAll}
            />
        </>
    )
}