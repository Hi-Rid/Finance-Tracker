'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { NotificationRow } from '@/lib/notifications/types'

const PAGE_SIZE = 30
const POLL_INTERVAL = 60_000 // 60 detik

export function useNotifications() {
    const supabase = createClient()

    const [notifications, setNotifications] = useState<NotificationRow[]>([])
    const [loading, setLoading] = useState(true)

    const fetchAll = useCallback(async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
            setLoading(false)
            return
        }

        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(PAGE_SIZE)

        setNotifications((data as NotificationRow[]) || [])
        setLoading(false)
    }, [supabase])

    // Initial fetch
    useEffect(() => {
        fetchAll()
    }, [fetchAll])

    // Auto-refresh saat user balik ke tab
    useEffect(() => {
        function handleVisibility() {
            if (document.visibilityState === 'visible') {
                fetchAll()
            }
        }
        document.addEventListener('visibilitychange', handleVisibility)
        return () =>
            document.removeEventListener('visibilitychange', handleVisibility)
    }, [fetchAll])

    // Poll tiap 60 detik
    useEffect(() => {
        const id = setInterval(fetchAll, POLL_INTERVAL)
        return () => clearInterval(id)
    }, [fetchAll])

    const unreadCount = notifications.filter((n) => !n.is_read).length

    const markRead = useCallback(
        async (id: string) => {
            const target = notifications.find((n) => n.id === id)
            if (!target || target.is_read) return

            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            )

            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id)

            if (error) {
                console.error('[notif] mark read failed:', error)
                setNotifications((prev) =>
                    prev.map((n) =>
                        n.id === id ? { ...n, is_read: false } : n
                    )
                )
            }
        },
        [supabase, notifications]
    )

    const markAllRead = useCallback(async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false)

        if (error) {
            toast.error('Gagal tandai dibaca')
            fetchAll()
        }
    }, [supabase, fetchAll])

    const remove = useCallback(
        async (id: string) => {
            const prev = notifications
            setNotifications((list) => list.filter((n) => n.id !== id))

            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', id)

            if (error) {
                setNotifications(prev)
                toast.error('Gagal hapus notifikasi')
            }
        },
        [supabase, notifications]
    )

    const clearAll = useCallback(async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const prev = notifications
        setNotifications([])

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', user.id)

        if (error) {
            setNotifications(prev)
            toast.error('Gagal hapus semua')
        } else {
            toast.success('Semua notifikasi dihapus')
        }
    }, [supabase, notifications])

    const refresh = useCallback(() => {
        setLoading(true)
        fetchAll()
    }, [fetchAll])

    return {
        notifications,
        loading,
        unreadCount,
        markRead,
        markAllRead,
        remove,
        clearAll,
        refresh,
    }
}