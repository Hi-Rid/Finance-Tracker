'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LogOut, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { lockSession } from '@/lib/hooks/use-pin'

type LogoutButtonProps = {
    className?: string
    variant?: 'sidebar' | 'default'
}

export function LogoutButton({
    className,
    variant = 'default',
}: LogoutButtonProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handleLogout() {
        setLoading(true)
        try {
            const supabase = createClient()
            await supabase.auth.signOut()
            lockSession()
            toast.success('Logged out')
            router.push('/login')
            router.refresh()
        } catch (err) {
            toast.error('Gagal logout')
            setLoading(false)
        }
    }

    if (variant === 'sidebar') {
        return (
            <button
                type="button"
                onClick={handleLogout}
                disabled={loading}
                className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer w-full',
                    'text-sidebar-muted hover:bg-sidebar-hover hover:text-white',
                    loading && 'opacity-50 cursor-not-allowed',
                    className
                )}
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                ) : (
                    <LogOut className="w-4 h-4 shrink-0" />
                )}
                <span>Logout</span>
            </button>
        )
    }

    return (
        <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10',
                loading && 'opacity-50 cursor-not-allowed',
                className
            )}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
            ) : (
                <LogOut className="w-4 h-4 shrink-0" />
            )}
            <span>Logout</span>
        </button>
    )
}