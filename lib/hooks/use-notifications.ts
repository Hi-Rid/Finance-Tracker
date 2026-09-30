'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { NotificationRow } from '@/lib/notifications/types'

const PAGE_SIZE = 30
const POLL_INTERVAL = 60_000

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

    // Realtime subscription
    useEffect(() => {
        let mounted = true
        let channel: any = null

        async function setup() {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user || !mounted) return

            channel = supabase
                .channel(`notifications:${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`,
                    },
                    (payload) => {
                        const newNotif = payload.new as NotificationRow

                        setNotifications((prev) => {
                            if (prev.some((n) => n.id === newNotif.id)) {
                                return prev
                            }
                            return [newNotif, ...prev].slice(0, PAGE_SIZE)
                        })

                        toast.success(newNotif.title, {
                            description: newNotif.body || undefined,
                            duration: 5000,
                        })
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log('[notif] realtime connected')
                    }
                    if (status === 'CHANNEL_ERROR') {
                        console.warn('[notif] realtime error, fallback to polling')
                    }
                })
        }

        setup()

        return () => {
            mounted = false
            if (channel) {
                supabase.removeChannel(channel)
            }
        }
    }, [supabase])

    // Auto-refresh saat tab balik ke aktif
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

    // Fallback poll tiap 60 detik
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